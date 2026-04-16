import instance from '@/utils/request'

// AI聊天（流式输出）
export const chatWithAI = (data, onMessage, onError, onComplete) => {
  const { message, userId, conversationId } = data

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', 'http://127.0.0.1:3000/ai/chat', true)
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.setRequestHeader('Authorization', localStorage.getItem('accessToken') || '')

    let buffer = ''

    xhr.onprogress = () => {
  const newData = xhr.responseText.substring(buffer.length)
      buffer = xhr.responseText

      // 解析SSE数据
      const lines = newData.split('\n')
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const jsonData = JSON.parse(line.substring(6))
            if (jsonData.error) {
              onError && onError(jsonData.error)
            } else if (jsonData.done) {
              onComplete && onComplete(jsonData)
            } else {
              onMessage && onMessage(jsonData.content)
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }

    xhr.onerror = () => {
      onError && onError('网络请求失败')
      reject(new Error('网络请求失败'))
    }

    xhr.onload = () => {
      resolve()
    }

    xhr.send(JSON.stringify({ message, userId, conversationId }))
  })
}

// 获取对话历史
export const getChatHistory = (userId, conversationId) => {
  return instance.get(`/ai/chat/history/${userId}`, {
    params: { conversationId }
  })
}

// 清空对话历史
export const clearChatHistory = (userId, conversationId) => {
  return instance.delete(`/ai/chat/history/${userId}`, {
    params: { conversationId }
  })
}

// 获取用户的所有对话列表
export const getConversationList = (userId) => {
  return instance.get(`/ai/chat/conversations/${userId}`)
}

// 删除某个对话
export const deleteConversation = (userId, conversationId) => {
  return instance.delete(`/ai/chat/conversation/${userId}/${conversationId}`)
}
