<script setup>
import { ref, computed, onMounted } from 'vue'
import { 
  getExamList, 
  createExam as createExamAPI, 
  updateExam as updateExamAPI, 
  deleteExam as deleteExamAPI, 
  publishExam as publishExamAPI, 
  getExamQuestions, 
  addQuestion as addQuestionAPI, 
  updateQuestion as updateQuestionAPI,
  deleteQuestion as deleteQuestionAPI, 
  getTeacherCourses 
} from '@/api/teacher'

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
const savingQuestions = ref(false)

// 考试预览
const showPreviewModal = ref(false)
const previewExam = ref(null)
const previewQuestions = ref([])

// 批量导入
const showBatchImportModal = ref(false)
const batchImportText = ref('')
const batchImportDefaultScore = ref(2)

// 过滤后的考试
const filteredExams = computed(() => {
  if (activeTab.value === 'all') {
    return exams.value
  }
  return exams.value.filter(e => e.status === activeTab.value)
})

// 计算题目总分
const questionsTotalScore = computed(() => {
  return questions.value.reduce((sum, q) => sum + (Number(q.score) || 0), 0)
})

// 检查总分是否匹配
const isScoreMatched = computed(() => {
  if (!currentExam.value) return true
  return questionsTotalScore.value === Number(currentExam.value.total_score)
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
  
  // 检查总分是否匹配
  const res = await getExamQuestions(exam.exam_id)
  if (res.data.status === 0) {
    const qs = res.data.data || []
    const totalScore = qs.reduce((sum, q) => sum + (Number(q.score) || 0), 0)
    if (totalScore !== Number(exam.total_score)) {
      alert(`题目总分(${totalScore})与考试总分(${exam.total_score})不匹配，请调整后再发布`)
      return
    }
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

// 转换数字题目类型为字符串
const parseQuestionType = (type) => {
  const typeMap = {
    1: 'single',
    2: 'multiple',
    3: 'judge'
  }
  return typeMap[type] || 'single'
}

// 管理题目
const manageQuestions = async (exam) => {
  currentExam.value = exam
  try {
    const res = await getExamQuestions(exam.exam_id)
    if (res.data.status === 0) {
      questions.value = res.data.data || []
      // 确保选项是数组，并转换题目类型
      questions.value.forEach(q => {
        // 转换题目类型
        q.question_type = parseQuestionType(q.question_type)
        
        // 解析选项
        if (typeof q.options === 'string') {
          try {
            q.options = JSON.parse(q.options)
          } catch {
            q.options = ['', '', '', '']
          }
        }
        if (!q.options || !Array.isArray(q.options)) {
          q.options = ['', '', '', '']
        }
        
        // 转换多选题答案为数组
        if (q.question_type === 'multiple' && typeof q.correct_answer === 'string') {
          q.correct_answer = q.correct_answer.split('')
        }
      })
    }
  } catch (error) {
    console.error('获取题目失败:', error)
    questions.value = []
  }
  showQuestionModal.value = true
}

// 获取题目类型文本
const getQuestionTypeText = (type) => {
  const map = {
    'single': '单选题',
    'multiple': '多选题',
    'judge': '判断题'
  }
  return map[type] || '未知'
}

// 获取选项标签
const getOptionLabel = (index) => {
  return String.fromCharCode(65 + index)
}

// 初始化新题目
const createNewQuestion = (type = 'single') => {
  const base = {
    exam_id: currentExam.value.exam_id,
    question_type: type,
    question_text: '',
    score: 2,
    sort_order: questions.value.length + 1
  }
  
  if (type === 'judge') {
    return {
      ...base,
      options: ['正确', '错误'],
      correct_answer: 'A'
    }
  } else if (type === 'multiple') {
    return {
      ...base,
      options: ['', '', '', ''],
      correct_answer: []
    }
  } else {
    return {
      ...base,
      options: ['', '', '', ''],
      correct_answer: 'A'
    }
  }
}

// 添加题目
const handleAddQuestion = (type = 'single') => {
  const question = createNewQuestion(type)
  questions.value.push(question)
}

// 删除题目
const handleDeleteQuestion = async (index, question) => {
  if (confirm('确定要删除这道题目吗？')) {
    if (question.question_id) {
      try {
        const res = await deleteQuestionAPI(question.question_id)
        if (res.data.status === 0) {
          questions.value.splice(index, 1)
          // 重新排序
          questions.value.forEach((q, i) => {
            q.sort_order = i + 1
          })
        } else {
          alert(res.data.message || '删除失败')
        }
      } catch (error) {
        console.error('删除失败:', error)
        alert('删除失败，请稍后重试')
      }
    } else {
      questions.value.splice(index, 1)
      questions.value.forEach((q, i) => {
        q.sort_order = i + 1
      })
    }
  }
}

// 题目类型改变时重置选项
const onQuestionTypeChange = (question) => {
  if (question.question_type === 'judge') {
    question.options = ['正确', '错误']
    question.correct_answer = 'A'
  } else if (question.question_type === 'multiple') {
    question.options = ['', '', '', '']
    question.correct_answer = []
  } else {
    question.options = ['', '', '', '']
    question.correct_answer = 'A'
  }
}

// 添加选项
const addOption = (question) => {
  if (question.options.length < 8) {
    question.options.push('')
  }
}

// 删除选项
const removeOption = (question, index) => {
  if (question.options.length > 2) {
    question.options.splice(index, 1)
    // 更新正确答案
    if (question.question_type === 'single') {
      if (question.correct_answer === getOptionLabel(index)) {
        question.correct_answer = 'A'
      }
    } else if (question.question_type === 'multiple') {
      const label = getOptionLabel(index)
      question.correct_answer = question.correct_answer.filter(ans => ans !== label)
    }
  }
}

// 验证题目
const validateQuestion = (question) => {
  if (!question.question_text.trim()) {
    return '请输入题目内容'
  }
  
  if (question.question_type !== 'judge') {
    const emptyOptions = question.options.some(opt => !opt.trim())
    if (emptyOptions) {
      return '请填写所有选项内容'
    }
  }
  
  if (question.question_type === 'multiple') {
    if (!question.correct_answer || question.correct_answer.length === 0) {
      return '请选择至少一个正确答案'
    }
  } else {
    if (!question.correct_answer) {
      return '请选择正确答案'
    }
  }
  
  if (!question.score || question.score <= 0) {
    return '请输入有效的分值'
  }
  
  return null
}

// 转换题目类型为数字（数据库要求）
const convertQuestionType = (type) => {
  const typeMap = {
    'single': 1,
    'multiple': 2,
    'judge': 3
  }
  return typeMap[type] || 1
}

// 保存题目
const saveQuestions = async () => {
  // 验证所有题目
  for (let i = 0; i < questions.value.length; i++) {
    const error = validateQuestion(questions.value[i])
    if (error) {
      alert(`第${i + 1}题：${error}`)
      return
    }
  }
  
  // 检查总分
  if (!isScoreMatched.value) {
    if (!confirm(`题目总分(${questionsTotalScore.value})与考试总分(${currentExam.value.total_score})不匹配，是否继续保存？`)) {
      return
    }
  }
  
  savingQuestions.value = true
  try {
    for (const question of questions.value) {
      // 转换题目类型为数字，并处理正确答案格式
      const questionData = {
        exam_id: question.exam_id,
        question_type: convertQuestionType(question.question_type),
        question_text: question.question_text,
        options: question.options,
        correct_answer: Array.isArray(question.correct_answer) 
          ? question.correct_answer.join('') 
          : question.correct_answer,
        score: question.score,
        sort_order: question.sort_order
      }
      
      if (question.question_id) {
        await updateQuestionAPI(question.question_id, questionData)
      } else {
        await addQuestionAPI(questionData)
      }
    }
    if (currentExam.value) {
      currentExam.value.question_count = questions.value.length
    }
    showQuestionModal.value = false
    alert('题目保存成功！')
    fetchExams()
  } catch (error) {
    console.error('保存题目失败:', error)
    alert('保存失败：' + (error.response?.data?.message || error.message || '请稍后重试'))
  } finally {
    savingQuestions.value = false
  }
}

// 移动题目
const moveQuestion = (index, direction) => {
  if (direction === 'up' && index > 0) {
    const temp = questions.value[index]
    questions.value[index] = questions.value[index - 1]
    questions.value[index - 1] = temp
    questions.value[index].sort_order = index + 1
    questions.value[index - 1].sort_order = index
  } else if (direction === 'down' && index < questions.value.length - 1) {
    const temp = questions.value[index]
    questions.value[index] = questions.value[index + 1]
    questions.value[index + 1] = temp
    questions.value[index].sort_order = index + 1
    questions.value[index + 1].sort_order = index + 2
  }
}

// 预览考试
const previewExamQuestions = async (exam) => {
  previewExam.value = exam
  try {
    const res = await getExamQuestions(exam.exam_id)
    if (res.data.status === 0) {
      previewQuestions.value = res.data.data || []
      previewQuestions.value.forEach(q => {
        // 转换题目类型
        q.question_type = parseQuestionType(q.question_type)
        
        // 解析选项
        if (typeof q.options === 'string') {
          try {
            q.options = JSON.parse(q.options)
          } catch {
            q.options = []
          }
        }
        
        // 转换多选题答案为数组
        if (q.question_type === 'multiple' && typeof q.correct_answer === 'string') {
          q.correct_answer = q.correct_answer.split('')
        }
      })
    }
  } catch (error) {
    console.error('获取题目失败:', error)
    previewQuestions.value = []
  }
  showPreviewModal.value = true
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

// 格式化日期时间
const formatDateTime = (datetime) => {
  if (!datetime) return '未设置'
  return new Date(datetime).toLocaleString('zh-CN')
}

// 检查是否为正确答案
const isCorrectAnswer = (question, optIndex) => {
  const label = getOptionLabel(optIndex)
  if (question.question_type === 'multiple') {
    return question.correct_answer && question.correct_answer.includes(label)
  }
  return question.correct_answer === label
}

// 批量导入题目
const parseBatchImport = () => {
  if (!batchImportText.value.trim()) {
    alert('请输入题目内容')
    return
  }

  const lines = batchImportText.value.split('\n').filter(line => line.trim())
  const newQuestions = []
  let currentQuestion = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // 检测题目开始（以数字开头，如 "1." 或 "1、"）
    const questionMatch = line.match(/^(\d+)[\.、\s]+(.+)$/)
    if (questionMatch) {
      // 保存上一个题目
      if (currentQuestion && currentQuestion.question_text) {
        newQuestions.push(currentQuestion)
      }
      
      // 创建新题目
      currentQuestion = createNewQuestion('single')
      currentQuestion.question_text = questionMatch[2]
      currentQuestion.score = batchImportDefaultScore.value
      currentQuestion.options = []
      currentQuestion.correct_answer = ''
      continue
    }
    
    if (!currentQuestion) continue
    
    // 检测选项（A. B. C. D. 或 A、B、C、D、）
    const optionMatch = line.match(/^([A-H])[\.、\s]+(.+)$/)
    if (optionMatch) {
      currentQuestion.options.push(optionMatch[2])
      continue
    }
    
    // 检测答案（答案：A 或 正确答案：A 或 答案：AB）
    const answerMatch = line.match(/答案[：:]\s*([A-H]+)/)
    if (answerMatch) {
      const answer = answerMatch[1].toUpperCase()
      if (answer.length > 1) {
        currentQuestion.question_type = 'multiple'
        currentQuestion.correct_answer = answer.split('')
      } else {
        currentQuestion.question_type = 'single'
        currentQuestion.correct_answer = answer
      }
      continue
    }
    
    // 检测分值（分值：2 或 分数：2）
    const scoreMatch = line.match(/分[值数][：:]\s*(\d+\.?\d*)/)
    if (scoreMatch) {
      currentQuestion.score = parseFloat(scoreMatch[1])
      continue
    }
  }
  
  // 保存最后一个题目
  if (currentQuestion && currentQuestion.question_text) {
    newQuestions.push(currentQuestion)
  }
  
  // 验证并添加题目
  let addedCount = 0
  newQuestions.forEach(q => {
    // 如果没有选项，设置为默认选项
    if (q.options.length === 0) {
      q.options = ['', '', '', '']
    }
    // 如果没有设置答案，默认选第一个
    if (!q.correct_answer) {
      q.correct_answer = q.question_type === 'multiple' ? ['A'] : 'A'
    }
    questions.value.push(q)
    addedCount++
  })
  
  // 重新排序
  questions.value.forEach((q, i) => {
    q.sort_order = i + 1
  })
  
  alert(`成功导入 ${addedCount} 道题目`)
  showBatchImportModal.value = false
  batchImportText.value = ''
}

// 打开批量导入
const openBatchImport = () => {
  batchImportText.value = ''
  batchImportDefaultScore.value = 2
  showBatchImportModal.value = true
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
          <label>考试名称 <span class="required">*</span></label>
          <input v-model="newExam.title" placeholder="请输入考试名称" />
        </div>
        <div class="form-group">
          <label>所属课程 <span class="required">*</span></label>
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
        <div class="form-group">
          <label>考试说明</label>
          <textarea v-model="newExam.description" placeholder="请输入考试说明（可选）" rows="3"></textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>考试时长（分钟） <span class="required">*</span></label>
            <input v-model.number="newExam.duration" type="number" min="1" />
          </div>
          <div class="form-group">
            <label>总分 <span class="required">*</span></label>
            <input v-model.number="newExam.total_score" type="number" min="1" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>及格分数</label>
            <input v-model.number="newExam.pass_score" type="number" min="0" />
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
          <label>考试名称 <span class="required">*</span></label>
          <input v-model="editingExam.title" />
        </div>
        <div class="form-group">
          <label>考试说明</label>
          <textarea v-model="editingExam.description" rows="3"></textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>考试时长（分钟）</label>
            <input v-model.number="editingExam.duration" type="number" min="1" />
          </div>
          <div class="form-group">
            <label>总分</label>
            <input v-model.number="editingExam.total_score" type="number" min="1" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>及格分数</label>
            <input v-model.number="editingExam.pass_score" type="number" min="0" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>开始时间</label>
            <input v-model="editingExam.start_time" type="datetime-local" />
          </div>
          <div class="form-group">
            <label>结束时间</label>
            <input v-model="editingExam.end_time" type="datetime-local" />
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
        <div class="modal-header">
          <h3>管理题目 - {{ currentExam?.title }}</h3>
          <div class="score-info" :class="{ 'mismatch': !isScoreMatched }">
            题目总分: {{ questionsTotalScore }} / 考试总分: {{ currentExam?.total_score }}
            <span v-if="!isScoreMatched" class="warning-text">（不匹配）</span>
          </div>
        </div>
        
        <!-- 添加题目按钮组 -->
        <div class="add-question-buttons">
          <button class="btn-add-type" @click="handleAddQuestion('single')">+ 单选题</button>
          <button class="btn-add-type" @click="handleAddQuestion('multiple')">+ 多选题</button>
          <button class="btn-add-type" @click="handleAddQuestion('judge')">+ 判断题</button>
        </div>

        <div class="questions-list">
          <div v-for="(question, index) in questions" :key="question.question_id || index" class="question-item">
            <div class="question-header">
              <span class="question-number">第{{ index + 1 }}题</span>
              <select v-model="question.question_type" @change="onQuestionTypeChange(question)">
                <option value="single">单选题</option>
                <option value="multiple">多选题</option>
                <option value="judge">判断题</option>
              </select>
              <input v-model.number="question.score" type="number" class="score-input" placeholder="分值" min="0.5" step="0.5" />
              <span class="question-type-label">{{ getQuestionTypeText(question.question_type) }}</span>
            </div>
            
            <textarea 
              v-model="question.question_text" 
              placeholder="请输入题目内容" 
              rows="2"
              class="question-text"
            ></textarea>
            
            <!-- 选项列表 -->
            <div class="options-list">
              <!-- 判断题 -->
              <template v-if="question.question_type === 'judge'">
                <div class="option-item">
                  <input
                    type="radio"
                    :name="'correct_' + index"
                    value="A"
                    v-model="question.correct_answer"
                  />
                  <span class="option-label">A.</span>
                  <span class="option-text">正确</span>
                </div>
                <div class="option-item">
                  <input
                    type="radio"
                    :name="'correct_' + index"
                    value="B"
                    v-model="question.correct_answer"
                  />
                  <span class="option-label">B.</span>
                  <span class="option-text">错误</span>
                </div>
              </template>
              
              <!-- 多选题 -->
              <template v-else-if="question.question_type === 'multiple'">
                <div v-for="(option, optIndex) in question.options" :key="optIndex" class="option-item">
                  <input
                    type="checkbox"
                    :value="getOptionLabel(optIndex)"
                    v-model="question.correct_answer"
                  />
                  <span class="option-label">{{ getOptionLabel(optIndex) }}.</span>
                  <input 
                    v-model="question.options[optIndex]" 
                    placeholder="选项内容" 
                    class="option-input"
                  />
                  <button 
                    v-if="question.options.length > 2" 
                    class="btn-remove-option"
                    @click="removeOption(question, optIndex)"
                  >×</button>
                </div>
                <button v-if="question.options.length < 8" class="btn-add-option" @click="addOption(question)">
                  + 添加选项
                </button>
              </template>
              
              <!-- 单选题 -->
              <template v-else>
                <div v-for="(option, optIndex) in question.options" :key="optIndex" class="option-item">
                  <input
                    type="radio"
                    :name="'correct_' + index"
                    :value="getOptionLabel(optIndex)"
                    v-model="question.correct_answer"
                  />
                  <span class="option-label">{{ getOptionLabel(optIndex) }}.</span>
                  <input 
                    v-model="question.options[optIndex]" 
                    placeholder="选项内容" 
                    class="option-input"
                  />
                  <button 
                    v-if="question.options.length > 2" 
                    class="btn-remove-option"
                    @click="removeOption(question, optIndex)"
                  >×</button>
                </div>
                <button v-if="question.options.length < 8" class="btn-add-option" @click="addOption(question)">
                  + 添加选项
                </button>
              </template>
            </div>
            
            <div class="question-actions">
              <button 
                class="btn-move" 
                :disabled="index === 0"
                @click="moveQuestion(index, 'up')"
              >↑ 上移</button>
              <button 
                class="btn-move" 
                :disabled="index === questions.length - 1"
                @click="moveQuestion(index, 'down')"
              >↓ 下移</button>
              <button class="btn-delete" @click="handleDeleteQuestion(index, question)">删除</button>
            </div>
          </div>
        </div>
        
        <div v-if="questions.length === 0" class="empty-questions">
          <p>暂无题目，请点击上方按钮添加</p>
        </div>
        
        <div class="modal-actions">
          <button class="btn-batch-import" @click="openBatchImport">📋 批量导入</button>
          <button class="btn-cancel" @click="showQuestionModal = false">取消</button>
          <button class="btn-save" :disabled="savingQuestions" @click="saveQuestions">
            {{ savingQuestions ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 批量导入弹窗 -->
    <div v-if="showBatchImportModal" class="modal-overlay" @click="showBatchImportModal = false">
      <div class="modal-content large" @click.stop>
        <h3>批量导入题目</h3>
        <div class="batch-import-form">
          <div class="form-group">
            <label>默认分值</label>
            <input v-model.number="batchImportDefaultScore" type="number" min="0.5" step="0.5" />
          </div>
          <div class="form-group">
            <label>题目文本</label>
            <textarea 
              v-model="batchImportText" 
              placeholder="请输入题目，格式如下：

1. 题目内容
A. 选项A
B. 选项B
C. 选项C
D. 选项D
答案：A
分值：2

2. 下一题内容
A. 选项A
B. 选项B
答案：AB
分值：3

支持单选题和多选题，多选题答案可写多个字母如'答案：AB'"
              rows="15"
              class="batch-import-textarea"
            ></textarea>
          </div>
          <div class="import-hint">
            <p><strong>格式说明：</strong></p>
            <ul>
              <li>每道题以数字开头，如 "1. 题目内容"</li>
              <li>选项以字母开头，如 "A. 选项内容"</li>
              <li>答案格式：答案：A（单选）或 答案：AB（多选）</li>
              <li>分值格式：分值：2（可选，默认使用上方设置）</li>
            </ul>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showBatchImportModal = false">取消</button>
          <button class="btn-save" @click="parseBatchImport">导入</button>
        </div>
      </div>
    </div>

    <!-- 考试预览弹窗 -->
    <div v-if="showPreviewModal" class="modal-overlay" @click="showPreviewModal = false">
      <div class="modal-content large preview-modal" @click.stop>
        <h3>考试预览 - {{ previewExam?.title }}</h3>
        <div class="preview-info">
          <p><strong>课程：</strong>{{ previewExam?.course_name }}</p>
          <p><strong>时长：</strong>{{ previewExam?.duration }}分钟</p>
          <p><strong>总分：</strong>{{ previewExam?.total_score }}分</p>
          <p><strong>题目数：</strong>{{ previewQuestions.length }}题</p>
        </div>
        
        <div class="preview-questions">
          <div v-for="(question, index) in previewQuestions" :key="question.question_id" class="preview-question-item">
            <div class="preview-question-header">
              <span class="preview-number">{{ index + 1 }}.</span>
              <span class="preview-type">[{{ getQuestionTypeText(question.question_type) }}]</span>
              <span class="preview-score">({{ question.score }}分)</span>
            </div>
            <p class="preview-question-text">{{ question.question_text }}</p>
            <div class="preview-options">
              <div v-for="(option, optIndex) in question.options" :key="optIndex" class="preview-option">
                <span :class="{ 'correct': isCorrectAnswer(question, optIndex) }">
                  {{ getOptionLabel(optIndex) }}. {{ option }}
                  <span v-if="isCorrectAnswer(question, optIndex)" class="correct-mark">✓</span>
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button class="btn-cancel" @click="showPreviewModal = false">关闭</button>
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
          <span>开始时间：{{ formatDateTime(exam.start_time) }}</span>
          <span>结束时间：{{ formatDateTime(exam.end_time) }}</span>
        </div>

        <div class="exam-stats" v-if="exam.status !== 'draft'">
          <span>已提交：{{ exam.submitted_count || 0 }}人</span>
        </div>

        <div class="exam-actions">
          <template v-if="exam.status === 'draft'">
            <button class="btn-edit" @click="editExam(exam)">编辑</button>
            <button class="btn-questions" @click="manageQuestions(exam)">管理题目</button>
            <button class="btn-preview" @click="previewExamQuestions(exam)">预览</button>
            <button class="btn-publish" @click="handlePublishExam(exam)">发布</button>
            <button class="btn-delete" @click="handleDeleteExam(exam)">删除</button>
          </template>
          <template v-else-if="exam.status === 'published'">
            <button class="btn-questions" @click="manageQuestions(exam)">管理题目</button>
            <button class="btn-preview" @click="previewExamQuestions(exam)">预览</button>
            <button class="btn-view" @click="viewScores(exam)">查看成绩</button>
          </template>
          <template v-else-if="exam.status === 'finished'">
            <button class="btn-preview" @click="previewExamQuestions(exam)">预览</button>
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
  max-width: 900px;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.modal-content h3 {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin: 0;
}
.score-info {
  font-size: 14px;
  color: #4caf50;
  font-weight: 500;
}
.score-info.mismatch {
  color: #f44336;
}
.warning-text {
  font-size: 12px;
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
.required {
  color: #f44336;
}
.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
}
.form-group textarea {
  resize: vertical;
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
.modal-actions button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-cancel {
  background: #f5f7fa;
  color: #666;
}
.btn-save {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

/* 添加题目按钮组 */
.add-question-buttons {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.btn-add-type {
  padding: 10px 20px;
  background: #f0f4ff;
  color: #667eea;
  border: 2px dashed #667eea;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}
.btn-add-type:hover {
  background: #667eea;
  color: white;
}

/* 题目列表 */
.questions-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 20px;
  max-height: 60vh;
  overflow-y: auto;
}
.question-item {
  padding: 20px;
  background: #f9faff;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
}
.question-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.question-number {
  font-weight: bold;
  color: #667eea;
  font-size: 16px;
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
.question-type-label {
  font-size: 12px;
  color: #999;
  background: #e3f2fd;
  padding: 4px 8px;
  border-radius: 4px;
}
.question-text {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 16px;
  resize: vertical;
  font-family: inherit;
}
.options-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}
.option-item {
  display: flex;
  align-items: center;
  gap: 10px;
}
.option-item input[type="radio"],
.option-item input[type="checkbox"] {
  width: auto;
  cursor: pointer;
}
.option-label {
  font-weight: bold;
  color: #667eea;
  width: 24px;
  flex-shrink: 0;
}
.option-text {
  flex: 1;
  padding: 8px 12px;
  background: white;
  border-radius: 4px;
}
.option-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 14px;
}
.btn-remove-option {
  width: 28px;
  height: 28px;
  border: none;
  background: #ffebee;
  color: #f44336;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
}
.btn-add-option {
  padding: 8px 16px;
  background: white;
  color: #667eea;
  border: 1px dashed #667eea;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  align-self: flex-start;
}

/* 批量导入 */
.batch-import-form {
  margin-bottom: 20px;
}
.batch-import-textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  font-family: monospace;
  resize: vertical;
}
.import-hint {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 8px;
  margin-top: 16px;
}
.import-hint p {
  margin: 0 0 8px 0;
  color: #333;
}
.import-hint ul {
  margin: 0;
  padding-left: 20px;
  color: #666;
  font-size: 13px;
}
.import-hint li {
  margin: 4px 0;
}
.btn-batch-import {
  padding: 10px 20px;
  background: #e8f5e9;
  color: #4caf50;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  margin-right: auto;
}
.question-actions {
  display: flex;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px solid #e0e0e0;
}
.question-actions button {
  padding: 6px 14px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-move {
  background: #e3f2fd;
  color: #2196f3;
}
.btn-move:disabled {
  background: #f5f5f5;
  color: #ccc;
  cursor: not-allowed;
}
.btn-delete {
  background: #ffebee;
  color: #f44336;
  margin-left: auto;
}
.empty-questions {
  text-align: center;
  padding: 40px;
  color: #999;
  background: #f9f9f9;
  border-radius: 8px;
  margin-bottom: 20px;
}

/* 预览弹窗 */
.preview-modal {
  max-height: 85vh;
}
.preview-info {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
}
.preview-info p {
  margin: 4px 0;
  font-size: 14px;
}
.preview-questions {
  max-height: 50vh;
  overflow-y: auto;
}
.preview-question-item {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
}
.preview-question-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.preview-number {
  font-weight: bold;
  color: #333;
}
.preview-type {
  font-size: 12px;
  color: #667eea;
  background: #f0f4ff;
  padding: 2px 8px;
  border-radius: 4px;
}
.preview-score {
  font-size: 13px;
  color: #999;
}
.preview-question-text {
  font-size: 15px;
  color: #333;
  margin-bottom: 12px;
  line-height: 1.6;
}
.preview-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.preview-option {
  font-size: 14px;
  color: #666;
  padding: 6px 12px;
  border-radius: 4px;
}
.preview-option .correct {
  color: #4caf50;
  font-weight: 500;
}
.correct-mark {
  color: #4caf50;
  margin-left: 8px;
  font-weight: bold;
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
.status-badge.ongoing {
  background: #e8f5e9;
  color: #4caf50;
}
.status-badge.finished {
  background: #f3e5f5;
  color: #9c27b0;
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
  flex-wrap: wrap;
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
.btn-preview {
  background: #f3e5f5;
  color: #9c27b0;
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
  background: #fff3e0;
  color: #ff9800;
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
  .modal-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  .add-question-buttons {
    flex-direction: column;
  }
  .question-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
