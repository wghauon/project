<script setup>
defineProps({
  chapter: {
    type: Object,
    required: true
  }
})

defineEmits(['add-lesson', 'edit-chapter', 'delete-chapter', 'edit-lesson', 'delete-lesson'])

const formatDuration = (seconds) => {
  if (!seconds) return '⏱️ 00:00'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `⏱️ ${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
</script>

<template>
  <div class="chapter-item">
    <div class="chapter-header">
      <span class="chapter-title">第{{ chapter.chapter_order }}章：{{ chapter.title }}</span>
      <div class="chapter-actions">
        <button class="btn-icon" @click="$emit('add-lesson', chapter.id)">➕ 添加课时</button>
        <button class="btn-icon" @click="$emit('edit-chapter', chapter)">✏️ 编辑</button>
        <button class="btn-icon" @click="$emit('delete-chapter', chapter.id)">🗑️ 删除</button>
      </div>
    </div>
    <div class="lesson-list">
      <div v-if="!chapter.videos || chapter.videos.length === 0" class="empty-lessons">
        暂无课时
      </div>
      <div
        v-for="video in chapter.videos"
        :key="video.id"
        class="lesson-item"
      >
        <div class="lesson-info">
          <span class="lesson-type">视频</span>
          <span class="lesson-name">{{ chapter.chapter_order }}.{{ video.video_order }} {{ video.title }}</span>
        </div>
        <div class="lesson-actions">
          <span class="lesson-duration">{{ formatDuration(video.duration) }}</span>
          <button class="btn-icon-small" @click="$emit('edit-lesson', video)">✏️</button>
          <button class="btn-icon-small" @click="$emit('delete-lesson', video.id)">🗑️</button>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
.chapter-item {
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
}
.chapter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f5f7fa;
}
.chapter-title {
  font-weight: 600;
  color: #333;
}
.chapter-actions {
  display: flex;
  gap: 8px;
}
.btn-icon {
  padding: 6px 12px;
  background: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}
.btn-icon:hover {
  background: #e3f2fd;
}
.btn-icon-small {
  padding: 4px 8px;
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  margin-left: 4px;
}
.btn-icon-small:hover {
  background: #f0f0f0;
}
.empty-lessons {
  padding: 20px;
  text-align: center;
  color: #999;
  font-size: 14px;
}
.lesson-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}
.lesson-list {
  padding: 12px 20px;
}
.lesson-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
}
.lesson-item:last-child {
  border-bottom: none;
}
.lesson-info {
  display: flex;
  align-items: center;
  gap: 12px;
}
.lesson-type {
  padding: 4px 10px;
  background: #e3f2fd;
  color: #2196f3;
  border-radius: 4px;
  font-size: 12px;
}
.lesson-name {
  color: #333;
}
.lesson-duration {
  color: #999;
  font-size: 13px;
}
</style>
