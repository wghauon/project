<script setup>
import { ref, onMounted, computed } from 'vue'
import { useTeacherStore } from '@/stores/teacher'
import { getMaterials, deleteMaterial, uploadMaterial, updateMaterial } from '@/api/teacher'

const teacherStore = useTeacherStore()
const materialList = ref([])
const loading = ref(false)
const error = ref('')

// 上传相关
const showUploadModal = ref(false)
const uploadForm = ref({
  file: null,
  description: ''
})
const uploadLoading = ref(false)
const fileInputRef = ref(null)

// 编辑相关
const showEditModal = ref(false)
const editingMaterial = ref(null)
const editForm = ref({
  file_name: '',
  description: '',
  status: 1
})

// 统计资料状态
const stats = computed(() => {
  const total = materialList.value.length
  const enabled = materialList.value.filter(m => m.status === 1).length
  const disabled = materialList.value.filter(m => m.status === 0).length
  return { total, enabled, disabled }
})

// 获取资料列表
const fetchMaterials = async () => {
  if (!teacherStore.course_id) {
    error.value = '请先选择课程'
    return
  }
  loading.value = true
  error.value = ''
  try {
    const res = await getMaterials(teacherStore.course_id)
    if (res.data.status === 0) {
      materialList.value = res.data.data || []
    } else {
      error.value = res.data.message || '获取资料列表失败'
      materialList.value = []
    }
  } catch (err) {
    console.error('获取资料列表失败:', err)
    error.value = '获取资料列表失败'
    materialList.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchMaterials()
})

// 选择文件
const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    uploadForm.value.file = file
  }
}

// 触发文件选择
const triggerFileSelect = () => {
  fileInputRef.value?.click()
}

// 上传资料
const handleUpload = async () => {
  if (!uploadForm.value.file) {
    alert('请选择要上传的文件')
    return
  }

  uploadLoading.value = true
  try {
    const formData = new FormData()
    formData.append('file', uploadForm.value.file)
    formData.append('course_id', teacherStore.course_id)
    formData.append('description', uploadForm.value.description)

    const res = await uploadMaterial(formData)
    if (res.data.status === 0) {
      alert('上传成功')
      showUploadModal.value = false
      uploadForm.value = { file: null, description: '' }
      fetchMaterials()
    } else {
      alert(res.data.message || '上传失败')
    }
  } catch (err) {
    console.error('上传失败:', err)
    alert('上传失败，请稍后重试')
  } finally {
    uploadLoading.value = false
  }
}

// 打开编辑弹窗
const openEditModal = (material) => {
  editingMaterial.value = material
  editForm.value = {
    file_name: material.file_name,
    description: material.description || '',
    status: material.status
  }
  showEditModal.value = true
}

// 保存编辑
const handleEdit = async () => {
  try {
    const res = await updateMaterial(editingMaterial.value.material_id, editForm.value)
    if (res.data.status === 0) {
      alert('更新成功')
      showEditModal.value = false
      fetchMaterials()
    } else {
      alert(res.data.message || '更新失败')
    }
  } catch (err) {
    console.error('更新失败:', err)
    alert('更新失败，请稍后重试')
  }
}

// 删除资料
const handleDelete = async (material) => {
  if (confirm(`确定要删除资料"${material.file_name}"吗？`)) {
    try {
      const res = await deleteMaterial(material.material_id)
      if (res.data.status === 0) {
        alert('删除成功')
        fetchMaterials()
      } else {
        alert(res.data.message || '删除失败')
      }
    } catch (err) {
      console.error('删除失败:', err)
      alert('删除失败，请稍后重试')
    }
  }
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN')
}

// 获取文件图标
const getFileIcon = (fileType) => {
  if (!fileType) return '📄'
  if (fileType.includes('pdf')) return '📕'
  if (fileType.includes('word') || fileType.includes('document')) return '📘'
  if (fileType.includes('excel') || fileType.includes('sheet')) return '📗'
  if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📙'
  if (fileType.includes('image')) return '🖼️'
  if (fileType.includes('video')) return '🎬'
  if (fileType.includes('audio')) return '🎵'
  if (fileType.includes('zip') || fileType.includes('compressed')) return '📦'
  return '📄'
}

