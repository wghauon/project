const OpenAI = require('openai')
const db = require('../db/index')
const embedding = require('../utils/embedding')
const vectorStore = require('../utils/vector-store')

// 初始化阿里云百炼DeepSeek客户端
const openai = new OpenAI({
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  apiKey: 'sk-539f3b21871a497194f9c5548efb7574'
})

// 知识库模式系统提示词
const RAG_SYSTEM_PROMPT = `你是一位专业的学习助手。请根据以下检索到的参考资料回答学生的问题。

【参考资料】
{retrieved_context}

【回答要求】
1. 基于参考资料内容回答，不要添加参考资料以外的信息
2. 如果参考资料不足以回答问题，请明确告知"根据您的知识库，我暂时无法回答这个问题"
3. 回答时标注信息来源（来自哪份文档）
4. 保持专业、简洁、易懂的语气
5. 必要时使用列表、代码块等格式增强可读性

如果问题与编程相关，请提供代码示例并解释代码原理。`

// 混合模式系统提示词
const HYBRID_SYSTEM_PROMPT = `你是一位专业的学习助手。我会为你提供学生个人知识库中的相关资料，请结合这些资料和自身知识回答问题。

【学生知识库资料】
{retrieved_context}

【回答要求】
1. 优先参考学生知识库中的内容
2. 如果知识库内容不足，可以结合你的通用知识补充
3. 明确区分知识库内容和个人知识（如"根据您的资料..."或"根据一般知识..."）`

/**
 * RAG对话接口（流式输出）
 */
exports.ragChat = async (req, res) => {
  try {
    const { message, userId, conversationId, kbId, mode = 'rag' } = req.body

    if (!message) {
      return res.status(400).json({ status: 1, message: '消息内容不能为空' })
    }

    let retrievedContext = ''
    let contextSources = []

    // 知识库模式：检索相关知识
    if (kbId && mode === 'rag') {
      try {
        // 生成查询向量
        const [queryVector] = await embedding.embed([message], 'query')
        
        // 向量搜索
        const results = await vectorStore.search(queryVector, userId, parseInt(kbId), 5)
        
        if (results.length > 0) {
          // 构建上下文
          retrievedContext = results.map((r, i) => 
            `[${i + 1}] 来自《${r.file_name}》：\n${r.content.substring(0, 500)}...`
          ).join('\n\n')
          
          contextSources = results.map(r => ({
            file_name: r.file_name,
            score: r.score,
            content_preview: r.content.substring(0, 100)
          }))
        }
      } catch (error) {
        console.error('知识库检索失败:', error)
      }
    }

    // 构建系统提示词
    let systemPrompt = mode === 'rag' && retrievedContext 
      ? RAG_SYSTEM_PROMPT.replace('{retrieved_context}', retrievedContext)
      : HYBRID_SYSTEM_PROMPT.replace('{retrieved_context}', retrievedContext || '（暂无相关资料）')

    // 获取历史对话记录
    let messages = [{ role: 'system', content: systemPrompt }]
    
    if (userId && conversationId) {
      const history = await getConversationHistory(userId, conversationId)
      messages = messages.concat(history)
    }
    
    // 添加当前用户消息
    messages.push({ role: 'user', content: message })

    // 设置SSE响应头
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    // 调用阿里云百炼DeepSeek API（流式）
    const stream = await openai.chat.completions.create({
      model: 'deepseek-r1',
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
        res.write(`data: ${JSON.stringify({ content, done: false }) }\n\n`)
      }
    }

    // 发送结束标记（包含引用来源）
    res.write(`data: ${JSON.stringify({ 
      content: '', 
      done: true, 
      conversationId: newConversationId,
      sources: contextSources
    }) }\n\n`)
    res.end()

    // 保存对话记录
    if (userId) {
      saveChatSession(userId, newConversationId, kbId, mode).catch(console.error)
      saveChatMessage(userId, newConversationId, message, fullResponse).catch(console.error)
    }

  } catch (error) {
    console.error('RAG对话接口错误:', error)
    if (!res.headersSent) {
      res.status(500).json({ status: 1, message: 'AI服务调用失败', error: error.message })
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message, done: true }) }\n\n`)
      res.end()
    }
  }
}

/**
 * 获取对话历史
 */
async function getConversationHistory(userId, conversationId) {
  try {
    const sql = `
      SELECT role, content, created_at 
      FROM ai_chat_history 
      WHERE user_id = ? AND conversation_id = ?
      ORDER BY created_at ASC LIMIT 20
    `
    const [rows] = await db.execute(sql, [userId, conversationId])
    
    return rows.map(row => ({
      role: row.role,
      content: row.content
    }))
  } catch (error) {
    console.error('获取对话历史失败:', error)
    return []
  }
}

/**
 * 保存对话消息
 */
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
  }
}

/**
 * 保存/更新对话会话
 */
async function saveChatSession(userId, conversationId, kbId, mode) {
  try {
    const modeValue = mode === 'rag' ? 2 : 1
    
    const sql = `
      INSERT INTO ai_chat_sessions (user_id, conversation_id, kb_id, mode, updated_at)
      VALUES (?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE kb_id = ?, mode = ?, updated_at = NOW()
    `
    await db.execute(sql, [userId, conversationId, kbId, modeValue, kbId, modeValue])
  } catch (error) {
    console.error('保存对话会话失败:', error)
  }
}

/**
 * 获取用户的RAG对话列表
 */
exports.getRagConversations = async (req, res) => {
  try {
    const userId = req.auth.user_id

    const sql = `
      SELECT 
        s.conversation_id,
        s.kb_id,
        s.mode,
        s.updated_at,
        kb.name as kb_name,
        SUBSTRING_INDEX(GROUP_CONCAT(CASE WHEN h.role = 'user' THEN h.content END ORDER BY h.created_at DESC SEPARATOR '|'), '|', 1) as last_message
      FROM ai_chat_sessions s
      LEFT JOIN knowledge_bases kb ON s.kb_id = kb.kb_id
      LEFT JOIN ai_chat_history h ON s.conversation_id = h.conversation_id
      WHERE s.user_id = ?
      GROUP BY s.conversation_id
      ORDER BY s.updated_at DESC
    `
    
    const [rows] = await db.execute(sql, [userId])
    
    res.json({
      status: 0,
      message: '获取成功',
      data: rows.map(row => ({
        conversationId: row.conversation_id,
        kbId: row.kb_id,
        kbName: row.kb_name,
        mode: row.mode === 2 ? 'rag' : 'general',
        lastMessage: row.last_message ? row.last_message.substring(0, 50) + '...' : '新对话',
        lastTime: row.updated_at
      }))
    })
  } catch (error) {
    console.error('获取RAG对话列表失败:', error)
    res.status(500).json({ status: 1, message: '获取失败', error: error.message })
  }
}

/**
 * 获取用户可用的知识库列表（用于对话切换）
 */
exports.getAvailableKnowledgeBases = async (req, res) => {
  try {
    const userId = req.auth.user_id

    const sql = `
      SELECT kb_id, name, description, icon, color, doc_count
      FROM knowledge_bases
      WHERE user_id = ? AND status = 1 AND total_chunks > 0
      ORDER BY updated_at DESC
    `
    const [rows] = await db.execute(sql, [userId])

    res.json({
      status: 0,
      message: '获取成功',
      data: rows
    })
  } catch (error) {
    console.error('获取可用知识库失败:', error)
    res.status(500).json({ status: 1, message: '获取失败', error: error.message })
  }
}
