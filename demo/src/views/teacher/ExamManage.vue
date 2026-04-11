<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getExamList, createExam as createExamAPI, updateExam as updateExamAPI, deleteExam as deleteExamAPI, publishExam as publishExamAPI, getExamQuestions, addQuestion as addQuestionAPI, deleteQuestion as deleteQuestionAPI, getTeacherCourses } from '@/api/teacher'

const router = useRouter()

// 当前标签
const activeTab = ref('all')

// 考试列表
const exams = ref([])
const loading = ref(false)

// 课程列表
const courses = ref([])

// 创建考试弹窗
const showCreateModal = ref(false)
const newExam = ref({
  title: '',
  course_id: '',
  description: '',
  duration: 120,
  start_time: '',
  end_time: '',
  total_score: 100,
  pass_score: 60
})

// 编辑考试
const editingExam = ref(null)
const showEditModal = ref(false)

// 题目编辑
const showQuestionModal = ref(false)
const currentExam = ref(null)
const questions = ref([])

// 过滤后的考试
const filteredExams = computed(() => {
  if (activeTab.value === 'all') {
    return exams.value
  }
  return exams.value.filter(e => e.status === activeTab.value)
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

// 获取状态文本
const getStatusText = (status) => {
  const map = {
    'draft': '草稿',
    'published': '已发布',
    'ongoing': '进行中',
    'finished': '已结束'
  }
  return map[status] || '未知'
}

// 获取状态样式
const getStatusClass = (status) => {
  return status
}

// 创建考试
const handleCreateExam = async () => {
  if (!newExam.value.title || !newExam.value.course_id) {
    alert('请填写完整的考试信息')
    return
  }

  try {
    const res = await createExamAPI(newExam.value)
    if (res.data.status === 0) {
      alert('考试创建成功！')
      showCreateModal.value = false
      fetchExams()
      newExam.value = {
        title: '',
        course_id: '',
        description: '',
        duration: 120,
        start_time: '',
        end_time: '',
        total_score: 100,
        pass_score: 60
      }
    } else {
      alert(res.data.message || '创建失败')
    }
  } catch (error) {
    console.error('创建考试失败:', error)
    alert('创建失败，请稍后重试')
  }
}

// 编辑考试
const editExam = (exam) => {
  editingExam.value = { ...exam }
  showEditModal.value = true
}

// 保存编辑
const saveEdit = async () => {
  try {
    const res = await updateExamAPI(editingExam.value.exam_id, editingExam.value)
    if (res.data.status === 0) {
      alert('考试更新成功')
      showEditModal.value = false
      fetchExams()
    } else {
      alert(res.data.message || '更新失败')
    }
  } catch (error) {
    console.error('更新考试失败:', error)
    alert('更新失败，请稍后重试')
  }
}

// 删除考试
const handleDeleteExam = async (exam) => {
  if (confirm(`确定要删除考试"${exam.title}"吗？`)) {
    try {
      const res = await deleteExamAPI(exam.exam_id)
      if (res.data.status === 0) {
        alert('删除成功')
        fetchExams()
      } else {
        alert(res.data.message || '删除失败')
      }
    } catch (error) {
      console.error('删除失败:', error)
      alert('删除失败，请稍后重试')
    }
  }
}

// 发布考试
const handlePublishExam = async (exam) => {
  if (exam.question_count === 0) {
    alert('请先添加题目后再发布考试')
    return
  }
  try {
    const res = await publishExamAPI(exam.exam_id)
    if (res.data.status === 0) {
      alert('考试已发布！')
      fetchExams()
    } else {
      alert(res.data.message || '发布失败')
    }
  } catch (error) {
    console.error('发布失败:', error)
    alert('发布失败，请稍后重试')
  }
}

// 管理题目
const manageQuestions = async (exam) => {
  currentExam.value = exam
  try {
    const res = await getExamQuestions(exam.exam_id)
    if (res.data.status === 0) {
      questions.value = res.data.data || []
    }
  } catch (error) {
    console.error('获取题目失败:', error)
    questions.value = []
  }
  showQuestionModal.value = true
}

// 添加题目
const handleAddQuestion = async () => {
  const question = {
    exam_id: currentExam.value.exam_id,
    question_type: 'single',
    question_text: '',
    options: ['', '', '', ''],
    correct_answer: 'A',
    score: 2,
    sort_order: questions.value.length + 1
  }
  questions.value.push(question)
}

// 删除题目
const handleDeleteQuestion = async (index, questionId) => {
  if (confirm('确定要删除这道题目吗？')) {
    if (questionId) {
      try {
        const res = await deleteQuestionAPI(questionId)
        if (res.data.status === 0) {
          questions.value.splice(index, 1)
        } else {
          alert(res.data.message || '删除失败')
        }
      } catch (error) {
        console.error('删除失败:', error)
        alert('删除失败，请稍后重试')
      }
    } else {
      questions.value.splice(index, 1)
    }
  }
}

// 保存题目
const saveQuestions = async () => {
  try {
    for (const question of questions.value) {
      if (!question.question_id) {
        await addQuestionAPI(question)
      }
    }
    if (currentExam.value) {
      currentExam.value.question_count = questions.value.length
    }
    showQuestionModal.value = false
    alert('题目保存成功！')
  } catch (error) {
    console.error('保存题目失败:', error)
    alert('保存失败，请稍后重试')
  }
}

// 查看成绩
const viewScores = (exam) => {
  alert(`查看"${exam.title}"的成绩统计`)
}

// 获取课程列表
const fetchCourses = async () => {
  try {
    const res = await getTeacherCourses()
    if (res.data.status === 0) {
      courses.value = res.data.data || []
    } else {
      console.error('获取课程列表失败:', res.data.message)
    }
  } catch (error) {
    console.error('获取课程列表失败:', error)
  }
}

onMounted(() => {
  fetchExams()
  fetchCourses()
})
</script>

<template>
  <div class="exam-manage-page">
    <!-- 页面头部 -->
    <header class="page-header">
      <h1 class="page-title">📝 考试管理</h1>
      <button class="btn-create" @click="showCreateModal = true">+ 创建考试</button>
    </header>

    <!-- 筛选标签 -->
    <div class="filter-tabs">
      <button :class="{ active: activeTab === 'all' }" @click="switchTab('all')">全部</button>
      <button :class="{ active: activeTab === 'draft' }" @click="switchTab('draft')">草稿</button>
      <button :class="{ active: activeTab === 'published' }" @click="switchTab('published')">已发布</button>
      <button :class="{ active: activeTab === 'finished' }" @click="switchTab('finished')">已结束</button>
    </div>

    <!-- 创建考试弹窗 -->
    <div v-if="showCreateModal" class="modal-overlay" @click="showCreateModal = false">
      <div class="modal-content" @click.stop>
        <h3>创建新考试</h3>
        <div class="form-group">
          <label>考试名称</label>
          <input v-model="newExam.title" placeholder="请输入考试名称" />
        </div>
        <div class="form-group">
          <label>所属课程</label>
          <select v-model="newExam.course_id">
            <option value="">请选择课程</option>
            <option v-for="course in courses" :key="course.course_id" :value="course.course_id">
              {{ course.course_name }}
            </option>
          </select>
          <p v-if="courses.length === 0" class="form-hint" style="color: #f44336; margin-top: 8px;">
            暂无课程，请先创建课程
          </p>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>考试时长（分钟）</label>
            <input v-model.number="newExam.duration" type="number" />
          </div>
          <div class="form-group">
            <label>总分</label>
            <input v-model.number="newExam.total_score" type="number" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>开始时间</label>
            <input v-model="newExam.start_time" type="datetime-local" />
          </div>
          <div class="form-group">
            <label>结束时间</label>
            <input v-model="newExam.end_time" type="datetime-local" />
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showCreateModal = false">取消</button>
          <button class="btn-save" @click="handleCreateExam">创建</button>
        </div>
      </div>
    </div>

    <!-- 编辑考试弹窗 -->
    <div v-if="showEditModal" class="modal-overlay" @click="showEditModal = false">
      <div class="modal-content" @click.stop>
        <h3>编辑考试</h3>
        <div class="form-group">
          <label>考试名称</label>
          <input v-model="editingExam.title" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>考试时长（分钟）</label>
            <input v-model.number="editingExam.duration" type="number" />
          </div>
          <div class="form-group">
            <label>总分</label>
            <input v-model.number="editingExam.total_score" type="number" />
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showEditModal = false">取消</button>
          <button class="btn-save" @click="saveEdit">保存</button>
        </div>
      </div>
    </div>

    <!-- 题目管理弹窗 -->
    <div v-if="showQuestionModal" class="modal-overlay" @click="showQuestionModal = false">
      <div class="modal-content large" @click.stop>
        <h3>管理题目 - {{ currentExam?.title }}</h3>
        <div class="questions-list">
          <div v-for="(question, index) in questions" :key="question.question_id" class="question-item">
            <div class="question-header">
              <span class="question-number">第{{ index + 1 }}题</span>
              <select v-model="question.question_type">
                <option value="single">单选题</option>
                <option value="multiple">多选题</option>
                <option value="judge">判断题</option>
              </select>
              <input v-model.number="question.score" type="number" class="score-input" placeholder="分值" />
              <button class="btn-delete" @click="handleDeleteQuestion(index, question.question_id)">删除</button>
            </div>
            <textarea v-model="question.question_text" placeholder="请输入题目内容" rows="2"></textarea>
            <div class="options-list">
              <div v-for="(option, optIndex) in question.options" :key="optIndex" class="option-item">
                <input
                  type="radio"
                  :name="'correct_' + question.question_id"
                  :value="String.fromCharCode(65 + optIndex)"
                  v-model="question.correct_answer"
                />
                <span class="option-label">{{ String.fromCharCode(65 + optIndex) }}.</span>
                <input v-model="question.options[optIndex]" placeholder="选项内容" />
              </div>
            </div>
          </div>
        </div>
        <button class="btn-add" @click="handleAddQuestion">+ 添加题目</button>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showQuestionModal = false">取消</button>
          <button class="btn-save" @click="saveQuestions">保存</button>
        </div>
      </div>
    </div>

    <!-- 考试列表 -->
    <div class="exam-list">
      <div v-for="exam in filteredExams" :key="exam.exam_id" class="exam-card">
        <div class="exam-header">
          <div class="exam-info">
            <h3 class="exam-title">{{ exam.title }}</h3>
            <span class="exam-course">📖 {{ exam.course_name }}</span>
          </div>
          <span class="status-badge" :class="getStatusClass(exam.status)">
            {{ getStatusText(exam.status) }}
          </span>
        </div>

        <div class="exam-meta">
          <span>⏱️ {{ exam.duration }}分钟</span>
          <span>📊 {{ exam.total_score }}分</span>
          <span>📝 {{ exam.question_count }}题</span>
          <span v-if="exam.avg_score">📈 平均分：{{ exam.avg_score }}</span>
        </div>

        <div class="exam-time">
          <span>开始时间：{{ exam.start_time }}</span>
          <span>结束时间：{{ exam.end_time }}</span>
        </div>

        <div class="exam-stats" v-if="exam.status !== 'draft'">
          <span>已提交：{{ exam.submitted_count }}/{{ exam.total_students }}人</span>
        </div>

        <div class="exam-actions">
          <template v-if="exam.status === 'draft'">
            <button class="btn-edit" @click="editExam(exam)">编辑</button>
            <button class="btn-questions" @click="manageQuestions(exam)">管理题目</button>
            <button class="btn-publish" @click="handlePublishExam(exam)">发布</button>
            <button class="btn-delete" @click="handleDeleteExam(exam)">删除</button>
          </template>
          <template v-else-if="exam.status === 'published'">
            <button class="btn-questions" @click="manageQuestions(exam)">管理题目</button>
            <button class="btn-view" @click="viewScores(exam)">查看成绩</button>
          </template>
          <template v-else-if="exam.status === 'finished'">
            <button class="btn-view" @click="viewScores(exam)">查看成绩</button>
            <button class="btn-analysis">成绩分析</button>
          </template>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="filteredExams.length === 0" class="empty-state">
      <div class="empty-icon">📝</div>
      <p>暂无考试</p>
    </div>
  </div>
</template>

<style scoped>
.exam-manage-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px;
}

/* 页面头部 */
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
.btn-create {
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: transform 0.2s;
}
.btn-create:hover {
  transform: translateY(-2px);
}

/* 筛选标签 */
.filter-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
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

/* 弹窗 */
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
.modal-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}
.modal-content.large {
  max-width: 800px;
}
.modal-content h3 {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 20px;
}
.form-group {
  margin-bottom: 16px;
}
.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #666;
}
.form-group input,
.form-group select {
  width: 100%;
  padding: 10px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}
