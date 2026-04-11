<script setup>
import { ref, onMounted } from 'vue'
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '@/api/admin'

// 公告列表
const announcements = ref([])
const loading = ref(false)

// 创建/编辑公告弹窗
const showModal = ref(false)
const isEditing = ref(false)
const announcementForm = ref({
  announcement_id: null,
  title: '',
  content: '',
  type: 'notice',
  is_top: false
})

// 获取公告列表
const fetchAnnouncements = async () => {
  loading.value = true
  try {
    const res = await getAnnouncements()
    if (res.data.status === 0) {
      announcements.value = res.data.data || []
    } else {
      console.error('获取公告列表失败:', res.data.message)
    }
  } catch (error) {
    console.error('获取公告列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 打开创建弹窗
const openCreateModal = () => {
  isEditing.value = false
  announcementForm.value = {
    announcement_id: null,
    title: '',
    content: '',
    type: 'notice',
    is_top: false
  }
  showModal.value = true
}

// 打开编辑弹窗
const openEditModal = (announcement) => {
  isEditing.value = true
  announcementForm.value = { ...announcement }
  showModal.value = true
}

// 保存公告
const saveAnnouncement = async () => {
  if (!announcementForm.value.title || !announcementForm.value.content) {
    alert('请填写完整的标题和内容')
    return
  }

  try {
    if (isEditing.value) {
      const res = await updateAnnouncement(announcementForm.value.announcement_id, announcementForm.value)
      if (res.data.status === 0) {
        alert('公告更新成功')
        showModal.value = false
        fetchAnnouncements()
      } else {
        alert(res.data.message || '更新失败')
      }
    } else {
      const res = await createAnnouncement(announcementForm.value)
      if (res.data.status === 0) {
        alert('公告发布成功')
        showModal.value = false
        fetchAnnouncements()
      } else {
        alert(res.data.message || '发布失败')
      }
    }
  } catch (error) {
    console.error('保存失败:', error)
    alert('保存失败，请稍后重试')
  }
}

// 删除公告
const handleDeleteAnnouncement = async (announcement) => {
  if (confirm(`确定要删除公告"${announcement.title}"吗？`)) {
    try {
      const res = await deleteAnnouncement(announcement.announcement_id)
      if (res.data.status === 0) {
        alert('删除成功')
        fetchAnnouncements()
      } else {
        alert(res.data.message || '删除失败')
      }
    } catch (error) {
      console.error('删除失败:', error)
      alert('删除失败，请稍后重试')
    }
  }
}

// 切换置顶状态
const toggleTop = async (announcement) => {
  try {
    const res = await updateAnnouncement(announcement.announcement_id, {
      ...announcement,
      is_top: !announcement.is_top
    })
    if (res.data.status === 0) {
      announcement.is_top = !announcement.is_top
      alert(announcement.is_top ? '已置顶' : '已取消置顶')
    }
  } catch (error) {
    console.error('操作失败:', error)
    alert('操作失败，请稍后重试')
  }
}

// 获取类型文本
const getTypeText = (type) => {
  const map = {
    'system': '系统',
    'important': '重要',
    'notice': '通知'
  }
  return map[type] || '其他'
}

// 获取类型样式类
const getTypeClass = (type) => {
  return type
}

onMounted(() => {
  fetchAnnouncements()
})
</script>

<template>
  <!-- 主内容 -->
  <main class="main-container">
    <div class="page-header">
      <h1 class="page-title">📢 公告管理</h1>
      <button class="btn-primary" @click="openCreateModal">➕ 发布公告</button>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>正在加载公告...</p>
    </div>

    <div v-else class="announcement-list">
      <div v-if="announcements.length === 0" class="empty-state">
        <div class="empty-icon">📢</div>
        <p>暂无公告</p>
      </div>

      <div v-for="announcement in announcements" :key="announcement.announcement_id" class="announcement-card">
        <div class="announcement-header">
          <h3 class="announcement-title">
            <span v-if="announcement.is_top" class="top-badge">置顶</span>
            {{ announcement.title }}
          </h3>
          <span class="announcement-type" :class="getTypeClass(announcement.type)">
            {{ getTypeText(announcement.type) }}
          </span>
        </div>
        <p class="announcement-content">{{ announcement.content }}</p>
        <div class="announcement-footer">
          <div class="announcement-meta">
            <span>👤 {{ announcement.author || '管理员' }}</span>
            <span>📅 {{ announcement.created_at }}</span>
            <span>👁️ {{ announcement.view_count || 0 }}次阅读</span>
          </div>
          <div class="announcement-actions">
            <button class="btn-text" @click="openEditModal(announcement)">编辑</button>
            <button class="btn-text" @click="toggleTop(announcement)">
              {{ announcement.is_top ? '取消置顶' : '置顶' }}
            </button>
            <button class="btn-danger" @click="handleDeleteAnnouncement(announcement)">删除</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建/编辑公告弹窗 -->
    <div v-if="showModal" class="modal-overlay" @click="showModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ isEditing ? '编辑公告' : '发布公告' }}</h3>
          <button class="btn-close" @click="showModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>标题</label>
            <input v-model="announcementForm.title" type="text" placeholder="请输入公告标题">
          </div>
          <div class="form-group">
            <label>类型</label>
            <select v-model="announcementForm.type">
              <option value="notice">通知</option>
              <option value="important">重要</option>
              <option value="system">系统</option>
            </select>
          </div>
          <div class="form-group">
            <label>内容</label>
            <textarea v-model="announcementForm.content" rows="6" placeholder="请输入公告内容"></textarea>
          </div>
          <div class="form-group">
            <label>
              <input v-model="announcementForm.is_top" type="checkbox">
              置顶公告
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showModal = false">取消</button>
          <button class="btn-primary" @click="saveAnnouncement">保存</button>
        </div>
      </div>
    </div>
  </main>
</template>
<style scoped>
/* 主内容 */
.main-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.page-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}
.btn-primary {
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}
/* 公告列表 */
.announcement-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.announcement-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.announcement-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}
.announcement-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}
.announcement-type {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}
.announcement-type.system {
  background: #e3f2fd;
  color: #2196f3;
}
.announcement-type.important {
  background: #ffebee;
  color: #f44336;
}
.announcement-type.notice {
  background: #fff3e0;
  color: #ff9800;
}
.announcement-content {
  color: #666;
  line-height: 1.7;
  margin-bottom: 16px;
}
.announcement-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}
.announcement-meta {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: #999;
}
.announcement-actions {
  display: flex;
  gap: 12px;
}
.btn-text {
  padding: 6px 14px;
  background: #f5f7fa;
  color: #667eea;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}
.btn-danger {
  padding: 6px 14px;
  background: #ffebee;
  color: #f44336;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}
/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 32px;
}
.pagination button {
  padding: 10px 16px;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}
.pagination button.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

/* 置顶标签 */
.top-badge {
  display: inline-block;
  padding: 2px 8px;
  background: #ff5252;
  color: white;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  margin-right: 8px;
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

/* 模态框 */
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
.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e8e8e8;
}
.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}
.btn-close {
  background: none;
  border: none;
  font-size: 20px;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.3s;
}
.btn-close:hover {
  background: #f5f5f5;
  color: #333;
}
.modal-body {
  padding: 24px;
  overflow-y: auto;
  max-height: calc(90vh - 140px);
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e8e8e8;
}

/* 表单样式 */
.form-group {
  margin-bottom: 20px;
}
.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}
.form-group input[type="text"],
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s;
  font-family: inherit;
}
.form-group input[type="text"]:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}
.form-group input[type="checkbox"] {
  margin-right: 8px;
  width: 16px;
  height: 16px;
  cursor: pointer;
}
.form-group textarea {
  resize: vertical;
  min-height: 120px;
}

/* 按钮样式 */
.btn-secondary {
  padding: 10px 20px;
  background: #f5f5f5;
  color: #666;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}
.btn-secondary:hover {
  background: #e8e8e8;
}
</style>
