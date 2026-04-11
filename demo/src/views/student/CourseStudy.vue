<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getCourseDetail, getChapters, getVideos, getComments, addComment, likeVideo, getMaterials, updateVideoProgress, getCourseProgress } from '@/api/student'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 课程ID
const courseId = computed(() => route.params.courseId)

// 加载状态
const loading = ref(false)

// 课程信息
const course = ref({
  course_name: '',
  teacher_name: '',
  description: ''
})

// 章节列表
const chapters = ref([])

// 所有视频列表（平铺展示）
const allVideos = ref([])

// 当前播放的视频
const currentVideo = ref({
  video_id: null,
  video_name: '',
  video_url: '',
  description: '',
  duration: 0
})

// 视频播放器引用
const videoPlayer = ref(null)

// 评论列表
const comments = ref([])

// 新评论
const newComment = ref('')

// 学习资料
const materials = ref([])

// 课程学习进度
const courseProgress = ref({
  course_progress: 0,
  total_videos: 0,
  completed_videos: 0,
  in_progress_videos: 0
})

// 获取课程详情
const fetchCourseDetail = async () => {
  try {
    const res = await getCourseDetail(courseId.value)
    if (res.data.status === 0) {
      course.value = res.data.data
    }
  } catch (error) {
    console.error('获取课程详情失败:', error)
  }
}

// 获取章节列表
const fetchChapters = async () => {
  try {
    const res = await getChapters(courseId.value)
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
    const res = await getVideos(courseId.value)
    if (res.data.status === 0) {
      const videos = res.data.data || []
      // 将视频分配到对应章节
      chapters.value.forEach(chapter => {
        chapter.videos = videos.filter(v => v.chapter_id === chapter.chapter_id)
      })
      // 平铺所有视频用于右侧列表展示
      allVideos.value = videos.map((video, index) => ({
        ...video,
        lesson_no: index + 1 // 添加课时序号
      }))
      // 设置第一个视频为当前视频
      if (videos.length > 0 && !currentVideo.value.video_id) {
        currentVideo.value = videos[0]
      }
    }
  } catch (error) {
    console.error('获取视频列表失败:', error)
  }
}

// 获取评论列表
const fetchComments = async () => {
  if (!currentVideo.value.video_id) return
  try {
    const res = await getComments(currentVideo.value.video_id)
    if (res.data.status === 0) {
      comments.value = res.data.data || []
    }
  } catch (error) {
    console.error('获取评论失败:', error)
  }
}

// 获取学习资料
const fetchMaterials = async () => {
  try {
    const res = await getMaterials(courseId.value)
    if (res.data.status === 0) {
      materials.value = res.data.data || []
    }
  } catch (error) {
    console.error('获取学习资料失败:', error)
  }
}

// 获取课程学习进度
const fetchCourseProgress = async () => {
  try {
    const res = await getCourseProgress(courseId.value)
    if (res.data.status === 0) {
      courseProgress.value = res.data.data
    }
  } catch (error) {
    console.error('获取课程进度失败:', error)
  }
}

// 切换视频
const switchVideo = async (video) => {
  // 重置保存时间记录
  lastSavedTime = 0
  currentVideo.value = video
  await fetchComments()
}

// 提交评论
const submitComment = async () => {
  if (!newComment.value.trim()) {
    alert('请输入评论内容')
    return
  }

  try {
    const res = await addComment({
      video_id: currentVideo.value.video_id,
      content: newComment.value
    })
    if (res.data.status === 0) {
      alert('评论发表成功')
      newComment.value = ''
      fetchComments()
    } else {
      alert(res.data.message || '评论失败')
    }
  } catch (error) {
    console.error('评论失败:', error)
    alert('评论失败，请稍后重试')
  }
}

// 点赞评论
const likeComment = (comment) => {
  comment.likes++
}

// 点赞视频
const handleLikeVideo = async () => {
  try {
    const res = await likeVideo({ video_id: currentVideo.value.video_id })
    if (res.data.status === 0) {
      alert('点赞成功')
    }
  } catch (error) {
    console.error('点赞失败:', error)
  }
}

