const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const kbHandler = require('../router_handler/knowledge-base')

// 配置multer存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/temp'))
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '-' + file.originalname)
  }
})

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 限制50MB
})

// 知识库CRUD
router.get('/knowledge-bases', kbHandler.getKnowledgeBases)
router.post('/knowledge-bases', kbHandler.createKnowledgeBase)
router.get('/knowledge-bases/:kbId', kbHandler.getKnowledgeBaseDetail)
router.put('/knowledge-bases/:kbId', kbHandler.updateKnowledgeBase)
router.delete('/knowledge-bases/:kbId', kbHandler.deleteKnowledgeBase)

// 文档管理
router.get('/knowledge-bases/:kbId/documents', kbHandler.getDocuments)
router.post('/knowledge-bases/:kbId/documents', upload.single('file'), kbHandler.uploadDocument)
router.delete('/knowledge-bases/:kbId/documents/:docId', kbHandler.deleteDocument)

// 知识库搜索测试
router.post('/knowledge-bases/:kbId/search', kbHandler.searchKnowledgeBase)

module.exports = router
