const express = require('express')
const router = express.Router()
const aiChatHandler = require('../router_handler/ai-chat')

// AI聊天接口（流式输出）
router.post('/chat', aiChatHandler.chat)

// 获取对话历史
router.get('/chat/history/:userId', aiChatHandler.getChatHistory)

// 删除对话历史
router.delete('/chat/history/:userId', aiChatHandler.clearChatHistory)

// 获取用户的所有对话列表
router.get('/chat/conversations/:userId', aiChatHandler.getConversationList)

// 删除某个对话
router.delete('/chat/conversation/:userId/:conversationId', aiChatHandler.deleteConversation)

module.exports = router
