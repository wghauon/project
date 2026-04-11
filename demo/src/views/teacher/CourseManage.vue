<script setup>
import { useRoute, useRouter } from 'vue-router'
import { onMounted, ref, computed } from 'vue'
import { courseDetailSearch } from '@/api/course'
import { getTeacherCourses, getChapters, addChapter as addChapterAPI, updateChapter as updateChapterAPI, deleteChapter as deleteChapterAPI, getVideos, deleteVideo as deleteVideoAPI } from '@/api/teacher'
import { useTeacherStore } from '@/stores/teacher'
import CourseManageNavigator from '@/components/CourseManageNavigator.vue'

const teacherStore = useTeacherStore()
const route = useRoute()
const router = useRouter()
const course_id = computed(() => route.params.course_id)

teacherStore.setCourseID(course_id.value)

const course = ref({
  course_name: '',
  hours: 0,
  student_count: 0,
  semester: '',
  status: '进行中'
})

// 统计信息
const stats = ref({
  studentCount: 0,
  videoCount: 0,
  materialCount: 0,
  discussionCount: 0
})

// 章节列表
const chapters = ref([])

// 视频列表
const videos = ref([])

// 当前激活的标签
const activeTab = ref('chapter')

// 加载课程详情
const fetchCourseDetail = async () => {
  try {
    const res = await courseDetailSearch(course_id.value)
    if (res.data && res.data.data) {
      course.value = { ...course.value, ...res.data.data }
    }
  } catch (error) {
    console.error('获取课程详情失败:', error)
  }
}

// 获取章节列表
const fetchChapters = async () => {
  try {
    const res = await getChapters(course_id.value)
    if (res.data.status === 0) {
      chapters.value = res.data.data || []
    }
  } catch (error) {
    console.error('获取章节列表失败:', error)
  }
}

// 获取视频列表
const fetchVideos = async () => {
  try {
    const res = await getVideos(course_id.value)
    if (res.data.status === 0) {
      videos.value = res.data.data || []
      stats.value.videoCount = videos.value.length
    }
  } catch (error) {
    console.error('获取视频列表失败:', error)
  }
}

// 加载课程详情
onMounted(async () => {
  await fetchCourseDetail()
  await fetchChapters()
  await fetchVideos()
})

// 切换标签
const switchTab = (tab) => {
  activeTab.value = tab
}

// 添加章节
const addChapter = async () => {
  const name = prompt('请输入章节名称：')
  if (name) {
    try {
      const res = await addChapterAPI({
        course_id: course_id.value,
        chapter_name: name,
        chapter_no: chapters.value.length + 1
      })
      if (res.data.status === 0) {
        alert('章节添加成功')
        fetchChapters()
      } else {
        alert(res.data.message || '添加失败')
      }
    } catch (error) {
      console.error('添加章节失败:', error)
      alert('添加失败，请稍后重试')
    }
  }
}

// 编辑章节
const editChapter = async (chapter) => {
  const name = prompt('请输入新的章节名称：', chapter.chapter_name)
  if (name) {
    try {
      const res = await updateChapterAPI(chapter.chapter_id, {
        chapter_name: name
      })
      if (res.data.status === 0) {
        alert('章节更新成功')
        fetchChapters()
      } else {
        alert(res.data.message || '更新失败')
      }
    } catch (error) {
      console.error('更新章节失败:', error)
      alert('更新失败，请稍后重试')
    }
  }
}

// 删除章节
const deleteChapter = async (chapter) => {
  if (confirm(`确定要删除章节"${chapter.chapter_name}"吗？`)) {
    try {
      const res = await deleteChapterAPI(chapter.chapter_id)
      if (res.data.status === 0) {
        alert('章节删除成功')
        fetchChapters()
      } else {
        alert(res.data.message || '删除失败')
      }
    } catch (error) {
      console.error('删除章节失败:', error)
      alert('删除失败，请稍后重试')
    }
  }
}

// 上传视频
const uploadVideo = () => {
  router.push(`/teacher/video-upload?courseId=${course_id.value}`)
}

// 编辑视频
const editVideo = (video) => {
  console.log('编辑视频:', video)
}

// 删除视频
const deleteVideo = async (video) => {
  if (confirm(`确定要删除视频"${video.video_name}"吗？`)) {
    try {
      const res = await deleteVideoAPI(video.video_id)
      if (res.data.status === 0) {
        alert('视频删除成功')
        fetchVideos()
      } else {
        alert(res.data.message || '删除失败')
      }
    } catch (error) {
      console.error('删除视频失败:', error)
      alert('删除失败，请稍后重试')
    }
  }
}

// 预览课程
const previewCourse = () => {
  router.push(`/student/course-study/${course_id.value}`)
}