// 下载资料
const downloadMaterial = (material) => {
  alert(`开始下载：${material.file_name}`)
}

// 返回课程列表
const goBack = () => {
  router.push('/student/my-courses')
}

// 视频播放进度更新（定时保存进度）
let lastSavedTime = 0
const handleVideoTimeUpdate = async () => {
  if (!videoPlayer.value) return

  const currentTime = Math.floor(videoPlayer.value.currentTime)
  const duration = Math.floor(videoPlayer.value.duration || currentVideo.value.duration || 0)

  // 短视频（小于10秒）：每秒保存一次
  // 长视频（大于等于10秒）：每10秒保存一次
  const saveInterval = duration < 10 ? 1 : 10

  // 保存进度条件：
  // 1. 到达保存间隔时间点
  // 2. 播放超过90%标记为完成
  // 3. 确保不会重复保存同一时间点
  const shouldSave = (currentTime % saveInterval === 0 && currentTime !== lastSavedTime && currentTime > 0)
  const isCompleted = duration > 0 && (currentTime / duration) >= 0.9

  if (shouldSave || isCompleted) {
    try {
      await updateVideoProgress({
        video_id: currentVideo.value.video_id,
        current_time: currentTime,
        duration: duration,
        is_completed: isCompleted
      })

      // 记录上次保存的时间点
      lastSavedTime = currentTime

      // 如果完成了，更新本地状态
      if (isCompleted) {
        const video = allVideos.value.find(v => v.video_id === currentVideo.value.video_id)
        if (video && !video.is_completed) {
          video.is_completed = true
          // 刷新课程进度
          await fetchCourseProgress()
        }
      }
    } catch (error) {
      console.error('保存进度失败:', error)
    }
  }
}

// 视频播放结束处理
const handleVideoEnded = async () => {
  // 标记当前视频为已完成
  try {
    const duration = Math.floor(videoPlayer.value?.duration || currentVideo.value.duration || 0)
    await updateVideoProgress({
      video_id: currentVideo.value.video_id,
      current_time: duration,
      duration: duration,
      is_completed: true
    })
    // 更新本地状态
    const video = allVideos.value.find(v => v.video_id === currentVideo.value.video_id)
    if (video) {
      video.is_completed = true
    }
    // 刷新课程进度
    await fetchCourseProgress()
    // 自动播放下一个视频
    const currentIndex = allVideos.value.findIndex(v => v.video_id === currentVideo.value.video_id)
    if (currentIndex < allVideos.value.length - 1) {
      const nextVideo = allVideos.value[currentIndex + 1]
      switchVideo(nextVideo)
    }
  } catch (error) {
    console.error('更新进度失败:', error)
  }
}

onMounted(async () => {
  loading.value = true
  await fetchCourseDetail()
  await fetchChapters()
  await fetchVideos()
  await fetchMaterials()
  await fetchComments()
  await fetchCourseProgress()
  loading.value = false
})
</script>

