<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getExamDetail, startExam, submitExam as submitExamAPI } from '@/api/student'

const route = useRoute()
const router = useRouter()
const examId = computed(() => route.params.examId)

// 加载状态
const loading = ref(false)
const examRecordId = ref(null)

// 考试信息
const examInfo = ref({
  exam_name: '',
  duration: 120,
  total_score: 100
})

// 剩余时间（秒）
const remainingTime = ref(0)

// 当前题目索引
const currentIndex = ref(0)

// 题目列表
const questions = ref([])

// 答案
const answers = ref({})

// 计时器
let timer = null

// 格式化时间
const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 当前题目
const currentQuestion = computed(() => questions.value[currentIndex.value])

// 题目进度
const progress = computed(() => {
  if (questions.value.length === 0) return 0
  return Math.round(((currentIndex.value + 1) / questions.value.length) * 100)
})

// 已答题目数
const answeredCount = computed(() => {
  return Object.keys(answers.value).length
})

// 获取考试详情
const fetchExamDetail = async () => {
  loading.value = true
  try {
    const res = await getExamDetail(examId.value)
    if (res.data.status === 0) {
      const data = res.data.data
      examInfo.value = {
        exam_name: data.exam_name,
        duration: data.duration,
        total_score: data.total_score
      }
      questions.value = data.questions || []
      // 开始考试，获取考试记录ID
      await handleStartExam()
    } else {
      alert(res.data.message || '获取考试信息失败')
      router.push('/student/exams')
    }
  } catch (error) {
    console.error('获取考试信息失败:', error)
    alert('获取考试信息失败')
    router.push('/student/exams')
  } finally {
    loading.value = false
  }
}

// 开始考试
const handleStartExam = async () => {
  try {
    const res = await startExam({ exam_id: examId.value })
    if (res.data.status === 0) {
      examRecordId.value = res.data.data.record_id
      remainingTime.value = res.data.data.remaining_time || examInfo.value.duration * 60
      // 启动倒计时
      startTimer()
    }
  } catch (error) {
    console.error('开始考试失败:', error)
  }
}

// 启动计时器
const startTimer = () => {
  timer = setInterval(() => {
    if (remainingTime.value > 0) {
      remainingTime.value--
    } else {
      clearInterval(timer)
      autoSubmit()
    }
  }, 1000)
}

// 选择答案
const selectAnswer = (optionId) => {
  const question = currentQuestion.value
  if (question.question_type === 'multiple') {
    // 多选
    const currentAnswers = answers.value[question.question_id] || []
    const index = currentAnswers.indexOf(optionId)
    if (index > -1) {
      currentAnswers.splice(index, 1)
    } else {
      currentAnswers.push(optionId)
    }
    answers.value[question.question_id] = currentAnswers
  } else {
    // 单选、判断
    answers.value[question.question_id] = optionId
  }
}

// 是否已选择
const isSelected = (optionId) => {
  const question = currentQuestion.value
  const answer = answers.value[question.question_id]
  if (Array.isArray(answer)) {
    return answer.includes(optionId)
  }
  return answer === optionId
}

// 上一题
const prevQuestion = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
  }
}

// 下一题
const nextQuestion = () => {
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value++
  }
}

// 跳转到指定题目
const jumpToQuestion = (index) => {
  currentIndex.value = index
}

// 提交考试
const handleSubmitExam = async () => {
  if (answeredCount.value < questions.value.length) {
    if (!confirm(`还有 ${questions.value.length - answeredCount.value} 道题未作答，确定要提交吗？`)) {
      return
    }
  } else {
    if (!confirm('确定要提交考试吗？')) {
      return
    }
  }
  
  // 构建答案数组
  const answerList = Object.keys(answers.value).map(questionId => ({
    question_id: parseInt(questionId),
    answer: Array.isArray(answers.value[questionId]) 
      ? answers.value[questionId].join(',') 
      : answers.value[questionId]
  }))
  
  try {
    const res = await submitExamAPI({
      exam_id: examId.value,
      record_id: examRecordId.value,
      answers: answerList,
      used_time: examInfo.value.duration * 60 - remainingTime.value
    })
    if (res.data.status === 0) {
      alert('考试已提交！')
      router.push(`/student/exam-result/${examId.value}`)
    } else {
      alert(res.data.message || '提交失败')
    }
  } catch (error) {
    console.error('提交失败:', error)
    alert('提交失败，请稍后重试')
  }
}

