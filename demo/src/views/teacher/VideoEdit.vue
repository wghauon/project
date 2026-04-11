<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getVideoDetail, updateVideo, deleteVideo } from '@/api/teacher'
import { getChapters } from '@/api/teacher'

const route = useRoute()
const router = useRouter()
const videoId = route.params.videoId || route.query.videoId

// 视频信息
const video = ref({
  video_name: '',
  description: '',
  chapter_id: '',
  video_no: 1,
  course_id: '',
  duration: 0,
  file_size: 0,
  status: 1,
  allow_comment: true,
  allow_download: false,
  permission: 'public'
})

// 章节列表
const chapters = ref([])

// 标签
const tags = ref([])
const newTag = ref('')

// 加载状态
const loading = ref(false)
const saving = ref(false)

// 获取视频详情
const fetchVideoDetail = async () => {
  if (!videoId) {
    alert('缺少视频ID')
    router.back()
    return
  }

  loading.value = true
  try {
    const res = await getVideoDetail(videoId)
    if (res.data.status === 0) {
      const data = res.data.data
      video.value = { ...video.value, ...data }
      // 获取章节列表
      if (video.value.course_id) {
        fetchChapters()
      }
    } else {
      alert(res.data.message || '获取视频详情失败')
    }
  } catch (error) {
    console.error('获取视频详情失败:', error)
    alert('获取视频详情失败')
  } finally {
    loading.value = false
  }
}

// 获取章节列表
const fetchChapters = async () => {
  try {
    const res = await getChapters(video.value.course_id)
    if (res.data.status === 0) {
      chapters.value = res.data.data || []
    }
  } catch (error) {
    console.error('获取章节列表失败:', error)
  }
}

// 添加标签
const addTag = () => {
  const tag = newTag.value.trim()
  if (tag && !tags.value.includes(tag)) {
    tags.value.push(tag)
    newTag.value = ''
  }
}

// 移除标签
const removeTag = (index) => {
  tags.value.splice(index, 1)
}

// 保存修改
const saveChanges = async () => {
  if (!video.value.video_name) {
    alert('请输入视频标题')
    return
  }
  if (!video.value.chapter_id) {
    alert('请选择所属章节')
    return
  }

  saving.value = true
  try {
    const res = await updateVideo(videoId, {
      video_name: video.value.video_name,
      description: video.value.description,
      chapter_id: video.value.chapter_id,
      video_no: video.value.video_no,
      status: video.value.status,
      allow_comment: video.value.allow_comment,
      allow_download: video.value.allow_download,
      permission: video.value.permission,
      tags: tags.value
    })

    if (res.data.status === 0) {
      alert('保存成功')
      router.back()
    } else {
      alert(res.data.message || '保存失败')
    }
  } catch (error) {
    console.error('保存失败:', error)
    alert('保存失败，请稍后重试')
  } finally {
    saving.value = false
  }
}