<template>
  <div class="course-study-page">
    <!-- 顶部导航 -->
    <div class="study-header">
      <button class="btn-back" @click="goBack">← 返回</button>
      <h1 class="course-title">{{ course.course_name }}</h1>
      <span class="teacher-info">{{ course.teacher_name }}</span>
    </div>

    <div class="study-container">
      <!-- 左侧视频区 -->
      <div class="video-section">
        <!-- 视频播放器 -->
        <div class="video-player">
          <video
            v-if="currentVideo.video_url"
            ref="videoPlayer"
            :src="currentVideo.video_url"
            controls
            class="video-element"
            @ended="handleVideoEnded"
            @timeupdate="handleVideoTimeUpdate"
          ></video>
          <div v-else class="video-placeholder">
            <div class="play-icon">▶</div>
            <p>{{ currentVideo.video_name }}</p>
          </div>
        </div>

        <!-- 视频信息 -->
        <div class="video-info">
          <h2>{{ currentVideo.video_name }}</h2>
          <p class="video-desc">{{ currentVideo.description }}</p>
          <div class="video-actions">
            <button class="btn-like" @click="handleLikeVideo">👍 点赞</button>
            <button class="btn-collect">⭐ 收藏</button>
            <button class="btn-share">📤 分享</button>
          </div>
        </div>

        <!-- 评论区 -->
        <div class="comments-section">
          <h3>💬 课程讨论 ({{ comments.length }})</h3>

          <!-- 发表评论 -->
          <div class="comment-input">
            <textarea
              v-model="newComment"
              placeholder="发表你的评论..."
              rows="3"
            ></textarea>
            <button class="btn-submit" @click="submitComment">发表评论</button>
          </div>

          <!-- 评论列表 -->
          <div class="comments-list">
            <div v-for="comment in comments" :key="comment.comment_id" class="comment-item">
              <div class="comment-avatar">{{ comment.avatar }}</div>
              <div class="comment-content">
                <div class="comment-header">
                  <span class="comment-author">{{ comment.user_name }}</span>
                  <span class="comment-time">{{ comment.created_at }}</span>
                </div>
                <p class="comment-text">{{ comment.content }}</p>
                <div class="comment-actions">
                  <button class="btn-like-comment" @click="likeComment(comment)">
                    👍 {{ comment.likes }}
                  </button>
                  <button class="btn-reply">回复</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧章节列表 -->
      <div class="sidebar">
        <!-- 学习进度概览 -->
        <div class="progress-overview">
          <h3>📊 学习进度</h3>
          <div class="progress-stats">
            <div class="progress-circle">
              <span class="progress-percent">{{ courseProgress.course_progress }}%</span>
            </div>
            <div class="progress-detail">
              <div class="stat-item">
                <span class="stat-label">总课时</span>
                <span class="stat-value">{{ courseProgress.total_videos }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">已完成</span>
                <span class="stat-value completed">{{ courseProgress.completed_videos }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">学习中</span>
                <span class="stat-value in-progress">{{ courseProgress.in_progress_videos }}</span>
              </div>
            </div>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill" :style="{ width: courseProgress.course_progress + '%' }"></div>
          </div>
        </div>

        <!-- 课时列表 -->
        <div class="chapters-section">
          <h3>📚 课程目录 ({{ allVideos.length }}个课时)</h3>
          <div class="videos-list">
            <div
              v-for="video in allVideos"
              :key="video.video_id"
              class="video-item"
              :class="{
                active: currentVideo.video_id === video.video_id,
                completed: video.is_completed
              }"
              @click="switchVideo(video)"
            >
              <span class="video-status">
                {{ video.is_completed ? '✓' : (currentVideo.video_id === video.video_id ? '▶' : '○') }}
              </span>
              <span class="lesson-no">第{{ video.lesson_no }}讲</span>
              <span class="video-name">{{ video.video_name }}</span>
              <span class="video-duration">{{ video.duration }}</span>
            </div>
          </div>
        </div>

        <!-- 学习资料 -->
        <div class="materials-section">
          <h3>📎 学习资料</h3>
          <div class="materials-list">
            <div
              v-for="material in materials"
              :key="material.material_id"
              class="material-item"
              @click="downloadMaterial(material)"
            >
              <span class="material-icon">📄</span>
              <div class="material-info">
                <span class="material-name">{{ material.file_name }}</span>
                <span class="material-size">{{ material.file_size }}</span>
              </div>
              <span class="download-icon">⬇</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.course-study-page {
  min-height: 100vh;
  background: #f5f7fa;
}

/* 顶部导航 */
.study-header {
  background: white;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 100;
}
.btn-back {
  padding: 8px 16px;
  background: #f5f7fa;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
}
.btn-back:hover {
  background: #e0e0e0;
}
.course-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  flex: 1;
}
.teacher-info {
  color: #666;
  font-size: 14px;
}

/* 主容器 */
.study-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 24px;
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 24px;
}