// 编辑课程信息
const editCourseInfo = () => {
  console.log('编辑课程信息')
}
</script>

<template>
  <!-- 主内容 -->
  <main class="main-container">
    <!-- 课程标题 -->
    <div class="course-header">
      <div class="course-info">
        <h1>{{ course.course_name }}</h1>
        <div class="course-meta">
          <span>👨‍🎓 {{ stats.studentCount }}名学生</span>
          <span>📹 {{ course.hours }}课时</span>
          <span>📅 {{ course.semester }}</span>
          <span class="status-badge">🟢 {{ course.status }}</span>
        </div>
      </div>
      <div class="course-actions">
        <button class="btn-secondary" @click="previewCourse">预览课程</button>
        <button class="btn-primary" @click="editCourseInfo">编辑信息</button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">👨‍🎓</div>
        <div class="stat-info">
          <h3>{{ stats.studentCount }}</h3>
          <p>学生人数</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">📹</div>
        <div class="stat-info">
          <h3>{{ stats.videoCount }}</h3>
          <p>视频数量</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">📄</div>
        <div class="stat-info">
          <h3>{{ stats.materialCount }}</h3>
          <p>资料数量</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)">💬</div>
        <div class="stat-info">
          <h3>{{ stats.discussionCount }}</h3>
          <p>讨论数量</p>
        </div>
      </div>
    </div>

    <!-- 管理区域 -->
    <div class="manage-container">
      <CourseManageNavigator></CourseManageNavigator>
      <!-- 内容区 -->
      <div class="content-area">
        <router-view></router-view>

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
.status-badge {
  color: #43e97b;
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
  transition: transform 0.2s;
}
.btn-primary:hover {
  transform: translateY(-2px);
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
.btn-secondary:hover {
  background: #e0e0e0;
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
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}
.stat-info h3 {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}
.stat-info p {
  font-size: 13px;
  color: #666;
}

/* 管理区域 */
.manage-container {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 24px;
}

/* 内容区 */
.content-area {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* 标签切换 */
.content-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 12px;
}
.content-tabs button {
  padding: 10px 20px;
  background: none;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: all 0.3s;
}
.content-tabs button.active {
  background: #f0f4ff;
  color: #667eea;
  font-weight: 500;
}
.content-tabs button:hover:not(.active) {
  background: #f5f7fa;
}

/* 区块头部 */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.section-header h3 {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}
.btn-add {
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}

/* 章节列表 */
.chapter-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.chapter-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}
.chapter-info {
  display: flex;
  align-items: center;
  gap: 12px;
}
.chapter-number {
  padding: 4px 12px;
  background: #667eea;
  color: white;
  border-radius: 4px;
  font-size: 12px;
}
.chapter-name {
  font-weight: 500;
  color: #333;
}
.chapter-videos {
  color: #999;
  font-size: 13px;
}
.required-tag {
  padding: 2px 8px;
  background: #e6f7e6;
  color: #43e97b;
  border-radius: 4px;
  font-size: 12px;
}
.chapter-actions {
  display: flex;
  gap: 8px;
}
.chapter-actions button {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
}
.btn-edit {
  background: #f0f4ff;
  color: #667eea;
}
.btn-delete {
  background: #ffe6e6;
  color: #f5576c;
}

/* 视频列表 */
.video-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.video-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}
.video-info {
  flex: 1;
}
.video-name {
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}
.video-meta {
  display: flex;
  gap: 16px;
  color: #999;
  font-size: 13px;
}
.video-actions {
  display: flex;
  gap: 8px;
}
.video-actions button {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
}

/* 学生列表 */
.student-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.student-item {
  display: grid;
  grid-template-columns: 100px 120px 1fr 80px;
  align-items: center;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 8px;
  gap: 16px;
}
.student-item.header {
  background: none;
  font-weight: bold;
  color: #666;
}
.progress-bar {
  position: relative;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}
.progress-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
}
.progress-text {
  position: absolute;
  right: 0;
  top: -20px;
  font-size: 12px;
  color: #667eea;
}
.btn-view {
  padding: 6px 12px;
  background: #f0f4ff;
  color: #667eea;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
}

/* 搜索框 */
.search-box {
  display: flex;
  gap: 8px;
}
.search-box input {
  padding: 8px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  min-width: 200px;
}
.search-box button {
  padding: 8px 16px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}
.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}
.btn-add-empty {
  margin-top: 16px;
  padding: 10px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

/* 响应式 */
@media (max-width: 1200px) {
  .manage-container {
    grid-template-columns: 1fr;
  }
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .course-meta {
    flex-wrap: wrap;
    gap: 8px;
  }
  .student-item {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>