// 删除视频
const handleDelete = async () => {
  if (!confirm('确定要删除这个视频吗？此操作不可恢复。')) {
    return
  }

  try {
    const res = await deleteVideo(videoId)
    if (res.data.status === 0) {
      alert('删除成功')
      router.back()
    } else {
      alert(res.data.message || '删除失败')
    }
  } catch (error) {
    console.error('删除失败:', error)
    alert('删除失败，请稍后重试')
  }
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 格式化时长
const formatDuration = (seconds) => {
  if (!seconds) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

onMounted(() => {
  fetchVideoDetail()
})
</script>

<template>
  <!-- 主内容 -->
  <main class="main-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">✏️ 编辑视频</h1>
        <p class="page-subtitle">修改视频信息、更换封面、调整发布设置</p>
      </div>
      <div class="header-actions">
        <button class="btn-secondary" @click="router.back()">← 返回视频管理</button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <div v-else class="edit-container">
      <!-- 左侧表单 -->
      <div class="form-card">
        <!-- 视频预览 -->
        <div class="form-section">
          <h2 class="section-title">🎬 视频文件</h2>
          <div class="video-preview">
            <div class="preview-player">🎬</div>
            <div class="preview-info">
              <span class="preview-filename">{{ video.video_name || '未命名视频' }}</span>
              <span class="preview-filesize">{{ formatFileSize(video.file_size) }} · {{ formatDuration(video.duration) }}</span>
            </div>
          </div>
          <button class="btn-secondary" style="width: 100%" @click="alert('重新上传功能开发中')">🔄 重新上传视频</button>
        </div>

        <!-- 基本信息 -->
        <div class="form-section">
          <h2 class="section-title">📋 基本信息</h2>

          <div class="form-group">
            <label class="form-label">视频标题 <span class="required">*</span></label>
            <input type="text" class="form-input" v-model="video.video_name" placeholder="请输入视频标题" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">所属章节 <span class="required">*</span></label>
              <select class="form-select" v-model="video.chapter_id">
                <option value="">请选择章节</option>
                <option v-for="chapter in chapters" :key="chapter.chapter_id" :value="chapter.chapter_id">
                  {{ chapter.chapter_name }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">课时序号 <span class="required">*</span></label>
              <select class="form-select" v-model="video.video_no">
                <option v-for="n in 10" :key="n" :value="n">第{{ n }}课时</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">视频简介</label>
            <textarea class="form-textarea" v-model="video.description" placeholder="请输入视频简介..."></textarea>
          </div>
        </div>

        <!-- 视频封面 -->
        <div class="form-section">
          <h2 class="section-title">🖼️ 视频封面</h2>
          <div class="cover-upload">
            <div class="cover-preview">🎬</div>
            <div class="cover-options">
              <button class="cover-btn" @click="alert('上传封面功能开发中')">📤 上传自定义封面</button>
              <p class="form-hint" style="margin-bottom: 12px">或使用系统推荐封面</p>
              <div class="cover-templates">
                <div
                  class="cover-template selected"
                  style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                ></div>
                <div
                  class="cover-template"
                  style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
                ></div>
                <div
                  class="cover-template"
                  style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
                ></div>
                <div
                  class="cover-template"
                  style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
                ></div>
                <div
                  class="cover-template"
                  style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 标签 -->
        <div class="form-section">
          <h2 class="section-title">🏷️ 标签</h2>
          <div class="tag-input-container">
            <span v-for="(tag, index) in tags" :key="index" class="tag-item">
              {{ tag }}<span class="tag-remove" @click="removeTag(index)">✕</span>
            </span>
            <input
              type="text"
              class="tag-input"
              v-model="newTag"
              placeholder="输入标签按回车添加"
              @keyup.enter="addTag"
            />
          </div>
          <p class="form-hint">添加标签有助于学生更容易找到该视频</p>
        </div>

        <!-- 发布设置 -->
        <div class="form-section">
          <h2 class="section-title">⚙️ 发布设置</h2>

          <div class="switch-group">
            <div class="switch-label">
              允许评论
              <span class="sub">学生可以在视频下方发表评论</span>
            </div>
            <label class="switch">
              <input type="checkbox" v-model="video.allow_comment" />
              <span class="slider"></span>
            </label>
          </div>

          <div class="switch-group">
            <div class="switch-label">
              允许下载
              <span class="sub">允许学生下载该视频</span>
            </div>
            <label class="switch">
              <input type="checkbox" v-model="video.allow_download" />
              <span class="slider"></span>
            </label>
          </div>

          <div class="form-group" style="margin-top: 20px">
            <label class="form-label">学习权限</label>
            <select class="form-select" v-model="video.permission">
              <option value="public">公开 - 所有学生可见</option>
              <option value="enrolled">选课学生 - 仅选课学生可见</option>
              <option value="vip">VIP专享 - 付费学生可见</option>
            </select>
          </div>
        </div>

        <!-- 按钮组 -->
        <div class="form-actions">
          <button class="btn-danger" @click="handleDelete">🗑️ 删除视频</button>
          <button class="btn-secondary" @click="router.back()">取消</button>
          <button class="btn-primary" @click="saveChanges" :disabled="saving">
            {{ saving ? '保存中...' : '💾 保存修改' }}
          </button>
        </div>
      </div>

      <!-- 右侧信息栏 -->
      <div class="info-sidebar">
        <div class="info-card">
          <h3 class="info-card-title">📊 视频统计</h3>
          <div class="info-item">
            <span class="info-label">播放次数</span>
            <span class="info-value">{{ video.view_count || 0 }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">完播率</span>
            <span class="info-value">89%</span>
          </div>
          <div class="info-item">
            <span class="info-label">平均观看时长</span>
            <span class="info-value">12:45</span>
          </div>
          <div class="info-item">
            <span class="info-label">评论数</span>
            <span class="info-value">45</span>
          </div>
          <div class="info-item">
            <span class="info-label">点赞数</span>
            <span class="info-value">156</span>
          </div>
        </div>

        <div class="info-card">
          <h3 class="info-card-title">📅 时间信息</h3>
          <div class="info-item">
            <span class="info-label">上传时间</span>
            <span class="info-value">{{ video.created_at?.split(' ')[0] || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">发布时间</span>
            <span class="info-value">{{ video.published_at?.split(' ')[0] || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">最后修改</span>
            <span class="info-value">{{ video.updated_at?.split(' ')[0] || '-' }}</span>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 20px;
  color: #666;
}
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 主内容 */
.main-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px;
}
/* 页面标题 */
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
.page-subtitle {
  font-size: 14px;
  color: #666;
  margin-top: 8px;
}
.header-actions {
  display: flex;
  gap: 12px;
}
/* 编辑区域 */
.edit-container {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
}
/* 左侧表单 */
.form-card {
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.form-section {
  margin-bottom: 28px;
}
.form-section:last-child {
  margin-bottom: 0;
}
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f0f0;
}
.form-group {
  margin-bottom: 20px;
}
.form-group:last-child {
  margin-bottom: 0;
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}
.form-label .required {
  color: #f44336;
  margin-left: 4px;
}
.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s;
}
.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #667eea;
}
.form-textarea {
  min-height: 120px;
  resize: vertical;
}
.form-hint {
  font-size: 12px;
  color: #999;
  margin-top: 6px;
}
/* 视频预览区 */
.video-preview {
  background: #1a1a1a;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
}
.preview-player {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 48px;
}
.preview-info {
  padding: 12px 16px;
  background: #2d2d2d;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.preview-filename {
  color: white;
  font-size: 13px;
}
.preview-filesize {
  color: #999;
  font-size: 12px;
}
/* 封面上传 */
.cover-upload {
  display: flex;
  gap: 16px;
}
.cover-preview {
  width: 160px;
  height: 100px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 36px;
  flex-shrink: 0;
}
.cover-options {
  flex: 1;
}
.cover-btn {
  width: 100%;
  padding: 10px;
  background: #f5f7fa;
  border: 2px dashed #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #666;
  margin-bottom: 12px;
}
.cover-templates {
  display: flex;
  gap: 8px;
}
.cover-template {
  width: 48px;
  height: 30px;
  border-radius: 4px;
  cursor: pointer;
  border: 2px solid transparent;
}
.cover-template.selected {
  border-color: #667eea;
}
/* 标签输入 */
.tag-input-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  min-height: 48px;
}
.tag-input-container:focus-within {
  border-color: #667eea;
}
.tag-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: #f0f4ff;
  color: #667eea;
  border-radius: 4px;
  font-size: 13px;
}
.tag-remove {
  cursor: pointer;
  font-size: 12px;
}
.tag-input {
  border: none;
  outline: none;
  flex: 1;
  min-width: 80px;
  font-size: 14px;
}
/* 开关 */
.switch-group {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 12px;
}
.switch-label {
  font-size: 14px;
  color: #333;
}
.switch-label .sub {
  font-size: 12px;
  color: #999;
  display: block;
  margin-top: 4px;
}
.switch {
  position: relative;
  width: 50px;
  height: 26px;
}
.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.4s;
  border-radius: 26px;
}
.slider:before {
  position: absolute;
  content: '';
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
}
input:checked + .slider {
  background-color: #667eea;
}
input:checked + .slider:before {
  transform: translateX(24px);
}
/* 右侧信息栏 */
.info-sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.info-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.info-card-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}
.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 13px;
}
.info-item:last-child {
  margin-bottom: 0;
}
.info-label {
  color: #999;
}
.info-value {
  color: #333;
  font-weight: 500;
}
/* 按钮组 */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 2px solid #f0f0f0;
}
.btn-secondary {
  padding: 12px 24px;
  background: #f5f7fa;
  color: #666;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}
.btn-danger {
  padding: 12px 24px;
  background: #ffebee;
  color: #f44336;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  margin-right: auto;
}
.btn-primary {
  padding: 12px 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 响应式 */
@media (max-width: 768px) {
  .edit-container {
    grid-template-columns: 1fr;
  }
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
