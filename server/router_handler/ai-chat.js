const OpenAI = require('openai')
const db = require('../db/index')

// 初始化DeepSeek客户端
const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: 'sk-77d99dff614849dab3efe7f85611a883'
})

// 系统提示词 - 教育助手
const SYSTEM_PROMPT = `你是一位专业的教育助手，擅长回答学习相关的问题。请用清晰、易懂的方式回答学生的问题，必要时可以举例说明。如果问题与编程相关，请提供代码示例并解释代码原理。`

// AI聊天接口（支持流式输出）
exports.chat = async (req, res) => {
  try {
    const { message, userId, conversationId } = req.body
    
    if (!message) {
      return res.status(400).json({ status: 1, message: '消息内容不能为空' })
    }

    // 获取历史对话记录
    let messages = [{ role: 'system', content: SYSTEM_PROMPT }]
    
    if (userId) {
      const history = await getConversationHistory(userId, conversationId)
      messages = messages.concat(history)
    }
    
    // 添加当前用户消息
    messages.push({ role: 'user', content: message })

    // 设置SSE响应头
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    // 调用DeepSeek API（流式）
    const stream = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: messages,
      stream: true
    })

    let fullResponse = ''
    let newConversationId = conversationId || Date.now().toString()

    // 流式输出
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || ''
      if (content) {
        fullResponse += content
        // 发送SSE数据
        res.write(`data: ${JSON.stringify({ content, done: false })}\n\n`)
      }
    }

    // 发送结束标记
    res.write(`data: ${JSON.stringify({ content: '', done: true, conversationId: newConversationId })}\n\n`)
    res.end()

    // 保存对话记录到数据库（异步，不阻塞响应）
    if (userId) {
      saveChatMessage(userId, newConversationId, message, fullResponse).catch(err => {
        console.error('保存对话记录失败:', err)
      })
    }

  } catch (error) {
    console.error('AI聊天接口错误:', error)
    // 如果已经开始流式响应，则发送错误信息
    if (!res.headersSent) {
      res.status(500).json({ status: 1, message: 'AI服务调用失败', error: error.message })
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message, done: true })}\n\n`)
      res.end()
    }
  }
}

// 获取对话历史
exports.getChatHistory = async (req, res) => {
  try {
    const { userId } = req.params
    const { conversationId } = req.query
    
    if (!userId) {
      return res.status(400).json({ status: 1, message: '用户ID不能为空' })
    }

    const history = await getConversationHistory(userId, conversationId)
    
    res.json({
      status: 0,
      message: '获取成功',
      data: history
    })
  } catch (error) {
    console.error('获取对话历史失败:', error)
    res.status(500).json({ status: 1, message: '获取对话历史失败', error: error.message })
  }
}

// 清空对话历史
exports.clearChatHistory = async (req, res) => {
  try {
    const { userId } = req.params
    const { conversationId } = req.query
    
    if (!userId) {
      return res.status(400).json({ status: 1, message: '用户ID不能为空' })
    }

    let sql = 'DELETE FROM ai_chat_history WHERE user_id = ?'
    const params = [userId]
    
    if (conversationId) {
      sql += ' AND conversation_id = ?'
      params.push(conversationId)
    }

    await db.execute(sql, params)
    
    res.json({
      status: 0,
      message: '清空成功'
    })
  } catch (error) {
    console.error('清空对话历史失败:', error)
    res.status(500).json({ status: 1, message: '清空对话历史失败', error: error.message })
  }
}

// 获取对话历史记录（辅助函数）
async function getConversationHistory(userId, conversationId) {
  try {
    let sql = `
      SELECT role, content, created_at 
      FROM ai_chat_history 
      WHERE user_id = ? 
    `
    const params = [userId]
    
    if (conversationId) {
      sql += ' AND conversation_id = ?'
      params.push(conversationId)
    }
    
    sql += ' ORDER BY created_at ASC LIMIT 20'
    
    const [rows] = await db.execute(sql, params)
    
    return rows.map(row => ({
      role: row.role,
      content: row.content
    }))
  } catch (error) {
    console.error('获取对话历史失败:', error)
    return []
  }
}

// 保存对话消息（辅助函数）
async function saveChatMessage(userId, conversationId, userMessage, aiResponse) {
  try {
    const sql = `
      INSERT INTO ai_chat_history (user_id, conversation_id, role, content, created_at) 
      VALUES (?, ?, ?, ?, NOW()), (?, ?, ?, ?, NOW())
    `
    await db.execute(sql, [
      userId, conversationId, 'user', userMessage,
      userId, conversationId, 'assistant', aiResponse
    ])
  } catch (error) {
    console.error('保存对话记录失败:', error)
    throw error
  }
}

// 获取用户的所有对话列表
exports.getConversationList = async (req, res) => {
  try {
    const { userId } = req.params
    
    if (!userId) {
      return res.status(400).json({ status: 1, message: '用户ID不能为空' })
    }

    const sql = `
      SELECT 
        conversation_id,
        MAX(created_at) as last_time,
        SUBSTRING_INDEX(GROUP_CONCAT(CASE WHEN role = 'user' THEN content END ORDER BY created_at DESC SEPARATOR '|'), '|', 1) as last_message
      FROM ai_chat_history 
      WHERE user_id = ?
      GROUP BY conversation_id
      ORDER BY last_time DESC
    `
    
    const [rows] = await db.execute(sql, [userId])
    
    res.json({
      status: 0,
      message: '获取成功',
      data: rows.map(row => ({
        conversationId: row.conversation_id,
        lastTime: row.last_time,
        lastMessage: row.last_message ? row.last_message.substring(0, 50) + (row.last_message.length > 50 ? '...' : '') : '新对话'
      }))
    })
  } catch (error) {
    console.error('获取对话列表失败:', error)
    res.status(500).json({ status: 1, message: '获取对话列表失败', error: error.message })
  }
}

// 删除某个对话
exports.deleteConversation = async (req, res) => {
  try {
    const { userId, conversationId } = req.params
    
    if (!userId || !conversationId) {
      return res.status(400).json({ status: 1, message: '用户ID和对话ID不能为空' })
    }

    await db.execute(
      'DELETE FROM ai_chat_history WHERE user_id = ? AND conversation_id = ?',
      [userId, conversationId]
    )
    
    res.json({
      status: 0,
      message: '删除成功'
    })
  } catch (error) {
    console.error('删除对话失败:', error)
    res.status(500).json({ status: 1, message: '删除对话失败', error: error.message })
  }
}
