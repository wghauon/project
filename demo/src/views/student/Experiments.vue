<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getExperimentList, submitExperiment } from '@/api/student'

const router = useRouter()

// 当前标签
const activeTab = ref('all')

// 实验列表
const experiments = ref([])
const loading = ref(false)

// 过滤后的实验列表
const filteredExperiments = computed(() => {
  if (activeTab.value === 'all') {
    return experiments.value
  }
  return experiments.value.filter(exp => exp.status === activeTab.value)
})

// 获取实验列表
const fetchExperiments = async () => {
  loading.value = true
  try {
    const res = await getExperimentList()
    if (res.data.status === 0) {
      experiments.value = res.data.data || []
    } else {
      console.error('获取实验列表失败:', res.data.message)
    }
  } catch (error) {
    console.error('获取实验列表失败:', error)
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
    'pending': '待完成',
    'submitted': '已提交',
    'graded': '已批改',
    'overdue': '已逾期'
  }
  return map[status] || '未知'
}

// 获取状态样式类
const getStatusClass = (status) => {
  return status
}

// 下载任务书
const downloadTask = (experiment) => {
  alert(`下载任务书：${experiment.title}`)
}

// 上传报告
const uploadReport = async (experiment) => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.pdf,.doc,.docx'
  input.onchange = async (e) => {
    const file = e.target.files[0]
    if (file) {
      try {
        // 这里应该上传文件到服务器，获取URL
        // 暂时模拟上传成功
        const reportUrl = `/uploads/reports/${file.name}`
        const res = await submitExperiment({
          experiment_id: experiment.experiment_id,
          report_file_url: reportUrl,
          report_content: ''
        })
        if (res.data.status === 0) {
          alert(`实验报告上传成功：${file.name}`)
          fetchExperiments()
        } else {
          alert(res.data.message || '上传失败')
        }
      } catch (error) {
        console.error('上传失败:', error)
        alert('上传失败，请稍后重试')
      }
    }
  }
  input.click()
}

// 查看反馈
const viewFeedback = (experiment) => {
  alert(`教师反馈：${experiment.feedback || '暂无反馈'}`)
}

onMounted(() => {
  fetchExperiments()
})
</script>

<template>
  <div class="experiments-page">
    <!-- 页面头部 -->
    <header class="page-header">
      <h1 class="page-title">🔬 实验任务</h1>
      <div class="filter-tabs">
        <button :class="{ active: activeTab === 'all' }" @click="switchTab('all')">全部</button>
        <button :class="{ active: activeTab === 'pending' }" @click="switchTab('pending')">待完成</button>
        <button :class="{ active: activeTab === 'submitted' }" @click="switchTab('submitted')">已提交</button>
        <button :class="{ active: activeTab === 'graded' }" @click="switchTab('graded')">已批改</button>
      </div>
    </header>

    <!-- 实验列表 -->
    <div class="experiments-list">
      <div 
        v-for="experiment in filteredExperiments" 
        :key="experiment.experiment_id"
        class="experiment-card"
        :class="{ overdue: experiment.status === 'overdue' }"
      >
        <div class="experiment-header">
          <div class="experiment-info">
            <h3 class="experiment-title">{{ experiment.title }}</h3>
            <span class="experiment-course">📖 {{ experiment.course_name }}</span>
          </div>
          <span class="status-badge" :class="getStatusClass(experiment.status)">
            {{ getStatusText(experiment.status) }}
          </span>
        </div>

        <p class="experiment-desc">{{ experiment.description }}</p>

        <div class="experiment-meta">
          <div class="meta-item">
            <span class="meta-label">截止时间</span>
            <span class="meta-value" :class="{ warning: experiment.status === 'overdue' }">
              {{ experiment.deadline }}
            </span>
          </div>
          <div class="meta-item" v-if="experiment.submitted_at">
            <span class="meta-label">提交时间</span>
            <span class="meta-value">{{ experiment.submitted_at }}</span>
          </div>
          <div class="meta-item" v-if="experiment.score !== null">
            <span class="meta-label">得分</span>
            <span class="meta-value score">{{ experiment.score }}/{{ experiment.total_score }}</span>
          </div>
        </div>

        <div class="experiment-actions">
          <button class="btn-download" @click="downloadTask(experiment)">
            📄 下载任务书
          </button>
          
          <template v-if="experiment.status === 'pending'">
            <button class="btn-upload" @click="uploadReport(experiment)">
              📤 上传报告
            </button>
          </template>
          
          <template v-else-if="experiment.status === 'submitted'">
            <button class="btn-upload" @click="uploadReport(experiment)">
              🔄 重新上传
            </button>
          </template>
          
          <template v-else-if="experiment.status === 'graded'">
            <button class="btn-view" @click="viewFeedback(experiment)">
              👁 查看反馈
            </button>
          </template>
          
          <template v-else-if="experiment.status === 'overdue'">
            <button class="btn-upload" @click="uploadReport(experiment)">
              📤 补交报告
            </button>
          </template>
        </div>

        <!-- 已上传文件显示 -->
        <div v-if="experiment.file_name" class="uploaded-file">
          <span class="file-icon">📎</span>
          <span class="file-name">{{ experiment.file_name }}</span>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="filteredExperiments.length === 0" class="empty-state">
      <div class="empty-icon">🔬</div>
      <p>暂无实验任务</p>
    </div>
  </div>
</template>

<style scoped>
.experiments-page {
  max-width: 1000px;
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
.filter-tabs {
  display: flex;
  gap: 8px;
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

/* 实验列表 */
.experiments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.experiment-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.experiment-card.overdue {
  border-left: 4px solid #f44336;
}
.experiment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}
.experiment-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}
.experiment-course {
  color: #667eea;
  font-size: 14px;
}
.status-badge {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}
.status-badge.pending {
  background: #fff3e0;
  color: #ff9800;
}
.status-badge.submitted {
  background: #e3f2fd;
  color: #2196f3;
}
.status-badge.graded {
  background: #e8f5e9;
  color: #4caf50;
}
.status-badge.overdue {
  background: #ffebee;
  color: #f44336;
}
.experiment-desc {
  color: #666;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 16px;
}

/* 实验元信息 */
.experiment-meta {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
  padding: 12px 0;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
}
.meta-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.meta-label {
  font-size: 12px;
  color: #999;
}
.meta-value {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}
.meta-value.warning {
  color: #f44336;
}
.meta-value.score {
  color: #4caf50;
  font-size: 18px;
}

/* 操作按钮 */
.experiment-actions {
  display: flex;
  gap: 12px;
}
.experiment-actions button {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: transform 0.2s;
}
.experiment-actions button:hover {
  transform: translateY(-2px);
}
.btn-download {
  background: #f5f7fa;
  color: #666;
}
.btn-upload {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}
.btn-view {
  background: #e8f5e9;
  color: #4caf50;
}

/* 已上传文件 */
.uploaded-file {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 12px;
  background: #f9faff;
  border-radius: 8px;
}
.file-icon {
  font-size: 20px;
}
.file-name {
  font-size: 14px;
  color: #333;
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
@media (max-width: 600px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  .experiment-meta {
    flex-wrap: wrap;
    gap: 12px;
  }
  .experiment-actions {
    flex-wrap: wrap;
  }
}
</style>
