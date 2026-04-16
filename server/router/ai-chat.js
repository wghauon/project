const express = require('express')
const router = express.Router()
const aiChatHandler = require('../router_handler/ai-chat')

// AI聊天接口（流式输出）
router.post('/chat', aiChatHandler.chat)

// 获取对话历史
router.get('/chat/history/:userId', aiChatHandler.getChatHistory)

// 删除对话历史
router.delete('/chat/history/:userId', aiChatHandler.clearChatHistory)

module.exports = router