// 自动提交
const autoSubmit = async () => {
  alert('考试时间已到，自动提交！')
  await handleSubmitExam()
}

onMounted(() => {
  fetchExamDetail()
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<template>
  <div class="exam-taking-page">
    <!-- 顶部栏 -->
    <header class="exam-header">
      <div class="exam-title">
        <h1>{{ examInfo.exam_name }}</h1>
        <span class="exam-subtitle">共 {{ questions.length }} 题，满分 {{ examInfo.total_score }} 分</span>
      </div>
      <div class="exam-timer" :class="{ warning: remainingTime < 600 }">
        <span class="timer-label">⏱ 剩余时间</span>
        <span class="timer-value">{{ formatTime(remainingTime) }}</span>
      </div>
      <button class="btn-submit" @click="handleSubmitExam">提交试卷</button>
    </header>

    <!-- 主体内容 -->
    <div class="exam-container">
      <!-- 左侧题目区 -->
      <div class="question-section">
        <!-- 进度条 -->
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progress + '%' }"></div>
          <span class="progress-text">{{ currentIndex + 1 }} / {{ questions.length }}</span>
        </div>

        <!-- 题目内容 -->
        <div class="question-content">
          <div class="question-header">
            <span class="question-type">
              {{ currentQuestion.question_type === 'single' ? '单选题' : 
                 currentQuestion.question_type === 'multiple' ? '多选题' : '判断题' }}
            </span>
            <span class="question-score">{{ currentQuestion.score }}分</span>
          </div>
          
          <h2 class="question-text">
            <span class="question-number">{{ currentIndex + 1 }}.</span>
            {{ currentQuestion.question_text }}
          </h2>

          <!-- 选项列表 -->
          <div class="options-list">
            <div 
              v-for="option in currentQuestion.options" 
              :key="option.option_id"
              class="option-item"
              :class="{ selected: isSelected(option.option_id) }"
              @click="selectAnswer(option.option_id)"
            >
              <span class="option-id">{{ option.option_id }}</span>
              <span class="option-text">{{ option.option_text }}</span>
              <span v-if="isSelected(option.option_id)" class="option-check">✓</span>
            </div>
          </div>
        </div>

        <!-- 导航按钮 -->
        <div class="question-nav">
          <button 
            class="btn-prev" 
            :disabled="currentIndex === 0"
            @click="prevQuestion"
          >
            ← 上一题
          </button>
          <button 
            class="btn-next" 
            :disabled="currentIndex === questions.length - 1"
            @click="nextQuestion"
          >
            下一题 →
          </button>
        </div>
      </div>

      <!-- 右侧答题卡 -->
      <div class="answer-card">
        <h3>答题卡</h3>
        <div class="answer-stats">
          <span>已答 {{ answeredCount }} / {{ questions.length }} 题</span>
        </div>
        <div class="answer-grid">
          <div 
            v-for="(question, index) in questions" 
            :key="question.question_id"
            class="answer-item"
            :class="{ 
              active: currentIndex === index,
              answered: answers[question.question_id]
            }"
            @click="jumpToQuestion(index)"
          >
            {{ index + 1 }}
          </div>
        </div>
        <div class="answer-legend">
          <div class="legend-item">
            <span class="legend-dot answered"></span>
            <span>已作答</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot"></span>
            <span>未作答</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.exam-taking-page {
  min-height: 100vh;
  background: #f5f7fa;
}

