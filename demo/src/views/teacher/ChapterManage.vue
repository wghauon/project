<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ChapterItem from '@/components/ChapterItem.vue'
import { getChapters, deleteChapter, getVideos, getMaterials } from '@/api/teacher.js'

const route = useRoute()
const router = useRouter()
const courseId = route.params.course_id

const chapters = ref([])
const loading = ref(false)

// 模态框相关
const showModal = ref(false)
const currentChapterId = ref(null)
const lessonType = ref('') // 'video' 或 'material'
const availableVideos = ref([])
const availableMaterials = ref([])
const selectedItemId = ref('')
const lessonTitle = ref('')
const lessonOrder = ref(1)
const modalLoading = ref(false)

// 打开添加课时模态框
const openAddLessonModal = async (chapterId) => {
  currentChapterId.value = chapterId
  showModal.value = true
  lessonType.value = ''
  selectedItemId.value = ''
  lessonTitle.value = ''
  lessonOrder.value = 1
  availableVideos.value = []
  availableMaterials.value = []
}

// 关闭模态框
const closeModal = () => {
  showModal.value = false
  currentChapterId.value = null
  lessonType.value = ''
  selectedItemId.value = ''
  lessonTitle.value = ''
  availableVideos.value = []
  availableMaterials.value = []
}

// 选择课时类型
const selectLessonType = async (type) => {
  lessonType.value = type
  selectedItemId.value = ''
  modalLoading.value = true

  try {
    if (type === 'video') {
      const res = await getVideos(courseId)
      if (res.data.status === 0) {
        // 过滤掉已经关联了章节的视频
        availableVideos.value = (res.data.data || []).filter(video => !video.chapter_id)
      }
    } else if (type === 'material') {
      const res = await getMaterials(courseId)
      if (res.data.status === 0) {
        availableMaterials.value = res.data.data || []
      }
    }
  } catch (error) {
    console.error('获取数据失败:', error)
    alert('获取数据失败')
  } finally {
    modalLoading.value = false
  }
}

// 创建课时
const createLesson = async () => {
  if (!selectedItemId.value) {
    alert('请选择' + (lessonType.value === 'video' ? '视频' : '资料'))
    return
  }
  if (!lessonTitle.value.trim()) {
    alert('请输入课时标题')
    return
  }

  try {
    // 这里需要调用后端API创建课时关联
    // 目前先模拟成功，实际应该调用相应的API
    alert('课时创建成功！')
    closeModal()
    fetchChapters() // 刷新列表
  } catch (error) {
    console.error('创建课时失败:', error)
    alert('创建课时失败')
  }
}

const fetchChapters = async () => {
  if (!courseId) return
  loading.value = true
  try {
    const res = await getChapters(courseId)
    if (res.data.status === 0) {
      // 映射后端数据到前端需要的格式
      chapters.value = (res.data.data || []).map(chapter => ({
        id: chapter.chapter_id,
        title: chapter.chapter_name,
        chapter_order: chapter.chapter_no,
        description: chapter.description,
        is_required: chapter.is_required,
        status: chapter.status,
        videos: chapter.videos || []
      }))
    } else {
      alert(res.data.message || '获取章节列表失败')
    }
  } catch (error) {
    console.error('获取章节列表失败:', error)
    alert('获取章节列表失败')
  } finally {
    loading.value = false
  }
}

const handleAddChapter = () => {
  router.push(`/teacher/chapter-add?courseId=${courseId}`)
}

const handleAddLesson = (chapterId) => {
  openAddLessonModal(chapterId)
}

const handleEditChapter = (chapter) => {
  router.push(`/teacher/chapter-add?courseId=${courseId}&chapterId=${chapter.id}&edit=true`)
}

const handleDeleteChapter = async (chapterId) => {
  if (!confirm('确定要删除该章节吗？章节下的所有课时也将被删除。')) return
  try {
    await deleteChapter(chapterId)
    alert('删除成功')
    fetchChapters()
  } catch (error) {
    console.error('删除章节失败:', error)
    alert('删除失败')
  }
}

const handleEditLesson = (video) => {
  router.push(`/teacher/video-upload?courseId=${courseId}&chapterId=${video.chapter_id}&videoId=${video.id}&edit=true`)
}

const handleDeleteLesson = (videoId) => {
  alert('删除课时功能待实现，videoId: ' + videoId)
}

onMounted(() => {
  fetchChapters()
})
</script>