/* 视频区 */
.video-section {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}
.video-player {
  aspect-ratio: 16 / 9;
  background: #1a1a1a;
  display: flex;
  align-items: center;
  justify-content: center;
}
.video-element {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.video-placeholder {
  text-align: center;
  color: white;
}
.play-icon {
  font-size: 64px;
  margin-bottom: 16px;
  cursor: pointer;
  opacity: 0.8;
  transition: opacity 0.3s;
}
.play-icon:hover {
  opacity: 1;
}
.video-info {
  padding: 24px;
  border-bottom: 1px solid #e0e0e0;
}
.video-info h2 {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 12px;
}
.video-desc {
  color: #666;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 16px;
}
.video-actions {
  display: flex;
  gap: 12px;
}
.video-actions button {
  padding: 8px 16px;
  border: 1px solid #e0e0e0;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}
.video-actions button:hover {
  background: #f5f7fa;
  border-color: #667eea;
  color: #667eea;
}

/* 评论区 */
.comments-section {
  padding: 24px;
}
.comments-section h3 {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 20px;
}
.comment-input {
  margin-bottom: 24px;
}
.comment-input textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  margin-bottom: 12px;
}
.comment-input textarea:focus {
  outline: none;
  border-color: #667eea;
}
.btn-submit {
  padding: 10px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}
.comments-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.comment-item {
  display: flex;
  gap: 12px;
}
.comment-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f0f4ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}
.comment-content {
  flex: 1;
}
.comment-header {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}
.comment-author {
  font-weight: bold;
  color: #333;
}
.comment-time {
  color: #999;
  font-size: 12px;
}
.comment-text {
  color: #666;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 8px;
}
.comment-actions {
  display: flex;
  gap: 16px;
}
.comment-actions button {
  background: none;
  border: none;
  color: #999;
  font-size: 13px;
  cursor: pointer;
}
.comment-actions button:hover {
  color: #667eea;
}

/* 侧边栏 */
.sidebar {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 学习进度概览 */
.progress-overview {
  background: white;
  border-radius: 12px;
  padding: 20px;
}
.progress-overview h3 {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 16px;
}
.progress-stats {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 16px;
}
.progress-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}
.progress-percent {
  color: white;
  font-size: 20px;
  font-weight: bold;
}
.progress-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.stat-item {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}
.stat-label {
  color: #666;
}
.stat-value {
  font-weight: bold;
  color: #333;
}
.stat-value.completed {
  color: #43e97b;
}
.stat-value.in-progress {
  color: #667eea;
}
.progress-bar-container {
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}
.progress-bar-fill {
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
  transition: width 0.3s;
}

.chapters-section,
.materials-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
}
.chapters-section h3,
.materials-section h3 {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 16px;
}
.chapters-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.chapter-item {
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 16px;
}
.chapter-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}
.chapter-title {
  font-weight: bold;
  color: #333;
  font-size: 14px;
  margin-bottom: 12px;
}
.videos-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.video-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}
.video-item:hover {
  background: #f5f7fa;
}
.video-item.active {
  background: #f0f4ff;
}
.video-item.completed {
  color: #999;
}
.video-status {
  width: 20px;
  text-align: center;
  font-size: 12px;
}
.video-item.completed .video-status {
  color: #43e97b;
}
.video-item.active .video-status {
  color: #667eea;
}
.video-name {
  flex: 1;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.lesson-no {
  font-size: 12px;
  color: #999;
  margin-right: 4px;
  min-width: 45px;
}
.video-item.active .lesson-no {
  color: #667eea;
}
.video-duration {
  font-size: 12px;
  color: #999;
}

/* 学习资料 */
.materials-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.material-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}
.material-item:hover {
  background: #f5f7fa;
  border-color: #667eea;
}
.material-icon {
  font-size: 24px;
}
.material-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.material-name {
  font-size: 14px;
  color: #333;
}
.material-size {
  font-size: 12px;
  color: #999;
}
.download-icon {
  color: #667eea;
  font-size: 18px;
}

/* 响应式 */
@media (max-width: 1200px) {
  .study-container {
    grid-template-columns: 1fr;
  }
  .sidebar {
    flex-direction: row;
  }
  .chapters-section,
  .materials-section {
    flex: 1;
  }
}

@media (max-width: 768px) {
  .sidebar {
    flex-direction: column;
  }
}
</style>
