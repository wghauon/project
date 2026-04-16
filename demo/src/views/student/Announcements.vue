<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAnnouncements } from '@/api/student'

const router = useRouter()

// 公告列表
const announcements = ref([])
const loading = ref(false)

// 获取公告列表
const fetchAnnouncements = async () => {
  loading.value = true
  try {
    const res = await getAnnouncements()
    if (res.data.status === 0) {
      announcements.value = res.data.data || []
    } else {
      console.error('获取公告列表失败:', res.data.message)
    }
  } catch (error) {
    console.error('获取公告列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 返回上一页
const goBack = () => {
  router.push('/student/class')
}

// 获取类型文本
const getTypeText = (type) => {
  const map = {
    'system': '系统',
    'important': '重要',
    'notice': '通知'
  }
  return map[type] || '其他'
}

// 获取类型样式类
const getTypeClass = (type) => {
  return type
}

onMounted(() => {
  fetchAnnouncements()
})
</script>

<template>
  <main class="main-container">
    <div class="page-header">
      <div class="header-left">
        <button class="btn-back" @click="goBack">← 返回</button>
        <h1 class="page-title">📢 系统公告</h1>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>正在加载公告...</p>
    </div>

    <!-- 公告列表 -->
    <div v-else class="announcement-list">
      <div v-if="announcements.length === 0" class="empty-state">
        <div class="empty-icon">📢</div>
        <p>暂无公告</p>
      </div>

      <div v-for="announcement in announcements" :key="announcement.notification_id" class="announcement-card">
        <div class="announcement-header">
          <h3 class="announcement-title">
            <span v-if="announcement.is_top" class="top-badge">置顶</span>
            {{ announcement.title }}
          </h3>
          <span class="announcement-type" :class="getTypeClass(announcement.type)">
            {{ getTypeText(announcement.type) }}
          </span>
        </div>
        <p class="announcement-content">{{ announcement.content }}</p>
        <div class="announcement-footer">
          <div class="announcement-meta">
            <span>👤 {{ announcement.sender_name || '管理员' }}</span>
            <span>📅 {{ announcement.created_at }}</span>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
/* 主内容 */
.main-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}
.btn-back {
  padding: 8px 16px;
  background: #f5f7fa;
  color: #667eea;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.3s;
}
.btn-back:hover {
  background: #e0e0e0;
}
.page-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

/* 公告列表 */
.announcement-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.announcement-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-left: 4px solid #667eea;
}
.announcement-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}
.announcement-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}
.top-badge {
  display: inline-block;
  padding: 2px 8px;
  background: #ff5252;
  color: white;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}
.announcement-type {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}
.announcement-type.system {
  background: #e3f2fd;
  color: #2196f3;
}
.announcement-type.important {
  background: #ffebee;
  color: #f44336;
}
.announcement-type.notice {
  background: #fff3e0;
  color: #ff9800;
}
.announcement-content {
  color: #666;
  line-height: 1.7;
  margin-bottom: 16px;
  font-size: 14px;
}
.announcement-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}
.announcement-meta {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: #999;
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

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #999;
}
.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}
</style>