// 获取文件类型标签
const getFileTypeLabel = (fileType) => {
  if (!fileType) return '未知'
  if (fileType.includes('pdf')) return 'PDF'
  if (fileType.includes('word') || fileType.includes('document')) return 'Word'
  if (fileType.includes('excel') || fileType.includes('sheet')) return 'Excel'
  if (fileType.includes('powerpoint') || fileType.includes('presentation')) return 'PPT'
  if (fileType.includes('image')) return '图片'
  if (fileType.includes('video')) return '视频'
  if (fileType.includes('audio')) return '音频'
  if (fileType.includes('zip') || fileType.includes('compressed')) return '压缩包'
  return '其他'
}
</script>

<template>
  <div class="content-area">
    <div class="content-header">
      <h2 class="content-title">📎 资料管理</h2>
      <button class="btn-primary" @click="showUploadModal = true">➕ 上传资料</button>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">{{ stats.total }}</div>
        <div class="stat-label">资料总数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.enabled }}</div>
        <div class="stat-label">已启用</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.disabled }}</div>
        <div class="stat-label">已禁用</div>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="error-message">
      <p>{{ error }}</p>
      <button v-if="teacherStore.course_id" class="btn-primary" @click="fetchMaterials">重新加载</button>
    </div>

    <!-- 加载状态 -->
    <div v-else-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>正在加载资料列表...</p>
    </div>

    <!-- 空状态 -->
    <div v-else-if="materialList.length === 0" class="empty-state">
      <div class="empty-icon">📁</div>
      <p>暂无资料</p>
      <button class="btn-primary" @click="showUploadModal = true">上传资料</button>
    </div>

    <!-- 资料列表 -->
    <div v-else class="material-list">
      <div v-for="item in materialList" :key="item.material_id" class="material-item">
        <div class="material-icon">{{ getFileIcon(item.file_type) }}</div>
        <div class="material-info">
          <div class="material-name">{{ item.file_name }}</div>
          <div class="material-meta">
            <span class="file-type">{{ getFileTypeLabel(item.file_type) }}</span>
            <span class="file-size">{{ formatFileSize(item.file_size) }}</span>
            <span class="upload-time">{{ formatDate(item.created_at) }}</span>
            <span class="download-count">⬇️ {{ item.download_count || 0 }}次下载</span>
          </div>
          <div v-if="item.description" class="material-desc">{{ item.description }}</div>
        </div>
        <div class="material-status">
          <span :class="['status-badge', item.status === 1 ? 'enabled' : 'disabled']">
            {{ item.status === 1 ? '启用' : '禁用' }}
          </span>
        </div>
        <div class="material-actions">
          <a :href="item.file_url" target="_blank" class="btn-download" download>下载</a>
          <button class="btn-edit" @click="openEditModal(item)">编辑</button>
          <button class="btn-delete" @click="handleDelete(item)">删除</button>
        </div>
      </div>
    </div>

    <!-- 上传弹窗 -->
    <div v-if="showUploadModal" class="modal-overlay" @click.self="showUploadModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>上传资料</h3>
          <button class="btn-close" @click="showUploadModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>选择文件</label>
            <input
              ref="fileInputRef"
              type="file"
              style="display: none"
              @change="handleFileSelect"
            />
            <div class="file-select-area" @click="triggerFileSelect">
              <div v-if="uploadForm.file" class="selected-file">
                <span class="file-icon">{{ getFileIcon(uploadForm.file.type) }}</span>
                <span class="file-name">{{ uploadForm.file.name }}</span>
                <span class="file-size">({{ formatFileSize(uploadForm.file.size) }})</span>
              </div>
              <div v-else class="upload-placeholder">
                <div class="upload-icon">📁</div>
                <p>点击选择文件</p>
                <p class="upload-hint">支持 PDF、Word、Excel、PPT、图片等格式</p>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label>文件描述（可选）</label>
            <textarea
              v-model="uploadForm.description"
              rows="3"
              placeholder="请输入文件描述..."
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showUploadModal = false">取消</button>
          <button class="btn-primary" :disabled="uploadLoading || !uploadForm.file" @click="handleUpload">
            {{ uploadLoading ? '上传中...' : '确认上传' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>编辑资料</h3>
          <button class="btn-close" @click="showEditModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>文件名称</label>
            <input v-model="editForm.file_name" type="text" placeholder="请输入文件名称" />
          </div>
          <div class="form-group">
            <label>文件描述</label>
            <textarea
              v-model="editForm.description"
              rows="3"
              placeholder="请输入文件描述..."
            ></textarea>
          </div>
          <div class="form-group">
            <label>状态</label>
            <select v-model="editForm.status">
              <option :value="1">启用</option>
              <option :value="0">禁用</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showEditModal = false">取消</button>
          <button class="btn-primary" @click="handleEdit">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 内容区 */
.content-area {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.content-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

/* 按钮样式 */
.btn-primary {
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-secondary {
  padding: 10px 20px;
  background: #f5f7fa;
  color: #666;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}
.stat-card {
  background: #f5f7fa;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
}
.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 4px;
}
.stat-label {
  font-size: 13px;
  color: #666;
}

/* 错误提示 */
.error-message {
  text-align: center;
  padding: 40px 20px;
  color: #f44336;
}
.error-message p {
  margin-bottom: 16px;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #666;
}
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #999;
}
.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}
.empty-state p {
  margin-bottom: 16px;
}

/* 资料列表 */
.material-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.material-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 10px;
  gap: 16px;
}
.material-icon {
  font-size: 32px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 8px;
}
.material-info {
  flex: 1;
  min-width: 0;
}
.material-name {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.material-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #666;
  flex-wrap: wrap;
}
.file-type {
  padding: 2px 8px;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 4px;
}
.material-desc {
  font-size: 12px;
  color: #999;
  margin-top: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.material-status {
  flex-shrink: 0;
}
.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
}
.status-badge.enabled {
  background: #e6f7e6;
  color: #43e97b;
}
.status-badge.disabled {
  background: #ffe6e6;
  color: #f5576c;
}
.material-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
.material-actions button,
.material-actions a {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  text-decoration: none;
}
.btn-download {
  background: #e3f2fd;
  color: #1976d2;
}
.btn-edit {
  background: #f0f4ff;
  color: #667eea;
}
.btn-delete {
  background: #ffe6e6;
  color: #f5576c;
}

/* 弹窗样式 */
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
.modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;
}
.modal-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}
.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
}
.modal-body {
  padding: 24px;
  overflow-y: auto;
  max-height: 60vh;
}
.form-group {
  margin-bottom: 20px;
}
.form-group label {
  display: block;
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
  font-weight: 500;
}
.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 10px 14px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
}
.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #667eea;
}
.file-select-area {
  border: 2px dashed #e0e0e0;
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}
.file-select-area:hover {
  border-color: #667eea;
  background: #f5f7fa;
}
.selected-file {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.selected-file .file-icon {
  font-size: 24px;
}
.selected-file .file-name {
  font-weight: 500;
  color: #333;
}
.selected-file .file-size {
  color: #999;
}
.upload-placeholder {
  color: #999;
}
.upload-icon {
  font-size: 36px;
  margin-bottom: 8px;
}
.upload-hint {
  font-size: 12px;
  margin-top: 8px;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e0e0e0;
}

/* 响应式 */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .material-item {
    flex-wrap: wrap;
  }
  .material-actions {
    width: 100%;
    justify-content: flex-end;
    margin-top: 8px;
  }
}
</style>