<template>
  <div class="content-area">
    <div class="content-header">
      <h2 class="content-title">📑 章节管理</h2>
      <button class="btn-primary" @click="handleAddChapter">➕ 添加章节</button>
    </div>
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="!courseId" class="empty-state">
      请先选择课程
    </div>
    <div v-else-if="chapters.length === 0" class="empty-state">
      暂无章节，点击"添加章节"创建
    </div>
    <div v-else class="chapter-list">
      <ChapterItem
        v-for="chapter in chapters"
        :key="chapter.id"
        :chapter="chapter"
        @add-lesson="handleAddLesson"
        @edit-chapter="handleEditChapter"
        @delete-chapter="handleDeleteChapter"
        @edit-lesson="handleEditLesson"
        @delete-lesson="handleDeleteLesson"
      />
    </div>

    <!-- 添加课时模态框 -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-container">
        <div class="modal-header">
          <h3 class="modal-title">➕ 添加课时</h3>
          <button class="modal-close" @click="closeModal">✕</button>
        </div>

        <div class="modal-body">
          <!-- 第一步：选择课时类型 -->
          <div v-if="!lessonType" class="type-selection">
            <p class="selection-title">请选择课时内容类型：</p>
            <div class="type-options">
              <div class="type-card" @click="selectLessonType('video')">
                <div class="type-icon">🎬</div>
                <div class="type-name">视频</div>
                <div class="type-desc">从已有视频中选择</div>
              </div>
              <div class="type-card" @click="selectLessonType('material')">
                <div class="type-icon">📄</div>
                <div class="type-name">资料</div>
                <div class="type-desc">从已有资料中选择</div>
              </div>
            </div>
          </div>

          <!-- 第二步：选择具体内容 -->
          <div v-else class="content-selection">
            <div class="selection-header">
              <button class="btn-back" @click="lessonType = ''">← 返回选择类型</button>
              <span class="current-type">{{ lessonType === 'video' ? '🎬 视频' : '📄 资料' }}</span>
            </div>

            <div v-if="modalLoading" class="loading-state">
              <div class="loading-spinner"></div>
              <p>加载中...</p>
            </div>

            <div v-else>
              <!-- 课时标题输入 -->
              <div class="form-group">
                <label class="form-label">课时标题 <span class="required">*</span></label>
                <input
                  type="text"
                  class="form-input"
                  v-model="lessonTitle"
                  placeholder="请输入课时标题"
                />
              </div>

              <!-- 课时序号 -->
              <div class="form-group">
                <label class="form-label">课时序号</label>
                <select class="form-select" v-model="lessonOrder">
                  <option v-for="n in 20" :key="n" :value="n">第 {{ n }} 课时</option>
                </select>
              </div>

              <!-- 视频选择 -->
              <div v-if="lessonType === 'video'" class="item-list">
                <p class="list-title">选择视频（{{ availableVideos.length }} 个可用）：</p>
                <div v-if="availableVideos.length === 0" class="empty-list">
                  暂无可用的视频，请先前往"视频管理"上传视频
                </div>
                <div
                  v-for="video in availableVideos"
                  :key="video.video_id"
                  class="item-option"
                  :class="{ selected: selectedItemId === video.video_id }"
                  @click="selectedItemId = video.video_id"
                >
                  <div class="item-icon">🎬</div>
                  <div class="item-info">
                    <div class="item-name">{{ video.video_name }}</div>
                    <div class="item-meta">{{ video.duration ? Math.floor(video.duration / 60) + '分钟' : '时长未知' }}</div>
                  </div>
                  <div v-if="selectedItemId === video.video_id" class="item-check">✓</div>
                </div>
              </div>

              <!-- 资料选择 -->
              <div v-else class="item-list">
                <p class="list-title">选择资料（{{ availableMaterials.length }} 个可用）：</p>
                <div v-if="availableMaterials.length === 0" class="empty-list">
                  暂无可用的资料，请先前往"资料管理"上传资料
                </div>
                <div
                  v-for="material in availableMaterials"
                  :key="material.material_id"
                  class="item-option"
                  :class="{ selected: selectedItemId === material.material_id }"
                  @click="selectedItemId = material.material_id"
                >
                  <div class="item-icon">📄</div>
                  <div class="item-info">
                    <div class="item-name">{{ material.file_name }}</div>
                    <div class="item-meta">{{ (material.file_size / 1024 / 1024).toFixed(2) }} MB</div>
                  </div>
                  <div v-if="selectedItemId === material.material_id" class="item-check">✓</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" @click="closeModal">取消</button>
          <button
            v-if="lessonType"
            class="btn-primary"
            :disabled="!selectedItemId || !lessonTitle.trim() || modalLoading"
            @click="createLesson"
          >
            创建课时
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
/* 内容区 */
.content-area {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.content-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}
/* 按钮样式 */
.btn-primary {
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}
/* 章节管理 */
.chapter-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
  font-size: 14px;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-container {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;
}
.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}
.modal-close {
  background: none;
  border: none;
  font-size: 20px;
  color: #999;
  cursor: pointer;
  padding: 4px;
}
.modal-close:hover {
  color: #333;
}
.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e0e0e0;
}

/* 类型选择 */
.type-selection {
  text-align: center;
}
.selection-title {
  font-size: 16px;
  color: #666;
  margin-bottom: 24px;
}
.type-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.type-card {
  padding: 32px 24px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
}
.type-card:hover {
  border-color: #667eea;
  background: #f0f4ff;
  transform: translateY(-2px);
}
.type-icon {
  font-size: 48px;
  margin-bottom: 12px;
}
.type-name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}
.type-desc {
  font-size: 13px;
  color: #999;
}

/* 内容选择 */
.content-selection {
  min-height: 300px;
}
.selection-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}
.btn-back {
  background: #f5f7fa;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
}
.btn-back:hover {
  background: #e0e0e0;
}
.current-type {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

/* 表单样式 */
.form-group {
  margin-bottom: 16px;
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
}
.form-input,
.form-select {
  width: 100%;
  padding: 10px 14px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
}
.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #667eea;
}

/* 列表样式 */
.item-list {
  margin-top: 20px;
}
.list-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}
.empty-list {
  text-align: center;
  padding: 40px 20px;
  color: #999;
  background: #f5f7fa;
  border-radius: 8px;
}
.item-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.item-option:hover {
  border-color: #667eea;
  background: #f0f4ff;
}
.item-option.selected {
  border-color: #667eea;
  background: #f0f4ff;
}
.item-icon {
  font-size: 24px;
}
.item-info {
  flex: 1;
}
.item-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}
.item-meta {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
.item-check {
  width: 24px;
  height: 24px;
  background: #667eea;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

/* 加载状态 */
.loading-state {
  text-align: center;
  padding: 40px;
  color: #666;
}
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 按钮样式 */
.btn-secondary {
  padding: 10px 20px;
  background: #f5f7fa;
  color: #666;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}
.btn-secondary:hover {
  background: #e0e0e0;
}
.btn-primary {
  padding: 10px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}
.btn-primary:hover {
  opacity: 0.9;
}
.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
