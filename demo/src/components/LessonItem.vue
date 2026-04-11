<script setup>
const props = defineProps({
  lesson: {
    type: Object,
    required: true,
  },
  lessonNumber: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['update', 'remove'])

// 更新课时数据
function updateTitle(event) {
  emit('update', { title: event.target.value })
}

function updateType(event) {
  emit('update', { type: event.target.value })
}

// 移除课时
function remove() {
  emit('remove')
}
</script>
<template>
  <div class="lesson-item">
    <div class="lesson-number">{{ lessonNumber }}</div>
    <div class="lesson-input">
      <input
        type="text"
        placeholder="课时标题，如：类与对象的概念"
        :value="lesson.title"
        @input="updateTitle"
      />
    </div>
    <select class="lesson-type-select" :value="lesson.type" @change="updateType">
      <option value="video">视频</option>
      <option value="doc">文档</option>
      <option value="quiz">测验</option>
    </select>
    <button class="btn-remove" @click="remove">🗑️</button>
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
  flex-shrink: 0;
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
  transition: border-color 0.3s;
}
.lesson-input input:focus {
  outline: none;
  border-color: #667eea;
}
.lesson-type-select {
  padding: 10px 14px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  cursor: pointer;
}
.btn-remove {
  padding: 10px;
  background: #ffebee;
  color: #f44336;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s;
}
.btn-remove:hover {
  background: #f44336;
  color: white;
}
</style>
