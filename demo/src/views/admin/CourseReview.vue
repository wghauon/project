<script setup>
import { ref, onMounted } from 'vue'
import { getPendingCourses, approveCourse, rejectCourse } from '@/api/admin'

// 课程列表
const courses = ref([])
const loading = ref(false)

// 获取待审核课程
const fetchCourses = async () => {
  loading.value = true
  try {
    const res = await getPendingCourses()
    if (res.data.status === 0) {
      courses.value = res.data.data || []
    } else {
      console.error('获取课程列表失败:', res.data.message)
    }
  } catch (error) {
    console.error('获取课程列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 通过课程
const handleApprove = async (course) => {
  const remark = prompt('请输入审核意见（可选）：')
  if (remark === null) return
  
  try {
    const res = await approveCourse(course.course_id, { review_remark: remark })
    if (res.data.status === 0) {
      alert('审核通过')
      fetchCourses()
    } else {
      alert(res.data.message || '操作失败')
    }
  } catch (error) {
    console.error('操作失败:', error)
    alert('操作失败，请稍后重试')
  }
}

// 拒绝课程
const handleReject = async (course) => {
  const remark = prompt('请输入拒绝原因：')
  if (!remark) {
    alert('请输入拒绝原因')
    return
  }
  
  try {
    const res = await rejectCourse(course.course_id, { review_remark: remark })
    if (res.data.status === 0) {
      alert('已拒绝')
      fetchCourses()
    } else {
      alert(res.data.message || '操作失败')
    }
  } catch (error) {
    console.error('操作失败:', error)
    alert('操作失败，请稍后重试')
  }
}

// 查看详情
const viewDetail = (course) => {
  alert(`查看课程详情：${course.course_name}`)
}

// 获取难度文本
const getDifficultyText = (difficulty) => {
  const map = { 1: '入门级', 2: '初级', 3: '中级', 4: '高级' }
  return map[difficulty] || '未知'
}

// 获取封面渐变
const getCoverGradient = (index) => {
  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
  ]
  return gradients[index % gradients.length]
}

// 获取图标
const getIcon = (index) => {
  const icons = ['🤖', '🧠', '☁️', '🔒', '💻', '📊', '🎨', '📱']
  return icons[index % icons.length]
}

onMounted(() => {
  fetchCourses()
})
</script>

<template>
  <!-- 主内容 -->
  <main class="main-container">
    <div class="page-header">
      <h1 class="page-title">📚 课程审核</h1>
    </div>

    <div class="filter-bar">
      <div class="filter-tabs">
        <button class="active">待审核</button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>正在加载课程...</p>
    </div>

    <div v-else class="course-list">
      <div v-if="courses.length === 0" class="empty-state">
        <div class="empty-icon">📚</div>
        <p>暂无待审核课程</p>
      </div>
      
      <div v-for="(course, index) in courses" :key="course.course_id" class="course-card">
        <div class="course-cover" :style="{ background: getCoverGradient(index) }">
          {{ getIcon(index) }}
        </div>
        <div class="course-info">
          <span class="status-badge pending">待审核</span>
          <h3>{{ course.course_name }}</h3>
          <div class="course-teacher">👤 {{ course.teacher_name }} · {{ course.department }} · 提交于 {{ course.created_at }}</div>
          <p class="course-desc">{{ course.description }}</p>
          <div class="course-meta">
            <span>📊 难度：{{ getDifficultyText(course.difficulty) }}</span>
            <span>⏱️ {{ course.duration || 0 }}课时</span>
            <span>👥 预计容量：{{ course.capacity || 100 }}人</span>
          </div>
        </div>
        <div class="course-actions">
          <button class="btn-success" @click="handleApprove(course)">✓ 通过</button>
          <button class="btn-danger" @click="handleReject(course)">✗ 拒绝</button>
          <button class="btn-secondary" @click="viewDetail(course)">查看详情</button>
        </div>
      </div>
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
/* 筛选栏 */
.filter-bar {
  background: white;
  padding: 16px 20px;
  border-radius: 12px;
  margin-bottom: 24px;
  display: flex;
  gap: 16px;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
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
.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}
.filter-group select {
  padding: 8px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
}
/* 课程列表 */
.course-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.course-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 24px;
  align-items: start;
}
.course-cover {
  width: 160px;
  height: 100px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 48px;
}
.course-info h3 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}
.course-teacher {
  color: #666;
  font-size: 14px;
  margin-bottom: 12px;
}
.course-desc {
  color: #999;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 12px;
}
.course-meta {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: #999;
}
.course-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.btn-success {
  padding: 10px 24px;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}
.btn-danger {
  padding: 10px 24px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}
.btn-secondary {
  padding: 10px 24px;
  background: #f5f7fa;
  color: #667eea;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}
.status-badge {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 12px;
  display: inline-block;
}
.status-badge.pending {
  background: #fff3e0;
  color: #ff9800;
}
.status-badge.approved {
  background: #e8f5e9;
  color: #4caf50;
}
.status-badge.rejected {
  background: #ffebee;
  color: #f44336;
}
</style>
