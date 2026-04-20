import request from '@/utils/request'
import { useUserStore } from '@/stores/user'

// 知识库管理API

/**
 * 获取用户知识库列表
 */
export function getKnowledgeBases() {
  return request.get('/kb/knowledge-bases')
}

/**
 * 创建知识库
 * @param {Object} data - { name, description, icon, color }
 */
export function createKnowledgeBase(data) {
  return request.post('/kb/knowledge-bases', data)
}

/**
 * 获取知识库详情
 * @param {number} kbId - 知识库ID
 */
export function getKnowledgeBaseDetail(kbId) {
  return request.get(`/kb/knowledge-bases/${kbId}`)
}

/**
 * 更新知识库
 * @param {number} kbId - 知识库ID
 * @param {Object} data - { name, description, icon, color }
 */
export function updateKnowledgeBase(kbId, data) {
  return request.put(`/kb/knowledge-bases/${kbId}`, data)
}

/**
 * 删除知识库
 * @param {number} kbId - 知识库ID
 */
export function deleteKnowledgeBase(kbId) {
  return request.delete(`/kb/knowledge-bases/${kbId}`)
}

/**
 * 获取知识库文档列表
 * @param {number} kbId - 知识库ID
 */
export function getDocuments(kbId) {
  return request.get(`/kb/knowledge-bases/${kbId}/documents`)
}

/**
 * 上传文档
 * @param {number} kbId - 知识库ID
 * @param {File} file - 文件对象
 * @param {Function} onProgress - 进度回调
 */
export function uploadDocument(kbId, file, onProgress) {
  const formData = new FormData()
  formData.append('file', file)
  
  return request.post(`/kb/knowledge-bases/${kbId}/documents`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress(percent)
      }
    }
  })
}

/**
 * 删除文档
 * @param {number} kbId - 知识库ID
 * @param {number} docId - 文档ID
 */
export function deleteDocument(kbId, docId) {
  return request.delete(`/kb/knowledge-bases/${kbId}/documents/${docId}`)
}

/**
 * 搜索知识库
 * @param {number} kbId - 知识库ID
 * @param {string} query - 查询内容
 */
export function searchKnowledgeBase(kbId, query) {
  return request.post(`/kb/knowledge-bases/${kbId}/search`, { query })
}

// RAG相关API

/**
 * RAG对话（流式）
 * @param {Object} params - { message, userId, conversationId, kbId, mode }
 */
export function ragChatStream(params) {
  const userStore = useUserStore()
  const token = userStore.accessToken
  
  return fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/rag/rag/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token || ''
    },
    body: JSON.stringify(params)
  })
}

/**
 * 获取RAG对话列表
 */
export function getRagConversations() {
  return request.get('/rag/rag/conversations')
}

/**
 * 获取可用的知识库列表（用于对话）
 */
export function getAvailableKnowledgeBases() {
  return request.get('/rag/rag/knowledge-bases')
}
