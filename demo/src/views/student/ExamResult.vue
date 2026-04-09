<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getExamResult } from '@/api/student'

const route = useRoute()
const router = useRouter()
const examId = computed(() => route.params.examId)

// 加载状态
const loading = ref(false)

// 考试信息
const examInfo = ref({
  exam_name: '',
  course_name: '',
  duration: 0,
  total_score: 0,
  score: 0,
  used_time: 0,
  rank: 0,
  total_students: 0,
  submit_time: ''
})

// 题目列表（带正确答案和解析）
const questions = ref([])

// 获取考试结果
const fetchExamResult = async () => {
  loading.value = true
  try {
    const res = await getExamResult(examId.value)
    if (res.data.status === 0) {
      const data = res.data.data
      examInfo.value = {
        exam_name: data.exam_name,
        course_name: data.course_name,
        duration: data.duration,
        total_score: data.total_score,
        score: data.score,
        used_time: data.used_time,
        rank: data.rank,
        total_students: data.total_students,
        submit_time: data.submit_time
      }
      questions.value = data.questions || []
    } else {
      alert(res.data.message || '获取考试结果失败')
    }
  } catch (error) {
    console.error('获取考试结果失败:', error)
    alert('获取考试结果失败')
  } finally {
    loading.value = false
  }
}

// 统计信息
const stats = computed(() => {
  const total = questions.value.length
  const correct = questions.value.filter(q => q.is_correct).length
  const wrong = total - correct
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0
  return { total, correct, wrong, accuracy }
})

// 返回考试列表
const goBack = () => {
  router.push('/student/exams')
}

// 查看错题
const showWrongOnly = ref(false)
const filteredQuestions = computed(() => {
  if (showWrongOnly.value) {
    return questions.value.filter(q => !q.is_correct)
  }
  return questions.value
})

onMounted(() => {
  fetchExamResult()
})
</script>

<template>
  <div class="exam-result-page">
    <!-- 顶部栏 -->
    <header class="result-header">
      <button class="btn-back" @click="goBack">← 返回考试列表</button>
      <h1>考试结果</h1>
    </header>

    <!-- 成绩概览 -->
    <div class="result-overview">
      <div class="score-card">
        <div class="score-circle">
          <span class="score-value">{{ examInfo.score }}</span>
          <span class="score-total">/{{ examInfo.total_score }}</span>
        </div>
        <div class="score-label">考试成绩</div>
      </div>
      
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-value">{{ stats.accuracy }}%</span>
          <span class="stat-label">正确率</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ stats.correct }}/{{ stats.total }}</span>
          <span class="stat-label">答对题数</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ examInfo.used_time }}分钟</span>
          <span class="stat-label">用时</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">第{{ examInfo.rank }}名</span>
          <span class="stat-label">班级排名</span>
        </div>
      </div>
    </div>

    <!-- 题目解析 -->
    <div class="analysis-section">
      <div class="section-header">
        <h2>题目解析</h2>
        <label class="filter-wrong">
          <input type="checkbox" v-model="showWrongOnly" />
          <span>只看错题</span>
        </label>
      </div>

      <div class="question-list">
        <div 
          v-for="(question, index) in filteredQuestions" 
          :key="question.question_id"
          class="question-item"
          :class="{ wrong: !question.is_correct }"
        >
          <div class="question-header">
            <span class="question-number">第{{ index + 1 }}题</span>
            <span class="question-type">
              {{ question.question_type === 'single' ? '单选题' : 
                 question.question_type === 'multiple' ? '多选题' : '判断题' }}
            </span>
            <span class="question-score">{{ question.score }}分</span>
            <span class="question-status" :class="{ correct: question.is_correct }">
              {{ question.is_correct ? '✓ 回答正确' : '✗ 回答错误' }}
            </span>
          </div>

          <h3 class="question-text">{{ question.question_text }}</h3>

          <!-- 选项列表 -->
          <div class="options-list">
            <div 
              v-for="option in question.options" 
              :key="option.option_id"
              class="option-item"
              :class="{ 
                'user-answer': isUserAnswer(question, option.option_id),
                'correct-answer': option.is_correct
              }"
            >
              <span class="option-id">{{ option.option_id }}</span>
              <span class="option-text">{{ option.option_text }}</span>
              <span v-if="option.is_correct" class="correct-tag">正确答案</span>
              <span v-else-if="isUserAnswer(question, option.option_id)" class="wrong-tag">你的答案</span>
            </div>
          </div>

          <!-- 答案解析 -->
          <div class="analysis-box">
            <div class="analysis-title">📖 答案解析</div>
            <p class="analysis-content">{{ question.analysis }}</p>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredQuestions.length === 0" class="empty-state">
        <div class="empty-icon">🎉</div>
        <p>太棒了！没有错题</p>
      </div>
    </div>
  </div>
