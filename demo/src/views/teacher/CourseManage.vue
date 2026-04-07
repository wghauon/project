<script setup>
import TeacherSideMenu from '@/components/TeacherSideMenu.vue'
import { useRoute } from 'vue-router'
import { onMounted } from 'vue'
import { courseDetailSearch } from '@/api/course'
import { ref } from 'vue'
import { useTeacherStore } from '@/stores/teacher'
const teacherStore = useTeacherStore()
const route = useRoute()
const { course_id } = route.params
teacherStore.setCourseID(course_id)
const course = ref({})
onMounted(async () => {
  const res = await courseDetailSearch(course_id)
  course.value = res.data.data
})
</script>
<template>
  <!-- 主内容 -->
  <main class="main-container">
    <!-- 课程标题 -->
    <div class="course-header">
      <div class="course-info">
        <h1>{{ course.course_name }}</h1>
        <div class="course-meta">
          <span>👨‍🎓 86名学生</span>
          <span>📹 {{ course.hours }}课时</span>
          <span>📅 2024春季学期</span>
          <span>🟢 进行中</span>
        </div>
      </div>
      <div class="course-actions">
        <button class="btn-secondary">预览课程</button>
        <button class="btn-primary">编辑信息</button>
      </div>
    </div>
    <!-- 管理区域 -->
    <div class="manage-container">
      <!-- 侧边菜单 -->
      <TeacherSideMenu></TeacherSideMenu>
      <!-- 内容区 -->
      <router-view></router-view>
    </div>
  </main>
</template>
<style scoped>
/* 主内容 */
.main-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px 20px;
}
/* 课程标题栏 */
.course-header {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.course-info h1 {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}
.course-meta {
  display: flex;
  gap: 20px;
  color: #666;
  font-size: 14px;
}
.course-actions {
  display: flex;
  gap: 12px;
}
.btn-primary {
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}
.btn-secondary {
  padding: 10px 20px;
  background: #f5f7fa;
  color: #667eea;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}
/* 管理区域 */
.manage-container {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 24px;
}
</style>
