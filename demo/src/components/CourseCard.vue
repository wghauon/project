<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
defineProps({
  course: {
    type: Object,
    required: true,
  },
})
function checkStatus(status) {
  if (status === 0) return '草稿'
  if (status === 1) return '待审核'
  if (status === 2) return '已通过'
}
</script>
<template>
  <div class="course-card">
    <div class="course-cover">
      <span class="course-status">{{ checkStatus(course.status) }}</span>
      <h3 class="course-name">{{ course.course_name }}</h3>
    </div>
    <div class="course-body">
      <div class="course-stats">
        <span>👨‍🎓 86人</span>
        <span>📹 {{ course.hours }}课时</span>
        <span>📝 12作业</span>
      </div>
      <div class="course-actions">
        <button
          class="btn-manage"
          @click="router.push(`/teacher/course-manage/${course.course_id}/chapter-manage`)"
        >
          管理课程
        </button>
        <button class="btn-edit">编辑</button>
      </div>
    </div>
  </div>
</template>
<style scoped>
.course-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.course-cover {
  height: 160px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: white;
}
.course-status {
  display: inline-block;
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  font-size: 12px;
  width: fit-content;
}
.course-name {
  font-size: 20px;
  font-weight: bold;
}
.course-body {
  padding: 20px;
}
.course-stats {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
  font-size: 14px;
  color: #666;
}
.course-stats span {
  display: flex;
  align-items: center;
  gap: 6px;
}
.course-actions {
  display: flex;
  gap: 12px;
}
.btn-manage {
  flex: 1;
  padding: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}
.btn-edit {
  padding: 10px 16px;
  background: #f5f7fa;
  color: #667eea;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}
</style>