</template>

<script>
// 辅助函数
const isUserAnswer = (question, optionId) => {
  if (Array.isArray(question.user_answer)) {
    return question.user_answer.includes(optionId)
  }
  return question.user_answer === optionId
}
</script>

<style scoped>
.exam-result-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 40px;
}

/* 顶部栏 */
.result-header {
  background: white;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.result-header h1 {
  font-size: 18px;
  font-weight: bold;
  color: #333;
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

/* 成绩概览 */
.result-overview {
  max-width: 800px;
  margin: 24px auto;
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 48px;
}
.score-card {
  text-align: center;
}
.score-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-bottom: 12px;
}
.score-value {
  font-size: 48px;
  font-weight: bold;
}
.score-total {
  font-size: 20px;
}
.score-label {
  font-size: 14px;
  color: #666;
}
.stats-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}
.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}
.stat-label {
  font-size: 13px;
  color: #999;
}

/* 题目解析 */
.analysis-section {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 24px;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.section-header h2 {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}
.filter-wrong {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
}
.filter-wrong input {
  width: 16px;
  height: 16px;
}

/* 题目列表 */
.question-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.question-item {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.question-item.wrong {
  border-left: 4px solid #f44336;
}
.question-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.question-number {
  font-weight: bold;
  color: #333;
}
.question-type {
  padding: 2px 8px;
  background: #f0f4ff;
  color: #667eea;
  border-radius: 4px;
  font-size: 12px;
}
.question-score {
  color: #ff9800;
  font-size: 13px;
}
.question-status {
  margin-left: auto;
  padding: 4px 12px;
  background: #ffebee;
  color: #f44336;
  border-radius: 4px;
  font-size: 13px;
}
.question-status.correct {
  background: #e8f5e9;
  color: #4caf50;
}
.question-text {
  font-size: 16px;
  color: #333;
  line-height: 1.6;
  margin-bottom: 20px;
}

/* 选项列表 */
.options-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}
.option-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
}
.option-item.user-answer {
  border-color: #f44336;
  background: #ffebee;
}
.option-item.correct-answer {
  border-color: #4caf50;
  background: #e8f5e9;
}
.option-id {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 50%;
  font-weight: bold;
  font-size: 13px;
}
.option-item.correct-answer .option-id {
  background: #4caf50;
  color: white;
}
.option-text {
  flex: 1;
  font-size: 14px;
}
.correct-tag {
  padding: 2px 8px;
  background: #4caf50;
  color: white;
  border-radius: 4px;
  font-size: 12px;
}
.wrong-tag {
  padding: 2px 8px;
  background: #f44336;
  color: white;
  border-radius: 4px;
  font-size: 12px;
}

/* 解析框 */
.analysis-box {
  background: #f9faff;
  border-radius: 8px;
  padding: 16px;
}
.analysis-title {
  font-weight: bold;
  color: #667eea;
  margin-bottom: 8px;
  font-size: 14px;
}
.analysis-content {
  color: #666;
  font-size: 14px;
  line-height: 1.6;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
  color: #999;
}
.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

/* 响应式 */
@media (max-width: 600px) {
  .result-overview {
    flex-direction: column;
    gap: 24px;
  }
  .stats-grid {
    width: 100%;
  }
}
</style>
