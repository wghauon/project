<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTeacherStore } from '@/stores/teacher'
import { addChapter, getChapters, getChapterDetail, updateChapter } from '@/api/teacher'

const route = useRoute()
const router = useRouter()
const teacherStore = useTeacherStore()

// 课程ID - 支持 courseId 和 course_id 两种参数名
const courseId = ref(route.query.courseId || route.query.course_id || teacherStore.course_id)

// 编辑模式
const isEditMode = ref(route.query.edit === 'true')
const chapterId = ref(route.query.chapterId || route.query.chapter_id)

// 表单数据
const chapter_no = ref(null)
const chapter_name = ref('')
const description = ref('')
const is_required = ref(true)
const status = ref(1)

// 加载状态
const loading = ref(false)
const error = ref('')
const pageLoading = ref(false)

// 获取当前课程已有的章节数量
const existingChapters = ref([])
onMounted(async () => {
  if (!courseId.value) {
    error.value = '请先选择课程'
    return
  }

  pageLoading.value = true
  try {
    // 获取章节列表（用于显示已有章节）
    const res = await getChapters(courseId.value)
    if (res.data.status === 0) {
      existingChapters.value = res.data.data || []
    }

    // 如果是编辑模式，获取章节详情
    if (isEditMode.value && chapterId.value) {
      const detailRes = await getChapterDetail(chapterId.value)
      if (detailRes.data.status === 0) {
        const chapter = detailRes.data.data
        chapter_no.value = chapter.chapter_no
        chapter_name.value = chapter.chapter_name
        description.value = chapter.description || ''
        is_required.value = chapter.is_required === 1
        status.value = chapter.status
      } else {
        error.value = '获取章节信息失败'
      }
    } else {
      // 新增模式，默认选择下一个章节序号
      chapter_no.value = existingChapters.value.length + 1
    }
  } catch (err) {
    console.error('加载数据失败:', err)
    error.value = '加载数据失败'
  } finally {
    pageLoading.value = false
  }
})

// 选择章节序号
function selectChapterNo(no) {
  chapter_no.value = no
}

// 提交表单
async function submitForm() {
  // 表单验证
  if (!chapter_no.value) {
    alert('请选择章节序号')
    return
  }
  if (!chapter_name.value.trim()) {
    alert('请输入章节标题')
    return
  }

  loading.value = true
  try {
    const data = {
      course_id: courseId.value,
      chapter_name: chapter_name.value,
      chapter_no: chapter_no.value,
      description: description.value,
      is_required: is_required.value ? 1 : 0,
      status: status.value
    }

    let res
    if (isEditMode.value && chapterId.value) {
      // 编辑模式
      res = await updateChapter(chapterId.value, data)
      if (res.data.status === 0) {
        alert('章节更新成功！')
        router.push(`/teacher/course-manage/${courseId.value}/chapter-manage`)
      } else {
        alert(res.data.message || '更新失败')
      }
    } else {
      // 新增模式
      res = await addChapter(data)
      if (res.data.status === 0) {
        alert('章节添加成功！')
        router.push(`/teacher/course-manage/${courseId.value}/chapter-manage`)
      } else {
        alert(res.data.message || '添加失败')
      }
    }
  } catch (err) {
    console.error(isEditMode.value ? '更新章节失败:' : '添加章节失败:', err)
    alert((isEditMode.value ? '更新' : '添加') + '章节失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 取消
function cancel() {
  router.back()
}
</script>
<template>
  <!-- 主内容 -->
  <main class="main-container">
    <div class="page-header">
      <h1 class="page-title">{{ isEditMode ? '✏️ 编辑章节' : '➕ 添加章节' }}</h1>
      <p class="page-subtitle">{{ isEditMode ? '修改章节信息' : '为课程添加新章节和课时内容' }}</p>
    </div>

    <!-- 加载状态 -->
    <div v-if="pageLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 错误提示 -->
    <div v-else-if="error" class="error-message">
      <p>{{ error }}</p>
    </div>

    <div v-else class="form-card">
      <!-- 基本信息 -->
      <div class="form-section">
        <h2 class="section-title">📋 章节基本信息</h2>

        <div class="form-group">
          <label class="form-label">章节序号 <span class="required">*</span></label>
          <div class="chapter-number-options">
            <div
              v-for="n in 10"
              :key="n"
              class="chapter-number-option"
              :class="{ selected: chapter_no === n, disabled: existingChapters.some(c => c.chapter_no === n) }"
              @click="!existingChapters.some(c => c.chapter_no === n) && selectChapterNo(n)"
            >
              第{{ n }}章
              <span v-if="existingChapters.some(c => c.chapter_no === n)" class="exists-badge">已存在</span>
            </div>
          </div>
          <p v-if="chapter_no" class="form-hint">已选择：第{{ chapter_no }}章</p>
        </div>

        <div class="form-group">
          <label class="form-label">章节标题 <span class="required">*</span></label>
          <input
            type="text"
            class="form-input"
            placeholder="请输入章节标题，如：面向对象编程"
            v-model="chapter_name"
          />
          <p class="form-hint">建议标题简洁明了，不超过30个字符</p>
        </div>

        <div class="form-group">
          <label class="form-label">章节简介</label>
          <textarea
            class="form-textarea"
            placeholder="请输入章节内容简介，帮助学生了解本章学习目标..."
            v-model="description"
          ></textarea>
          <p class="form-hint">简要描述本章的主要内容和知识点</p>
        </div>
      </div>

      <!-- 发布设置 -->
      <div class="form-section">
        <h2 class="section-title">⚙️ 发布设置</h2>

        <div class="form-group">
          <label class="form-label">学习要求</label>
          <select class="form-select" v-model="is_required">
            <option :value="true">必修 - 必须完成本章学习</option>
            <option :value="false">选修 - 学生可自由学习</option>
          </select>
        </div>
      </div>

      <!-- 按钮组 -->
      <div class="form-actions">
        <button class="btn-secondary" @click="cancel" :disabled="loading">取消</button>
        <button class="btn-primary" @click="submitForm" :disabled="loading">
          {{ loading ? '保存中...' : (isEditMode ? '✓ 保存修改' : '✓ 确认添加') }}
        </button>
      </div>
    </div>
  </main>
</template>
<style scoped>
/* 主内容 */
.main-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px 20px;
}
/* 页面标题 */
.page-header {
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
/* 错误提示 */
.error-message {
  background: #ffebee;
  color: #f44336;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  text-align: center;
}
/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
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
/* 表单卡片 */
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
/* 章节序号选择 */
.chapter-number-options {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.chapter-number-option {
  padding: 12px 24px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
  position: relative;
}
.chapter-number-option:hover:not(.disabled) {
  border-color: #667eea;
}
.chapter-number-option.selected {
  background: #667eea;
  color: white;
  border-color: #667eea;
}
.chapter-number-option.disabled {
  background: #f5f5f5;
  color: #999;
  cursor: not-allowed;
  border-color: #e0e0e0;
}
.exists-badge {
  font-size: 10px;
  background: #ff9800;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 4px;
}
/* 开关 */
.switch-group {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
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
  transition: all 0.3s;
}
.btn-secondary:hover:not(:disabled) {
  background: #e0e0e0;
}
.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-primary {
  padding: 12px 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}
.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
