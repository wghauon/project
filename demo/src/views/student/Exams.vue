<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getExamList } from '@/api/student'

const router = useRouter()

// 当前标签
const activeTab = ref('all')

// 考试列表
const exams = ref([])
const loading = ref(false)

// 过滤后的考试列表
const filteredExams = computed(() => {
  if (activeTab.value === 'all') {
    return exams.value
  }
  return exams.value.filter(exam => exam.status === activeTab.value)
})

// 获取考试列表
const fetchExams = async () => {
  loading.value = true
  try {
    const res = await getExamList()
    if (res.data.status === 0) {
      exams.value = res.data.data || []
    } else {
      console.error('获取考试列表失败:', res.data.message)
    }
  } catch (error) {
    console.error('获取考试列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 切换标签
const switchTab = (tab) => {
  activeTab.value = tab
}

// 开始/继续考试
const startExam = (exam) => {
  if (exam.status === 'ongoing') {
    router.push(`/student/exam-taking/${exam.exam_id}`)
  } else if (exam.status === 'upcoming') {
    alert('考试尚未开始')
  }
}

// 查看解析
const viewAnalysis = (exam) => {
  router.push(`/student/exam-result/${exam.exam_id}`)
}

// 申请补考
const applyRetake = (exam) => {
  alert(`已申请补考：${exam.exam_name}`)
}

// 获取状态文本
const getStatusText = (status) => {
  const map = {
    'upcoming': '待开始',
    'ongoing': '进行中',
    'completed': '已完成',
    'missed': '缺考'
  }
  return map[status] || '未知'
}

// 获取状态样式类
const getStatusClass = (status) => {
  return status
}

// 获取图标
const getIcon = (index) => {
  const icons = ['📝', '📋', '📊', '💻', '📚']
  return icons[index % icons.length]
}

// 获取渐变
const getGradient = (index) => {
  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
  ]
  return gradients[index % gradients.length]
}

onMounted(() => {
  fetchExams()
})
</script>

<template>
  <!-- 主内容 -->
  <main class="main-container">
    <div class="page-header">
      <h1 class="page-title">📝 考试中心</h1>
      <div class="filter-tabs">
        <button :class="{ active: activeTab === 'all' }" @click="switchTab('all')">全部</button>
        <button :class="{ active: activeTab === 'upcoming' }" @click="switchTab('upcoming')">待考试</button>
        <button :class="{ active: activeTab === 'ongoing' }" @click="switchTab('ongoing')">进行中</button>
        <button :class="{ active: activeTab === 'completed' }" @click="switchTab('completed')">已结束</button>
      </div>
    </div>

    <div class="exam-list">
      <div v-for="(exam, index) in filteredExams" :key="exam.exam_id" class="exam-card">
        <div class="exam-main">
          <div class="exam-icon" :style="{ background: getGradient(index) }">
            {{ getIcon(index) }}
          </div>
          <div class="exam-info">
            <div class="exam-header">
              <h3 class="exam-title">{{ exam.exam_name }}</h3>
              <span class="status-badge" :class="getStatusClass(exam.status)">
                {{ getStatusText(exam.status) }}
              </span>
            </div>
            <div class="exam-course">📖 {{ exam.course_name }}</div>
            <div class="exam-meta">
              <span v-if="exam.duration">⏱️ 考试时长：{{ exam.duration }}分钟</span>
              <span v-if="exam.total_score">📊 总分：{{ exam.total_score }}分</span>
              <span v-if="exam.question_count">📝 题目：{{ exam.question_count }}道</span>
              <span v-if="exam.remaining_time">⏰ 剩余时间：{{ exam.remaining_time }}分钟</span>
              <span v-if="exam.used_time">⏱️ 用时：{{ exam.used_time }}分钟</span>
              <span v-if="exam.start_time && exam.status !== 'completed'">📅 开始时间：{{ exam.start_time }}</span>
              <span v-if="exam.submit_time">📅 提交时间：{{ exam.submit_time }}</span>
              <span v-if="exam.rank">📊 班级排名：{{ exam.rank }}/{{ exam.total_students }}</span>
            </div>
          </div>
        </div>
        <div class="exam-actions">
          <!-- 进行中的考试 -->
          <template v-if="exam.status === 'ongoing'">
            <button class="btn-primary" @click="startExam(exam)">继续考试</button>
          </template>
          
          <!-- 待开始的考试 -->
          <template v-else-if="exam.status === 'upcoming'">
            <div class="countdown">
              <div class="countdown-label">距离开始</div>
              <div class="countdown-value">{{ exam.countdown }}</div>
            </div>
          </template>
          
          <!-- 已完成的考试 -->
          <template v-else-if="exam.status === 'completed'">
            <div class="score-display">
              <div class="score-label">考试成绩</div>
              <div class="score-value">{{ exam.score }}<span class="score-total">/100</span></div>
            </div>
            <button class="btn-secondary" @click="viewAnalysis(exam)">查看解析</button>
          </template>
          
          <!-- 缺考的考试 -->
          <template v-else-if="exam.status === 'missed'">
            <button class="btn-secondary" @click="applyRetake(exam)">申请补考</button>
          </template>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="filteredExams.length === 0" class="empty-state">
      <div class="empty-icon">📝</div>
      <p>暂无考试</p>
    </div>
  </main>
</template>

<style scoped>
/* 主内容 */
.main-container {
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
}
.filter-tabs {
  display: flex;
  gap: 8px;
}
.filter-tabs button {
  padding: 10px 20px;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}
.filter-tabs button.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

/* 考试列表 */
.exam-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.exam-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 24px;
  align-items: center;
}
.exam-main {
  display: flex;
  gap: 20px;
}
.exam-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  flex-shrink: 0;
}
.exam-info {
  flex: 1;
}
.exam-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}
.exam-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}
.status-badge {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}
.status-badge.upcoming {
  background: #e3f2fd;
  color: #2196f3;
}
.status-badge.ongoing {
  background: #e8f5e9;
  color: #4caf50;
}
.status-badge.completed {
  background: #f5f5f5;
  color: #666;
}
.status-badge.missed {
  background: #ffebee;
  color: #f44336;
}
.exam-course {
  color: #667eea;
  font-size: 14px;
  margin-bottom: 12px;
}
.exam-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 13px;
  color: #666;
}
.exam-meta span {
  display: flex;
  align-items: center;
  gap: 6px;
}
.exam-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-end;
}
.btn-primary {
  padding: 12px 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  min-width: 120px;
  transition: transform 0.2s;
}
.btn-primary:hover {
  transform: translateY(-2px);
}
.btn-secondary {
  padding: 12px 32px;
  background: #f5f7fa;
  color: #667eea;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  min-width: 120px;
}
.btn-secondary:hover {
  background: #e0e0e0;
}
.score-display {
  text-align: center;
  padding: 16px 32px;
  background: #e8f5e9;
  border-radius: 8px;
}
.score-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}
.score-value {
  font-size: 28px;
  font-weight: bold;
  color: #4caf50;
}
.score-total {
  font-size: 14px;
  color: #666;
}
.countdown {
  text-align: center;
  padding: 12px 24px;
  background: #fff3e0;
  border-radius: 8px;
}
.countdown-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}
.countdown-value {
  font-size: 18px;
  font-weight: bold;
  color: #ff9800;
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

/* 响应式 */
@media (max-width: 768px) {
  .exam-card {
    grid-template-columns: 1fr;
  }
  .exam-actions {
    align-items: stretch;
  }
  .exam-meta {
    gap: 8px;
  }
}
</style>
