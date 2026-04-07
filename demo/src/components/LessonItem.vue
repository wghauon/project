<script setup>
defineProps({
  lessonNumber: {
    type: Number,
    required: true,
  },
})
</script>
<template>
  <div class="lesson-item">
    <div class="lesson-number">{{ lessonNumber }}</div>
    <div class="lesson-input">
      <input type="text" placeholder="课时标题，如：类与对象的概念" />
    </div>
    <select class="lesson-type-select">
      <option value="video">视频</option>
      <option value="doc">文档</option>
      <option value="quiz">测验</option>
    </select>
    <button class="btn-remove">🗑️</button>
  </div>
</template>
<style scoped>
.lesson-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  border: 2px dashed #e0e0e0;
}
.lesson-number {
  width: 32px;
  height: 32px;
  background: #667eea;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
}
.lesson-input {
  flex: 1;
}
.lesson-input input {
  width: 100%;
  padding: 10px 14px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
}
.lesson-type-select {
  padding: 10px 14px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  background: white;
}
.btn-remove {
  padding: 10px;
  background: #ffebee;
  color: #f44336;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
}
</style>
