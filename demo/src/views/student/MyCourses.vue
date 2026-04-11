<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getMyCourses } from '@/api/student'

const router = useRouter()
const userStore = useUserStore()

// 课程列表
const courses = ref([])
const loading = ref(false)

// 当前标签
const activeTab = ref('all')

// 过滤后的课程
const filteredCourses = computed(() => {
  if (activeTab.value === 'all') {
    return courses.value
  } else if (activeTab.value === 'ongoing') {
    return courses.value.filter(c => c.progress < 100)
  } else if (activeTab.value === 'finished') {
    return courses.value.filter(c => c.progress >= 100)
  }
  return courses.value
})

// 获取课程列表
const fetchCourses = async () => {
  loading.value = true
  try {
    const res = await getMyCourses()
    if (res.data.status === 0) {
      courses.value = res.data.data || []
      console.log(courses.value)
    } else {
      console.error('获取课程列表失败:', res.data.message)
    }
  } catch (error) {
    console.error('获取课程列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 切换标签
const switchTab = (tab) => {
  activeTab.value = tab
}

// 继续学习
const continueLearning = (courseId) => {
  router.push(`/student/course-study/${courseId}`)
}

// 查看详情
const viewDetail = (courseId) => {
  router.push(`/student/course-study/${courseId}`)
}

// 获取状态文本
const getStatusText = (status, progress) => {
  if (status === 'finished' || progress >= 100) {
    return '已结束'
  }
  return '进行中'
}

onMounted(() => {
  fetchCourses()
})
</script>

<template>
  <!-- 主内容 -->
  <main class="main-container">
    <div class="page-header">
      <h1 class="page-title">📖 我的课程</h1>
      <div class="course-tabs">
        <button :class="{ active: activeTab === 'all' }" @click="switchTab('all')">全部课程</button>
        <button :class="{ active: activeTab === 'ongoing' }" @click="switchTab('ongoing')">进行中</button>
        <button :class="{ active: activeTab === 'finished' }" @click="switchTab('finished')">已结束</button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>正在加载课程...</p>
    </div>

    <!-- 课程列表 -->
    <div v-else class="course-grid">
      <div
        v-for="course in filteredCourses"
        :key="course.course_id"
        class="course-card"
      >
        <div class="course-header" :style="{ backgroundImage: `url(${course.cover_image})`, backgroundSize: 'cover', backgroundPosition: 'center' }">
          <span class="course-status">{{ getStatusText(course.status, course.progress) }}</span>
          <h3 class="course-name">{{ course.course_name }}</h3>
        </div>
        <div class="course-body">
          <div class="course-teacher">
            <div class="teacher-avatar">👤</div>
            <span>{{ course.teacher_name }} · {{ course.department }}</span>
          </div>
          <div class="progress-section">
            <div class="progress-header">
              <span>学习进度</span>
              <span style="color: #667eea; font-weight: bold">{{ course.progress }}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: course.progress + '%' }"></div>
            </div>
          </div>
          <div class="course-actions">
            <button class="btn-primary" @click="continueLearning(course.course_id)">
              {{ course.progress >= 100 ? '复习课程' : '继续学习' }}
            </button>
            <button class="btn-secondary" @click="viewDetail(course.course_id)">查看详情</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && filteredCourses.length === 0" class="empty-state">
      <div class="empty-icon">📚</div>
      <p>暂无课程</p>
      <button class="btn-explore" @click="router.push('/student/class')">去发现课程</button>
    </div>
  </main>
</template>

<style scoped>
/* 主内容区 */
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
.course-tabs {
  display: flex;
  gap: 8px;
}
.course-tabs button {
  padding: 10px 20px;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}
.course-tabs button.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

/* 加载状态 */
.loading-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f0f0f0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 课程卡片 */
.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 24px;
}
.course-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s, box-shadow 0.3s;
}
.course-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}
.course-header {
  height: 140px;
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
.course-teacher {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  color: #666;
}
.teacher-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.progress-section {
  margin-bottom: 16px;
}
.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}
.progress-bar {
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
  transition: width 0.3s;
}
.course-actions {
  display: flex;
  gap: 12px;
}
.btn-primary {
  flex: 1;
  padding: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.2s;
}
.btn-primary:hover {
  transform: translateY(-2px);
}
.btn-secondary {
  padding: 10px 16px;
  background: #f5f7fa;
  color: #667eea;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}
.btn-secondary:hover {
  background: #e0e0e0;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: #999;
}
.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}
.btn-explore {
  margin-top: 20px;
  padding: 12px 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}
</style>
