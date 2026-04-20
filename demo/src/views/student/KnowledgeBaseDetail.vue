<template>
  <div class="kb-detail-page">
    <!-- 头部导航 -->
    <div class="page-nav">
      <button class="back-btn" @click="goBack">
        <span>←</span> 返回知识库列表
      </button>
    </div>

    <!-- 知识库信息 -->
    <div class="kb-header" :style="{ backgroundColor: kbInfo.color + '15' }">
      <div class="kb-header-content">
        <div class="kb-icon-large" :style="{ backgroundColor: kbInfo.color }">
          {{ kbInfo.icon }}
        </div>
        <div class="kb-header-info">
          <h1>{{ kbInfo.name }}</h1>
          <p>{{ kbInfo.description || '暂无描述' }}</p>
          <div class="kb-meta">
            <span class="meta-item">
              <i>📄</i> {{ kbInfo.doc_count || 0 }} 个文档
            </span>
            <span class="meta-item">
              <i>🧩</i> {{ kbInfo.total_chunks || 0 }} 个知识片段
            </span>
            <span class="meta-item">
              <i>🕐</i> 更新于 {{ formatTime(kbInfo.updated_at) }}
            </span>
          </div>
        </div>
        <div class="kb-header-actions">
          <button class="chat-btn" @click="startChat">
            <span>💬</span> 开始对话
          </button>
        </div>
      </div>
    </div>

    <!-- 文档列表区域 -->
    <div class="content-area">
      <div class="section-header">
        <h2>📄 文档列表</h2>
        <div class="upload-area">
          <input
            ref="fileInput"
            type="file"
            accept=".pdf,.doc,.docx,.txt,.md"
            style="display: none"
            @change="handleFileSelect"
          />
          <button class="upload-btn" @click="$refs.fileInput.click()" :disabled="uploading">
            <span>{{ uploading ? '上传中...' : '+ 上传文档' }}</span>
          </button>
        </div>
      </div>

      <!-- 上传进度 -->
      <div v-if="uploadProgress > 0 && uploadProgress < 100" class="upload-progress">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
        </div>
        <span class="progress-text">{{ uploadProgress }}%</span>
      </div>

      <!-- 文档列表 -->
      <div v-if="documents.length > 0" class="doc-list">
        <div
          v-for="doc in documents"
          :key="doc.doc_id"
          class="doc-item"
          :class="{ 'is-parsing': doc.status === 1, 'is-error': doc.status === 3 }"
        >
          <div class="doc-icon">
            {{ getFileIcon(doc.file_type) }}
          </div>
          <div class="doc-info">
            <div class="doc-name">{{ doc.file_name }}</div>
            <div class="doc-meta">
              <span class="doc-size">{{ formatSize(doc.file_size) }}</span>
              <span class="doc-status" :class="'status-' + doc.status">
                {{ getStatusText(doc.status) }}
              </span>
              <span v-if="doc.chunk_count > 0" class="doc-chunks">
                {{ doc.chunk_count }} 个片段
              </span>
            </div>
            <div v-if="doc.error_msg" class="doc-error">
              {{ doc.error_msg }}
            </div>
          </div>
          <div class="doc-actions">
            <button class="doc-action-btn" @click="previewDoc(doc)" title="预览">
              👁️
            </button>
            <button class="doc-action-btn delete" @click="deleteDoc(doc)" title="删除">
              🗑️
            </button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-docs">
        <div class="empty-icon">📭</div>
        <h3>还没有文档</h3>
        <p>点击右上角"上传文档"按钮，添加您的学习资料</p>
        <div class="supported-formats">
          <span>支持格式：</span>
          <span class="format-tag">PDF</span>
          <span class="format-tag">Word</span>
          <span class="format-tag">TXT</span>
          <span class="format-tag">Markdown</span>
        </div>
      </div>
    </div>

    <!-- 文档预览弹窗 -->
    <Teleport to="body">
      <div v-if="previewModal.show" class="modal-overlay" @click="previewModal.show = false">
        <div class="preview-modal" @click.stop>
          <div class="preview-header">
            <h3>📄 {{ previewModal.doc?.file_name }}</h3>
            <button class="close-btn" @click="previewModal.show = false">×</button>
          </div>
          <div class="preview-body">
            <div v-if="previewModal.loading" class="preview-loading">
              加载中...
            </div>
            <div v-else class="preview-content">
              <pre>{{ previewModal.content }}</pre>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getKnowledgeBaseDetail,
  getDocuments,
  uploadDocument,
  deleteDocument
} from '@/api/knowledge-base'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const kbId = ref(route.params.id)
const kbInfo = ref({})
const documents = ref([])
const loading = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)

