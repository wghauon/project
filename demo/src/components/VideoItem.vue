<script setup>
import router from '@/router'
import { deleteVideo } from '@/api/teacher'

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['delete'])

// 格式化时长（秒 -> mm:ss 或 hh:mm:ss）
const formatDuration = (seconds) => {
  if (!seconds) return '00:00'
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (!bytes) return '-'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(1)}${units[unitIndex]}`
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
}

// 获取状态文本和样式
const getStatusInfo = (status) => {
  const statusMap = {
    0: { text: '草稿', class: 'draft' },
    1: { text: '已发布', class: 'published' },
    2: { text: '处理中', class: 'processing' },
  }
  return statusMap[status] || { text: '未知', class: 'draft' }
}

// 编辑视频
const handleEdit = () => {
  router.push(`/teacher/video-edit/${props.item.video_id}`)
}

// 删除视频
const handleDelete = async () => {
  if (!confirm('确定要删除这个视频吗？此操作不可恢复。')) {
    return
  }
  try {
    const res = await deleteVideo(props.item.video_id)
    if (res.data.status === 0) {
      alert('删除成功')
      emit('delete', props.item.video_id)
    } else {
      alert(res.data.message || '删除失败')
    }
  } catch (error) {
    console.error('删除失败:', error)
    alert('删除失败，请稍后重试')
  }
}
</script>
<template>
  <div class="video-item">
    <div class="video-thumbnail">
      🎬
      <span class="video-duration">{{ formatDuration(item.duration) }}</span>
    </div>
    <div class="video-info">
      <div class="video-header">
        <div>
          <h3 class="video-title">{{ item.video_name }}</h3>
          <p class="video-chapter">{{ item.description || '暂无描述' }}</p>
        </div>
        <span class="video-status" :class="getStatusInfo(item.status).class">
          {{ getStatusInfo(item.status).text }}
        </span>
      </div>
      <div class="video-meta">
        <span>📊 {{ item.view_count || 0 }}次播放</span>
        <span>💬 0条评论</span>
        <span>👍 0%好评</span>
        <span>📅 {{ formatDate(item.created_at) }}上传</span>
        <span>💾 {{ formatFileSize(item.file_size) }}</span>
      </div>
    </div>
    <div class="video-actions">
      <button class="btn-icon" @click="router.push(`/teacher/video-preview/${item.video_id}`)">
        ▶️ 预览
      </button>
      <button class="btn-icon" @click="handleEdit">✏️ 编辑</button>
      <button class="btn-icon">📊 数据</button>
      <button class="btn-icon" @click="handleDelete">🗑️ 删除</button>
    </div>
  </div>
</template>
<style scoped>
.video-item {
  display: flex;
  gap: 16px;
  padding: 16px;
  border: 2px solid #f0f0f0;
  border-radius: 12px;
  transition: all 0.3s;
}
.video-item:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
}
.video-thumbnail {
  width: 200px;
  height: 120px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 48px;
  position: relative;
  flex-shrink: 0;
}
.video-duration {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}
.video-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.video-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.video-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}
.video-chapter {
  font-size: 13px;
  color: #999;
}
.video-status {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}
.video-status.published {
  background: #e8f5e9;
  color: #4caf50;
}
.video-status.draft {
  background: #fff3e0;
  color: #ff9800;
}
.video-status.processing {
  background: #e3f2fd;
  color: #2196f3;
}
.video-meta {
  display: flex;
  gap: 24px;
  font-size: 13px;
  color: #666;
}
.video-meta span {
  display: flex;
  align-items: center;
  gap: 6px;
}
.video-actions {
  display: flex;
  gap: 8px;
}
.btn-icon {
  padding: 8px 14px;
  background: #f5f7fa;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.3s;
}
.btn-icon:hover {
  background: #667eea;
  color: white;
}
</style>
