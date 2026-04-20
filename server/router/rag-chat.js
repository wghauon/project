const express = require('express')
const router = express.Router()
const ragHandler = require('../router_handler/rag-chat')

// RAG对话接口（流式）
router.post('/rag/chat', ragHandler.ragChat)

// 获取RAG对话列表
router.get('/rag/conversations', ragHandler.getRagConversations)

// 获取可用的知识库列表
router.get('/rag/knowledge-bases', ragHandler.getAvailableKnowledgeBases)

module.exports = router
