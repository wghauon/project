<script setup>
import CourseCard from '@/components/CourseCard.vue'
import router from '@/router'
import { useUserStore } from '@/stores/user'
import { courseListSearch, getTeacherStats } from '@/api/course'
import { getAnnouncements, deleteCourse } from '@/api/teacher'
import { ref, onMounted } from 'vue'

const userStore = useUserStore()
const courseList = ref([])
const stats = ref({
  course_count: 0,
  student_count: 0,
  pending_homework: 0,
  new_discussions: 0
})

// 公告列表
const announcements = ref([])

// 获取公告列表
const fetchAnnouncements = async () => {
  try {
    const res = await getAnnouncements()
    if (res.data.status === 0) {
      announcements.value = res.data.data || []
    }
  } catch (error) {
    console.error('获取公告失败:', error)
  }
}

// 获取课程列表
const fetchCourseList = async () => {
  const res = await courseListSearch(userStore.user_id)
  courseList.value = res.data.data
}

// 删除课程
const handleDeleteCourse = async (courseId) => {
  const confirmed = confirm(
    '确定要删除该课程吗？删除后无法恢复，所有课程数据（包括章节、视频、学生记录等）都将被删除。'
  )
  
  if (!confirmed) {
    return
  }
  
  try {
    const res = await deleteCourse(courseId)
    if (res.data.status === 0) {
      alert('课程删除成功')
      // 重新获取课程列表
      await fetchCourseList()
      // 刷新统计数据
      const statsRes = await getTeacherStats(userStore.user_id)
      if (statsRes.data.status === 0) {
        stats.value = statsRes.data.data
      }
    } else {
      alert(res.data.message || '删除失败')
    }
  } catch (error) {
    console.error('删除课程失败:', error)
    alert(error.response?.data?.message || '删除失败')
  }
}

// 跳转到公告列表页
const goToAnnouncements = () => {
  router.push('/teacher/announcements')
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

onMounted(async () => {
  // 获取课程列表
  await fetchCourseList()
  
  // 获取教师统计数据
  const statsRes = await getTeacherStats(userStore.user_id)
  if (statsRes.data.status === 0) {
    stats.value = statsRes.data.data
  }
  
  // 获取公告列表
  await fetchAnnouncements()
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
          <h3>{{ stats.course_count }}</h3>
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
          <h3>{{ stats.student_count }}</h3>
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
          <h3>{{ stats.pending_homework }}</h3>
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
          <h3>{{ stats.new_discussions }}</h3>
          <p>新讨论</p>
        </div>
      </div>
    </div>

    <!-- 公告区域 -->
    <div class="announcements-section" v-if="announcements.length > 0">
      <div class="section-header">
        <h2 class="section-title">📢 系统公告</h2>
        <button class="btn-toggle" @click="goToAnnouncements">
          查看全部
        </button>
      </div>
      <div class="announcement-list">
        <div 
          v-for="announcement in announcements.slice(0, 1)" 
          :key="announcement.notification_id" 
          class="announcement-card"
        >
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
            <span class="announcement-meta">📅 {{ announcement.created_at }}</span>
            <span class="announcement-meta">👤 {{ announcement.sender_name || '管理员' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 课程列表 -->
    <h2 class="section-title">📖 我的课程</h2>
    <div class="course-grid">
      <CourseCard 
        v-for="item in courseList" 
        :key="item.course_id" 
        :course="item"
        @delete="handleDeleteCourse"
      ></CourseCard>
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

/* 公告区域 */
.announcements-section {
  margin-bottom: 32px;
}
.announcements-section .section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.btn-toggle {
  padding: 8px 16px;
  background: #f5f7fa;
  color: #667eea;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.3s;
}
.btn-toggle:hover {
  background: #e0e0e0;
}
.announcement-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.announcement-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-left: 4px solid #667eea;
}
.announcement-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}
.announcement-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}
.top-badge {
  display: inline-block;
  padding: 2px 8px;
  background: #ff5252;
  color: white;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
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
  margin-bottom: 12px;
  font-size: 14px;
}
.announcement-footer {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: #999;
}
</style>