.modal-actions button {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}
.btn-cancel {
  background: #f5f7fa;
  color: #666;
}
.btn-save {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

/* 题目列表 */
.questions-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 20px;
}
.question-item {
  padding: 16px;
  background: #f9faff;
  border-radius: 8px;
}
.question-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.question-number {
  font-weight: bold;
  color: #667eea;
}
.question-header select {
  padding: 6px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}
.score-input {
  width: 80px !important;
  padding: 6px 12px !important;
}
.question-item textarea {
  width: 100%;
  padding: 10px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 12px;
  resize: vertical;
}
.options-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.option-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
.option-item input[type="radio"] {
  width: auto;
}
.option-label {
  font-weight: bold;
  color: #667eea;
  width: 24px;
}
.option-item input[type="text"] {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}
.btn-add {
  width: 100%;
  padding: 12px;
  background: #f0f4ff;
  color: #667eea;
  border: 2px dashed #667eea;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  margin-bottom: 20px;
}
.btn-add:hover {
  background: #e0e0e0;
}

/* 考试列表 */
.exam-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.exam-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.exam-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}
.exam-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}
.exam-course {
  color: #667eea;
  font-size: 14px;
}
.status-badge {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}
.status-badge.draft {
  background: #fff3e0;
  color: #ff9800;
}
.status-badge.published {
  background: #e3f2fd;
  color: #2196f3;
}
.status-badge.finished {
  background: #e8f5e9;
  color: #4caf50;
}
.exam-meta {
  display: flex;
  gap: 20px;
  margin-bottom: 12px;
  font-size: 14px;
  color: #666;
}
.exam-time {
  display: flex;
  gap: 20px;
  margin-bottom: 12px;
  font-size: 13px;
  color: #999;
}
.exam-stats {
  padding: 8px 12px;
  background: #f9faff;
  border-radius: 8px;
  font-size: 13px;
  color: #667eea;
  margin-bottom: 16px;
}
.exam-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.exam-actions button {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: transform 0.2s;
}
.exam-actions button:hover {
  transform: translateY(-2px);
}
.btn-edit {
  background: #f0f4ff;
  color: #667eea;
}
.btn-questions {
  background: #e3f2fd;
  color: #2196f3;
}
.btn-publish {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}
.btn-view {
  background: #e8f5e9;
  color: #4caf50;
}
.btn-analysis {
  background: #f3e5f5;
  color: #9c27b0;
}
.btn-delete {
  background: #ffebee;
  color: #f44336;
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
  .form-row {
    grid-template-columns: 1fr;
  }
  .exam-meta,
  .exam-time {
    flex-wrap: wrap;
    gap: 8px;
  }
  .exam-actions {
    flex-wrap: wrap;
  }
}
</style>