/* 顶部栏 */
.exam-header {
  background: white;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 100;
}
.exam-title h1 {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}
.exam-subtitle {
  font-size: 13px;
  color: #999;
  margin-left: 12px;
}
.exam-timer {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 24px;
  background: #f0f4ff;
  border-radius: 8px;
}
.exam-timer.warning {
  background: #ffebee;
  color: #f44336;
}
.timer-label {
  font-size: 14px;
}
.timer-value {
  font-size: 20px;
  font-weight: bold;
  font-family: monospace;
}
.btn-submit {
  padding: 12px 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.2s;
}
.btn-submit:hover {
  transform: translateY(-2px);
}

/* 主体内容 */
.exam-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 24px;
}

/* 左侧题目区 */
.question-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* 进度条 */
.progress-bar {
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  margin-bottom: 24px;
  position: relative;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
  transition: width 0.3s;
}
.progress-text {
  position: absolute;
  right: 0;
  top: -24px;
  font-size: 13px;
  color: #666;
}

/* 题目内容 */
.question-content {
  margin-bottom: 32px;
}
.question-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}
.question-type {
  padding: 4px 12px;
  background: #f0f4ff;
  color: #667eea;
  border-radius: 4px;
  font-size: 13px;
}
.question-score {
  color: #ff9800;
  font-weight: bold;
}
.question-text {
  font-size: 18px;
  line-height: 1.6;
  color: #333;
  margin-bottom: 24px;
}
.question-number {
  color: #667eea;
  font-weight: bold;
  margin-right: 8px;
}

/* 选项列表 */
.options-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.option-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}
.option-item:hover {
  border-color: #667eea;
  background: #f9faff;
}
.option-item.selected {
  border-color: #667eea;
  background: #f0f4ff;
}
.option-id {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 50%;
  font-weight: bold;
  color: #666;
}
.option-item.selected .option-id {
  background: #667eea;
  color: white;
}
.option-text {
  flex: 1;
  font-size: 15px;
}
.option-check {
  color: #667eea;
  font-size: 20px;
}

/* 导航按钮 */
.question-nav {
  display: flex;
  justify-content: space-between;
  padding-top: 24px;
  border-top: 1px solid #e0e0e0;
}
.question-nav button {
  padding: 12px 32px;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}
.question-nav button:hover:not(:disabled) {
  border-color: #667eea;
  color: #667eea;
}
.question-nav button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-next {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  color: white !important;
  border: none !important;
}
.btn-next:hover:not(:disabled) {
  opacity: 0.9;
}

/* 右侧答题卡 */
.answer-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  height: fit-content;
  position: sticky;
  top: 100px;
}
.answer-card h3 {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 12px;
}
.answer-stats {
  color: #666;
  font-size: 14px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e0e0e0;
}
.answer-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}
.answer-item {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}
.answer-item:hover {
  background: #e0e0e0;
}
.answer-item.active {
  background: #667eea;
  color: white;
}
.answer-item.answered {
  background: #e8f5e9;
  color: #4caf50;
  font-weight: bold;
}
.answer-item.answered.active {
  background: #4caf50;
  color: white;
}
.answer-legend {
  display: flex;
  gap: 16px;
  padding-top: 12px;
  border-top: 1px solid #e0e0e0;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #666;
}
.legend-dot {
  width: 12px;
  height: 12px;
  background: #f5f7fa;
  border-radius: 3px;
}
.legend-dot.answered {
  background: #e8f5e9;
}

/* 响应式 */
@media (max-width: 968px) {
  .exam-container {
    grid-template-columns: 1fr;
  }
  .answer-card {
    position: static;
  }
}

@media (max-width: 600px) {
  .exam-header {
    flex-wrap: wrap;
    gap: 12px;
  }
  .exam-title {
    width: 100%;
  }
  .exam-timer {
    flex: 1;
  }
}
</style>