const previewModal = ref({
  show: false,
  doc: null,
  content: '',
  loading: false
})

// 获取知识库详情
const loadKbDetail = async () => {
  try {
    const res = await getKnowledgeBaseDetail(kbId.value)
    if (res.data.status === 0) {
      kbInfo.value = res.data.data
    }
  } catch (error) {
    console.error('获取知识库详情失败:', error)
  }
}

// 获取文档列表
const loadDocuments = async () => {
  loading.value = true
  try {
    const res = await getDocuments(kbId.value)
    if (res.data.status === 0) {
      documents.value = res.data.data
    }
  } catch (error) {
    console.error('获取文档列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 文件选择处理
const handleFileSelect = async (e) => {
  const file = e.target.files[0]
  if (!file) return

  // 验证文件类型
  const ext = file.name.split('.').pop().toLowerCase()
  const allowed = ['pdf', 'doc', 'docx', 'txt', 'md']
  if (!allowed.includes(ext)) {
    alert('不支持的文件格式，请上传 PDF、Word、TXT 或 Markdown 文件')
    return
  }

  // 验证文件大小 (50MB)
  if (file.size > 50 * 1024 * 1024) {
    alert('文件大小不能超过 50MB')
    return
  }

  uploading.value = true
  uploadProgress.value = 0

  try {
    const res = await uploadDocument(kbId.value, file, (progress) => {
      uploadProgress.value = progress
    })

    if (res.data.status === 0) {
      // 刷新列表
      setTimeout(() => {
        loadDocuments()
        loadKbDetail()
      }, 1000)
    }
  } catch (error) {
    console.error('上传失败:', error)
    alert('上传失败: ' + (error.response?.data?.message || error.message))
  } finally {
    uploading.value = false
    uploadProgress.value = 0
    e.target.value = ''
  }
}

// 删除文档
const deleteDoc = async (doc) => {
  if (!confirm(`确定要删除文档「${doc.file_name}」吗？`)) {
    return
  }

  try {
    const res = await deleteDocument(kbId.value, doc.doc_id)
    if (res.data.status === 0) {
      loadDocuments()
      loadKbDetail()
    }
  } catch (error) {
    console.error('删除失败:', error)
    alert('删除失败')
  }
}

// 预览文档
const previewDoc = async (doc) => {
  previewModal.value = {
    show: true,
    doc: doc,
    content: doc.content_text || '暂无预览内容',
    loading: false
  }
}

// 开始对话
const startChat = () => {
  router.push({
    path: '/student/ai-chat',
    query: { kbId: kbId.value, mode: 'rag' }
  })
}

// 返回上一页
const goBack = () => {
  router.push('/student/knowledge-base')
}

// 工具函数
const formatSize = (size) => {
  if (size < 1024) return size + ' B'
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB'
  return (size / (1024 * 1024)).toFixed(1) + ' MB'
}

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleDateString('zh-CN')
}

const getFileIcon = (type) => {
  const icons = {
    pdf: '📕',
    doc: '📘',
    docx: '📘',
    txt: '📄',
    md: '📝',
    markdown: '📝'
  }
  return icons[type] || '📄'
}

const getStatusText = (status) => {
  const texts = {
    0: '待解析',
    1: '解析中...',
    2: '已完成',
    3: '解析失败'
  }
  return texts[status] || '未知'
}

// 定时刷新解析中的文档
let refreshTimer = null
const startRefreshTimer = () => {
  refreshTimer = setInterval(() => {
    const hasParsing = documents.value.some(d => d.status === 1)
    if (hasParsing) {
      loadDocuments()
      loadKbDetail()
    }
  }, 5000)
}

onMounted(() => {
  loadKbDetail()
  loadDocuments()
  startRefreshTimer()
})
</script>

<style scoped>
.kb-detail-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-nav {
  margin-bottom: 20px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #f5f5f5;
  border-color: #ccc;
}

/* 知识库头部 */
.kb-header {
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 24px;
}

.kb-header-content {
  display: flex;
  gap: 24px;
  align-items: center;
}

.kb-icon-large {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  flex-shrink: 0;
}

.kb-header-info {
  flex: 1;
}

.kb-header-info h1 {
  margin: 0 0 12px 0;
  font-size: 24px;
  color: #333;
}

.kb-header-info p {
  margin: 0 0 16px 0;
  color: #666;
  font-size: 14px;
}

.kb-meta {
  display: flex;
  gap: 20px;
}

.meta-item {
  font-size: 13px;
  color: #888;
  display: flex;
  align-items: center;
  gap: 6px;
}

.kb-header-actions {
  display: flex;
  gap: 12px;
}

.chat-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.chat-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
}

/* 内容区域 */
.content-area {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.upload-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.upload-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.upload-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* 上传进度 */
.upload-progress {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
  transition: width 0.3s;
}

.progress-text {
  font-size: 13px;
  color: #666;
  min-width: 40px;
  text-align: right;
}

/* 文档列表 */
.doc-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.doc-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #fafafa;
  border-radius: 12px;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.doc-item:hover {
  background: #f5f5f5;
  border-color: #e0e0e0;
}

.doc-item.is-parsing {
  background: #e3f2fd;
  border-color: #2196f3;
}

.doc-item.is-error {
  background: #ffebee;
  border-color: #f44336;
}

.doc-icon {
  width: 48px;
  height: 48px;
  background: white;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.doc-info {
  flex: 1;
  min-width: 0;
}

.doc-name {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.doc-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
}

.doc-size {
  color: #888;
}

.doc-status {
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.status-0 { background: #fff3e0; color: #f57c00; }
.status-1 { background: #e3f2fd; color: #1976d2; }
.status-2 { background: #e8f5e9; color: #388e3c; }
.status-3 { background: #ffebee; color: #d32f2f; }

.doc-chunks {
  color: #667eea;
  font-weight: 500;
}

.doc-error {
  margin-top: 8px;
  padding: 8px 12px;
  background: #ffebee;
  border-radius: 6px;
  font-size: 12px;
  color: #d32f2f;
}

.doc-actions {
  display: flex;
  gap: 8px;
}

.doc-action-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
}

.doc-action-btn:hover {
  background: #f0f0f0;
}

.doc-action-btn.delete:hover {
  background: #ffebee;
}

/* 空状态 */
.empty-docs {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-docs h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #333;
}

.empty-docs p {
  margin: 0 0 20px 0;
  color: #888;
  font-size: 14px;
}

.supported-formats {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #666;
}

.format-tag {
  padding: 4px 10px;
  background: #f0f0f0;
  border-radius: 4px;
  font-size: 12px;
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.preview-modal {
  background: white;
  border-radius: 16px;
  width: 800px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #eee;
}

.preview-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f5f5f5;
  border-radius: 8px;
  font-size: 20px;
  cursor: pointer;
  color: #666;
}

.preview-body {
  flex: 1;
  overflow: auto;
  padding: 24px;
}

.preview-loading {
  text-align: center;
  padding: 40px;
  color: #888;
}

.preview-content {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
}

.preview-content pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-size: 13px;
  line-height: 1.6;
  color: #333;
  max-height: 400px;
  overflow: auto;
}
</style>
