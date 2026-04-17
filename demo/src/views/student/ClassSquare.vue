<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getCourseList, joinCourse, getAnnouncements } from '@/api/student'

const router = useRouter()
const userStore = useUserStore()

// 课程列表
const courses = ref([])
const loading = ref(false)

// 公告列表
const announcements = ref([])

// 筛选条件
const filters = ref({
  category: '',
  type: '',
  difficulty: '',
  status: ''
})

// 排序方式
const sortBy = ref('comprehensive')

// 获取课程列表
const fetchCourses = async () => {
  loading.value = true
  try {
    const params = {}
    if (filters.value.category) params.category = filters.value.category
    if (filters.value.difficulty) params.difficulty = filters.value.difficulty

    const res = await getCourseList(params)
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

// 跳转到公告列表页
const goToAnnouncements = () => {
  router.push('/student/announcements')
}

// 筛选课程
const filterCourses = () => {
  fetchCourses()
}

// 排序课程
const sortCourses = (type) => {
  sortBy.value = type
  // 根据排序方式重新排序
  if (type === 'newest') {
    courses.value.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  } else if (type === 'popular') {
    courses.value.sort((a, b) => b.student_count - a.student_count)
  }
}

// 加入课程
const handleJoinCourse = async (course) => {
  if (!userStore.accessToken) {
    alert('请先登录')
    router.push('/')
    return
  }
  try {
    const res = await joinCourse({ course_id: course.course_id })
    if (res.data.status === 0) {
      alert(res.data.message)
    } else {
      alert(res.data.message || '加入课程失败')
    }
  } catch (error) {
    console.error('加入课程失败:', error)
    alert('加入课程失败，请稍后重试')
  }
}

// 查看课程详情
const viewCourseDetail = (courseId) => {
  router.push(`/student/course-study/${courseId}`)
}

// 获取难度文本
const getDifficultyText = (difficulty) => {
  const map = { 1: '入门', 2: '初级', 3: '中级', 4: '高级' }
  return map[difficulty] || '未知'
}

// 获取封面渐变
const getCoverGradient = (index) => {
  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)'
  ]
  return gradients[index % gradients.length]
}

onMounted(() => {
  fetchCourses()
  fetchAnnouncements()
})
</script>

