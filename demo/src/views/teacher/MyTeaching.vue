<script setup>
import CourseCard from '@/components/CourseCard.vue'
import router from '@/router'
import { useUserStore } from '@/stores/user'
import { courseListSearch } from '@/api/course'
import { ref, onMounted } from 'vue'
const userStore = useUserStore()
const courseList = ref([])
onMounted(async () => {
  const res = await courseListSearch(userStore.user_id)
  courseList.value = res.data.data
})
</script>
<template>
  <!-- 主内容 -->
  <main class="main-container">
    <div class="page-header">
      <h1 class="page-title">👨‍🏫 我的教学</h1>
      <button class="btn-primary" @click="router.push('/teacher/create-course')">
        ➕ 创建课程
      </button>
    </div>

    <!-- 统计数据 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📚</div>
        <div class="stat-info">
          <h3>{{ courseList.length }}</h3>
          <p>在授课程</p>
        </div>
      </div>
      <div class="stat-card">
        <div
          class="stat-icon"
          style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
        >
          👨‍🎓
        </div>
        <div class="stat-info">
          <h3>286</h3>
          <p>学生总数</p>
        </div>
      </div>
      <div class="stat-card">
        <div
          class="stat-icon"
          style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
        >
          📝
        </div>
        <div class="stat-info">
          <h3>12</h3>
          <p>待批改作业</p>
        </div>
      </div>
      <div class="stat-card">
        <div
          class="stat-icon"
          style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
        >
          💬
        </div>
        <div class="stat-info">
          <h3>45</h3>
          <p>新讨论</p>
        </div>
      </div>
    </div>

    <!-- 课程列表 -->
    <h2 class="section-title">📖 我的课程</h2>
    <div class="course-grid">
      <CourseCard v-for="item in courseList" :key="item.course_id" :course="item"></CourseCard>
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
/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}
.stat-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 16px;
}
.stat-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}
.stat-info h3 {
  font-size: 28px;
  font-weight: bold;
  color: #333;
}
.stat-info p {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}
/* 课程列表 */
.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
}
.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 24px;
}
</style>
