<script setup>
import { ref, onMounted } from 'vue'
import { getDashboardStats, getRecentActivities } from '@/api/admin'

// 统计数据
const stats = ref({
  totalUsers: 0,
  totalCourses: 0,
  totalVideos: 0,
  totalExams: 0,
  todayActive: 0,
  newUsersToday: 0,
  newCoursesToday: 0,
  pendingReviews: 0
})

// 最近活动
const recentActivities = ref([])

// 课程分类统计
const categoryStats = ref([])

// 获取统计数据
const fetchStats = async () => {
  try {
    const res = await getDashboardStats()
    if (res.data.status === 0) {
      const data = res.data.data
      stats.value = {
        totalUsers: data.users?.total_users || 0,
        totalCourses: data.courses?.total_courses || 0,
        totalVideos: data.videos?.total_videos || 0,
        totalExams: data.exams?.total_exams || 0,
        todayActive: 0,
        newUsersToday: data.users?.new_users_today || 0,
        newCoursesToday: data.courses?.new_courses_today || 0,
        pendingReviews: data.courses?.pending_courses || 0
      }
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

// 获取最近活动
const fetchActivities = async () => {
  try {
    const res = await getRecentActivities()
    if (res.data.status === 0) {
      recentActivities.value = res.data.data || []
    }
  } catch (error) {
    console.error('获取最近活动失败:', error)
  }
}

onMounted(() => {
  fetchStats()
  fetchActivities()
})
</script>

<template>
  <div class="dashboard-page">
    <h1 class="page-title">📊 仪表盘</h1>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">👥</div>
        <div class="stat-info">
          <h3>{{ stats.totalUsers }}</h3>
          <p>总用户数</p>
          <span class="stat-change">+{{ stats.newUsersToday }} 今日新增</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">📚</div>
        <div class="stat-info">
          <h3>{{ stats.totalCourses }}</h3>
          <p>课程总数</p>
          <span class="stat-change">+{{ stats.newCoursesToday }} 今日新增</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">📹</div>
        <div class="stat-info">
          <h3>{{ stats.totalVideos }}</h3>
          <p>视频总数</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)">📝</div>
        <div class="stat-info">
          <h3>{{ stats.totalExams }}</h3>
          <p>考试总数</p>
        </div>
      </div>
    </div>

    <!-- 今日概览 -->
    <div class="overview-section">
      <div class="overview-card">
        <h3>今日活跃</h3>
        <div class="overview-number">{{ stats.todayActive }}</div>
        <p>人在线学习</p>
      </div>
      <div class="overview-card warning">
        <h3>待审核</h3>
        <div class="overview-number">{{ stats.pendingReviews }}</div>
        <p>个课程待审核</p>
      </div>
    </div>

    <!-- 主要内容区 -->
    <div class="main-content">
      <!-- 最近活动 -->
      <div class="activity-section">
        <h3>📋 最近活动</h3>
        <div class="activity-list">
          <div v-for="activity in recentActivities" :key="activity.id" class="activity-item">
            <span class="activity-dot" :class="activity.type"></span>
            <span class="activity-content">{{ activity.content }}</span>
            <span class="activity-time">{{ activity.time }}</span>
          </div>
        </div>
      </div>

      <!-- 课程分类统计 -->
      <div class="category-section">
        <h3>📊 课程分类统计</h3>
        <div class="category-list">
          <div v-for="category in categoryStats" :key="category.name" class="category-item">
            <span class="category-name">{{ category.name }}</span>
            <div class="category-bar">
              <div class="category-fill" :style="{ width: (category.count / 20 * 100) + '%' }"></div>
            </div>
            <span class="category-count">{{ category.count }}门</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px;
}

.page-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 24px;
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 56px;
  height: 56px;
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
  color: #666;
  font-size: 14px;
  margin-bottom: 4px;
}

.stat-change {
  font-size: 12px;
  color: #4caf50;
}

/* 今日概览 */
.overview-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.overview-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  text-align: center;
}

.overview-card.warning {
  background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
  color: white;
}

.overview-card.warning h3,
.overview-card.warning p {
  color: white;
}

.overview-card h3 {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}

.overview-number {
  font-size: 48px;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 8px;
}

.overview-card.warning .overview-number {
  color: white;
}

.overview-card p {
  color: #999;
  font-size: 14px;
}

/* 主要内容区 */
.main-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.activity-section,
.category-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.activity-section h3,
.category-section h3 {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 16px;
}

/* 活动列表 */
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9faff;
  border-radius: 8px;
}

.activity-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.activity-dot.user { background: #667eea; }
.activity-dot.course { background: #4caf50; }
.activity-dot.exam { background: #ff9800; }
.activity-dot.system { background: #9c27b0; }
.activity-dot.experiment { background: #00bcd4; }

.activity-content {
  flex: 1;
  font-size: 14px;
  color: #333;
}

.activity-time {
  font-size: 12px;
  color: #999;
}

/* 分类统计 */
.category-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.category-name {
  width: 100px;
  font-size: 14px;
  color: #666;
}

.category-bar {
  flex: 1;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.category-fill {
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
  transition: width 0.3s;
}

.category-count {
  width: 50px;
  text-align: right;
  font-size: 13px;
  color: #666;
}

/* 响应式 */
@media (max-width: 968px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .main-content {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .overview-section {
    grid-template-columns: 1fr;
  }
}
</style>