<template>
  <!-- 公告区域 -->
  <section class="announcement-section" v-if="announcements.length > 0">
    <div class="announcement-container">
      <div class="announcement-header-bar">
        <h2 class="announcement-section-title">📢 系统公告</h2>
        <button class="btn-toggle-announcement" @click="goToAnnouncements">
          查看全部
        </button>
      </div>
      <div class="announcement-list">
        <div
          v-for="announcement in announcements.slice(0, 1)"
          :key="announcement.notification_id"
          class="announcement-card"
        >
          <div class="announcement-card-header">
            <h3 class="announcement-card-title">
              <span v-if="announcement.is_top" class="top-badge">置顶</span>
              {{ announcement.title }}
            </h3>
            <span class="announcement-card-type" :class="getTypeClass(announcement.type)">
              {{ getTypeText(announcement.type) }}
            </span>
          </div>
          <p class="announcement-card-content">{{ announcement.content }}</p>
          <div class="announcement-card-footer">
            <span class="announcement-card-meta">📅 {{ announcement.created_at }}</span>
            <span class="announcement-card-meta">👤 {{ announcement.sender_name || '管理员' }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- 搜索筛选区 -->
  <section class="search-section">
    <div class="search-container">
      <h2 class="search-title">🔍 发现优质课程</h2>
      <div class="filter-bar">
        <div class="filter-group">
          <label>学科分类</label>
          <select v-model="filters.category" @change="filterCourses">
            <option value="">全部学科</option>
            <option value="cs">计算机科学</option>
            <option value="math">数学</option>
            <option value="physics">物理</option>
            <option value="chemistry">化学</option>
            <option value="literature">文学</option>
            <option value="language">语言</option>
          </select>
        </div>
        <div class="filter-group">
          <label>课程类型</label>
          <select v-model="filters.type" @change="filterCourses">
            <option value="">全部类型</option>
            <option value="required">必修课</option>
            <option value="elective">选修课</option>
            <option value="public">公共课</option>
          </select>
        </div>
        <div class="filter-group">
          <label>难度等级</label>
          <select v-model="filters.difficulty" @change="filterCourses">
            <option value="">全部难度</option>
            <option value="1">入门级</option>
            <option value="2">进阶级</option>
            <option value="3">高级</option>
          </select>
        </div>
        <div class="filter-group">
          <label>开课状态</label>
          <select v-model="filters.status" @change="filterCourses">
            <option value="">全部状态</option>
            <option value="ongoing">进行中</option>
            <option value="upcoming">即将开课</option>
            <option value="finished">已结束</option>
          </select>
        </div>
        <button class="btn-search" @click="filterCourses">筛选课程</button>
      </div>
    </div>
  </section>

  <!-- 课程列表 -->
  <section class="content-section">
    <div class="section-header">
      <h3 class="section-title">📖 热门课程</h3>
      <div class="view-options">
        <button :class="{ active: sortBy === 'comprehensive' }" @click="sortCourses('comprehensive')">综合排序</button>
        <button :class="{ active: sortBy === 'newest' }" @click="sortCourses('newest')">最新发布</button>
        <button :class="{ active: sortBy === 'popular' }" @click="sortCourses('popular')">最多人学</button>
        <button :class="{ active: sortBy === 'rating' }" @click="sortCourses('rating')">评分最高</button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>正在加载课程...</p>
    </div>

    <!-- 课程网格 -->
    <div v-else class="course-grid">
      <div
        v-for="(course, index) in courses"
        :key="course.course_id"
        class="course-card"
      >
        <div
          class="course-cover"
          :style="{ background: getCoverGradient(index) }"
          @click="viewCourseDetail(course.course_id)"
        >
          <span class="course-emoji">{{ ['💻', '📊', '🧮', '🌐', '🤖', '📱', '🎨', '📈'][index % 8] }}</span>
          <div class="course-difficulty">{{ getDifficultyText(course.difficulty) }}</div>
        </div>
        <div class="course-info">
          <h4 class="course-title" @click="viewCourseDetail(course.course_id)">{{ course.course_name }}</h4>
          <p class="course-teacher">👤 {{ course.teacher_name }} · {{ course.department }}</p>
          <div class="course-meta">
            <span>👥 {{ course.student_count }}人在学</span>
            <span class="course-tag">{{ course.category }}</span>
          </div>
          <div class="course-actions">
            <button class="btn-join" @click="handleJoinCourse(course)">加入学习</button>
            <button class="btn-detail" @click="viewCourseDetail(course.course_id)">查看详情</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && courses.length === 0" class="empty-state">
      <div class="empty-icon">📚</div>
      <p>暂无课程</p>
    </div>

    <!-- 分页 -->
    <div v-if="!loading && courses.length > 0" class="pagination">
      <button>上一页</button>
      <button class="active">1</button>
      <button>2</button>
      <button>3</button>
      <button>4</button>
      <button>5</button>
      <button>下一页</button>
    </div>
  </section>
</template>

<style scoped>
/* 公告区域 */
.announcement-section {
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
  padding: 30px 20px;
  border-bottom: 1px solid #e0e0e0;
}
.announcement-container {
  max-width: 1200px;
  margin: 0 auto;
}
.announcement-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.announcement-section-title {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}
.btn-toggle-announcement {
  padding: 8px 16px;
  background: white;
  color: #667eea;
  border: 1px solid #667eea;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
}
.btn-toggle-announcement:hover {
  background: #667eea;
  color: white;
}
.announcement-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 16px;
}
.announcement-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-left: 4px solid #667eea;
}
.announcement-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}
.announcement-card-title {
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
.announcement-card-type {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}
.announcement-card-type.system {
  background: #e3f2fd;
  color: #2196f3;
}
.announcement-card-type.important {
  background: #ffebee;
  color: #f44336;
}
.announcement-card-type.notice {
  background: #fff3e0;
  color: #ff9800;
}
.announcement-card-content {
  color: #666;
  line-height: 1.7;
  margin-bottom: 12px;
  font-size: 14px;
}
.announcement-card-footer {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: #999;
}

/* 搜索筛选区 */
.search-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px;
}
.search-container {
  max-width: 1200px;
  margin: 0 auto;
}
.search-title {
  color: white;
  font-size: 28px;
  margin-bottom: 24px;
  text-align: center;
}
.filter-bar {
  background: white;
  padding: 20px;
  border-radius: 12px;
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}
.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}
.filter-group label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}
.filter-group select {
  padding: 10px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  min-width: 140px;
}
.filter-group select:focus {
  outline: none;
  border-color: #667eea;
}
.btn-search {
  padding: 10px 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  margin-left: auto;
}

/* 课程列表 */
.content-section {
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 20px;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.section-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}
.view-options {
  display: flex;
  gap: 12px;
}
.view-options button {
  padding: 8px 16px;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}
.view-options button.active {
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

/* 课程网格 */
.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
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
.course-cover {
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 48px;
  position: relative;
  cursor: pointer;
}
.course-emoji {
  font-size: 64px;
}
.course-difficulty {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  font-size: 12px;
  backdrop-filter: blur(4px);
}
.course-info {
  padding: 20px;
}
.course-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
  line-height: 1.4;
  cursor: pointer;
}
.course-title:hover {
  color: #667eea;
}
.course-teacher {
  color: #666;
  font-size: 14px;
  margin-bottom: 12px;
}
.course-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #999;
  margin-bottom: 16px;
}
.course-tag {
  padding: 4px 10px;
  background: #f0f4ff;
  color: #667eea;
  border-radius: 4px;
  font-size: 12px;
}
.course-actions {
  display: flex;
  gap: 12px;
}
.btn-join {
  flex: 1;
  padding: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: transform 0.2s;
}
.btn-join:hover {
  transform: translateY(-2px);
}
.btn-detail {
  padding: 10px 16px;
  background: #f5f7fa;
  color: #666;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}
.btn-detail:hover {
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

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 40px;
}
.pagination button {
  padding: 10px 16px;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}
.pagination button.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}
.pagination button:hover:not(.active) {
  border-color: #667eea;
  color: #667eea;
}
</style>
