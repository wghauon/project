<script setup>
import router from '@/router'
defineProps({
  item: {
    type: Object,
    require: true,
  },
})
</script>
<template>
  <div class="video-item">
    <div class="video-thumbnail">
      🎬
      <span class="video-duration">15:30</span>
    </div>
    <div class="video-info">
      <div class="video-header">
        <div>
          <h3 class="video-title">{{ item.video_name }}</h3>
          <p class="video-chapter">{{ item.description }}</p>
        </div>
        <span class="video-status published">已发布</span>
      </div>
      <div class="video-meta">
        <span>📊 1,234次播放</span>
        <span>💬 45条评论</span>
        <span>👍 89%好评</span>
        <span>📅 2024-03-15上传</span>
        <span>💾 156MB</span>
      </div>
    </div>
    <div class="video-actions">
      <button class="btn-icon" @click="router.push(`/teacher/video-preview/${item.video_id}`)">
        ▶️ 预览
      </button>
      <button class="btn-icon">✏️ 编辑</button>
      <button class="btn-icon">📊 数据</button>
      <button class="btn-icon">🗑️ 删除</button>
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
