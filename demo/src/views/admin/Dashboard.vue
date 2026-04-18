<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { 
  getDashboardStats, 
  getRecentActivities, 
  createDashboardStream,
  notifyDashboardUpdate 
} from '@/api/admin'

const userStore = useUserStore()

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

// SSE连接状态
const sseStatus = ref('disconnected') // disconnected, connecting, connected, error
const lastUpdateTime = ref(null)
const sseController = ref(null)

// 重连相关
let reconnectTimer = null
let reconnectAttempts = 0
const maxReconnectAttempts = 5
const reconnectDelay = 3000

// 获取统计数据（初始加载）
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

// 获取最近活动（初始加载）
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

// 处理SSE数据更新
const handleSSEData = (data) => {
  if (data.stats) {
    stats.value = {
      totalUsers: data.stats.users?.total_users || 0,
      totalCourses: data.stats.courses?.total_courses || 0,
      totalVideos: data.stats.videos?.total_videos || 0,
      totalExams: data.stats.exams?.total_exams || 0,
      todayActive: 0,
      newUsersToday: data.stats.users?.new_users_today || 0,
      newCoursesToday: data.stats.courses?.new_courses_today || 0,
      pendingReviews: data.stats.courses?.pending_courses || 0
    }
  }
  
  if (data.activities) {
    recentActivities.value = data.activities
  }
  
  lastUpdateTime.value = new Date().toLocaleTimeString()
}

// 连接SSE
const connectSSE = () => {
  if (sseController.value) {
    sseController.value.close()
  }
  
  sseStatus.value = 'connecting'
  
  sseController.value = createDashboardStream({
    token: userStore.accessToken,
    onConnect: (data) => {
      sseStatus.value = 'connected'
      reconnectAttempts = 0
      console.log('[Dashboard] SSE连接成功:', data)
    },
    onMessage: (data) => {
      handleSSEData(data)
    },
    onError: (error) => {
      sseStatus.value = 'error'
      console.error('[Dashboard] SSE连接错误:', error)
      
      // 尝试重连
      if (reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++
        console.log(`[Dashboard] ${reconnectDelay}ms后尝试重连 (${reconnectAttempts}/${maxReconnectAttempts})`)
        reconnectTimer = setTimeout(() => {
          connectSSE()
        }, reconnectDelay)
      }
    },
    onClose: () => {
      sseStatus.value = 'disconnected'
    }
  })
}

// 断开SSE连接
const disconnectSSE = () => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  if (sseController.value) {
    sseController.value.close()
    sseController.value = null
  }
  sseStatus.value = 'disconnected'
}

// 手动刷新数据
const manualRefresh = async () => {
  try {
    await notifyDashboardUpdate()
  } catch (error) {
    console.error('手动刷新失败:', error)
  }
}

// 获取连接状态文本
const getStatusText = () => {
  const statusMap = {
    disconnected: '已断开',
    connecting: '连接中...',
    connected: '已连接',
    error: '连接错误'
  }
  return statusMap[sseStatus.value] || '未知'
}

// 获取连接状态样式
const getStatusClass = () => {
  const classMap = {
    disconnected: 'status-disconnected',
    connecting: 'status-connecting',
    connected: 'status-connected',
    error: 'status-error'
  }
  return classMap[sseStatus.value] || ''
}

onMounted(() => {
  // 先加载初始数据
  fetchStats()
  fetchActivities()
  
  // 然后建立SSE连接
  connectSSE()
})

onUnmounted(() => {
  disconnectSSE()
})
</script>

<template>
  <div class="dashboard-page">
    <div class="page-header">
      <h1 class="page-title">📊 仪表盘</h1>
      <div class="sse-status">
        <span class="status-label">实时连接:</span>
        <span :class="['status-dot', getStatusClass()]"></span>
        <span :class="['status-text', getStatusClass()]">{{ getStatusText() }}</span>
        <span v-if="lastUpdateTime" class="last-update">最后更新: {{ lastUpdateTime }}</span>
        <button class="refresh-btn" @click="manualRefresh" :disabled="sseStatus !== 'connected'">
          🔄 立即刷新
        </button>
      </div>
    </div>

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
        <div class="section-header">
          <h3>📋 最近活动</h3>
          <span v-if="recentActivities.length > 0" class="live-indicator">
            <span class="live-dot"></span>
            实时更新
          </span>
        </div>
        <div class="activity-list">
          <div v-for="activity in recentActivities" :key="activity.id" class="activity-item">
            <span class="activity-dot" :class="activity.type"></span>
            <span class="activity-content">{{ activity.content }}</span>
            <span class="activity-time">{{ activity.time }}</span>
          </div>
          <div v-if="recentActivities.length === 0" class="empty-activity">
            暂无活动记录
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
          <div v-if="categoryStats.length === 0" class="empty-category">
            暂无分类数据
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
  margin: 0;
}

/* SSE状态显示 */
.sse-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.status-label {
  color: #666;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ccc;
}

.status-text {
  font-weight: 500;
}

.status-connected {
  color: #4caf50;
}

.status-connected.status-dot {
  background: #4caf50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.2);
}

.status-connecting {
  color: #ff9800;
}

.status-connecting.status-dot {
  background: #ff9800;
  animation: pulse 1.5s infinite;
}

.status-disconnected {
  color: #999;
}

.status-disconnected.status-dot {
  background: #999;
}

.status-error {
  color: #f44336;
}

.status-error.status-dot {
  background: #f44336;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

.last-update {
  color: #999;
  font-size: 12px;
  margin-left: 8px;
}

.refresh-btn {
  margin-left: 8px;
  padding: 4px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: #f5f5f5;
  border-color: #667eea;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
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
  margin: 0;
}

.stat-info p {
  color: #666;
  font-size: 14px;
  margin: 4px 0;
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
  margin: 0 0 12px 0;
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
  margin: 0;
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

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.activity-section h3,
.category-section h3 {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin: 0;
}

.live-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #4caf50;
  font-weight: 500;
}

.live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #4caf50;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
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
  transition: background 0.2s;
}

.activity-item:hover {
  background: #f0f2ff;
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
  flex-shrink: 0;
}

.empty-activity,
.empty-category {
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: 14px;
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
  transition: width 0.5s ease;
}

.category-count {
  width: 50px;
  text-align: right;
  font-size: 13px;
  color: #666;
}

/* 响应式 */
@media (max-width: 968px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

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
