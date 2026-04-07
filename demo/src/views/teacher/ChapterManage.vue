<script setup>
import ChapterItem from '@/components/ChapterItem.vue'
import router from '@/router'
</script>
<template>
  <div class="content-area">
    <div class="content-header">
      <h2 class="content-title">📑 章节管理</h2>
      <button class="btn-primary" @click="router.push('/teacher/chapter-add')">➕ 添加章节</button>
    </div>
    <div class="chapter-list">
      <ChapterItem></ChapterItem>
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
/* 章节管理 */
.chapter-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
