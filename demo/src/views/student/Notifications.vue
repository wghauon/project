<script setup>
import { ref, computed, onMounted } from 'vue'
import { getNotifications, markNotificationRead } from '@/api/student'

// 当前标签
const activeTab = ref('all')

// 通知列表
const notifications = ref([])
const loading = ref(false)

// 获取通知列表
const fetchNotifications = async () => {
  loading.value = true
  try {
    const res = await getNotifications()
    if (res.data.status === 0) {
      notifications.value = res.data.data || []
    } else {
      console.error('获取通知列表失败:', res.data.message)
    }
  } catch (error) {
    console.error('获取通知列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 过滤后的通知
const filteredNotifications = computed(() => {
  if (activeTab.value === 'all') {
    return notifications.value
  } else if (activeTab.value === 'unread') {
    return notifications.value.filter(n => !n.is_read)
  } else {
    return notifications.value.filter(n => n.type === activeTab.value)
  }
})

// 未读数量
const unreadCount = computed(() => {
  return notifications.value.filter(n => !n.is_read).length
})

// 切换标签
const switchTab = (tab) => {
  activeTab.value = tab
}

// 标记已读
const markAsRead = async (notification) => {
  try {
    const res = await markNotificationRead({ notification_id: notification.notification_id })
    if (res.data.status === 0) {
      notification.is_read = true
    }
  } catch (error) {
    console.error('标记已读失败:', error)
  }
}

// 标记全部已读
const markAllAsRead = async () => {
  try {
    for (const notification of notifications.value) {
      if (!notification.is_read) {
        await markNotificationRead({ notification_id: notification.notification_id })
        notification.is_read = true
      }
    }
  } catch (error) {
    console.error('标记全部已读失败:', error)
  }
}

// 删除通知
const deleteNotification = (notification) => {
  if (confirm('确定要删除这条通知吗？')) {
    notifications.value = notifications.value.filter(n => n.notification_id !== notification.notification_id)
  }
}

// 获取类型文本
const getTypeText = (type) => {
  const map = {
    'system': '系统',
    'course': '课程',
    'exam': '考试',
    'experiment': '实验',
    'discussion': '讨论'
  }
  return map[type] || '其他'
}

// 获取图标
const getIcon = (type) => {
  const icons = {
    'system': '🔧',
    'course': '📚',
    'exam': '📝',
    'experiment': '🔬',
    'discussion': '💬'
  }
  return icons[type] || '📢'
}

// 获取渐变
const getGradient = (type) => {
  const gradients = {
    'system': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'course': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'exam': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'experiment': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'discussion': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
  }
  return gradients[type] || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
}

onMounted(() => {
  fetchNotifications()
})
</script>

<template>
  <div class="notifications-page">
    <!-- 页面头部 -->
    <header class="page-header">
      <div class="header-left">
        <h1 class="page-title">🔔 通知中心</h1>
        <span v-if="unreadCount > 0" class="unread-badge">{{ unreadCount }}条未读</span>
      </div>
      <button v-if="unreadCount > 0" class="btn-read-all" @click="markAllAsRead">
        全部已读
      </button>
    </header>

    <!-- 筛选标签 -->
    <div class="filter-tabs">
      <button :class="{ active: activeTab === 'all' }" @click="switchTab('all')">
        全部
      </button>
      <button :class="{ active: activeTab === 'unread' }" @click="switchTab('unread')">
        未读
        <span v-if="unreadCount > 0" class="tab-badge">{{ unreadCount }}</span>
      </button>
      <button :class="{ active: activeTab === 'system' }" @click="switchTab('system')">
        系统
      </button>
      <button :class="{ active: activeTab === 'course' }" @click="switchTab('course')">
        课程
      </button>
      <button :class="{ active: activeTab === 'exam' }" @click="switchTab('exam')">
        考试
      </button>
    </div>

    <!-- 通知列表 -->
    <div class="notifications-list">
      <div 
        v-for="notification in filteredNotifications" 
        :key="notification.notification_id"
        class="notification-card"
        :class="{ unread: !notification.is_read }"
        @click="markAsRead(notification)"
      >
        <div class="notification-icon" :style="{ background: notification.gradient }">
          {{ notification.icon }}
        </div>
        <div class="notification-content">
          <div class="notification-header">
            <h3 class="notification-title">{{ notification.title }}</h3>
            <span class="notification-type">{{ getTypeText(notification.type) }}</span>
            <span v-if="!notification.is_read" class="unread-dot"></span>
          </div>
          <p class="notification-text">{{ notification.content }}</p>
          <div class="notification-meta">
            <span v-if="notification.course_name" class="course-name">
              📖 {{ notification.course_name }}
            </span>
            <span class="notification-time">{{ notification.created_at }}</span>
          </div>
        </div>
        <button class="btn-delete" @click.stop="deleteNotification(notification)">
          ✕
        </button>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="filteredNotifications.length === 0" class="empty-state">
      <div class="empty-icon">🔔</div>
      <p>暂无通知</p>
    </div>
  </div>
</template>

<style scoped>
.notifications-page {
  max-width: 900px;
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
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.page-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}
.unread-badge {
  padding: 4px 12px;
  background: #ffebee;
  color: #f44336;
  border-radius: 20px;
  font-size: 13px;
}
.btn-read-all {
  padding: 10px 20px;
  background: #f5f7fa;
  color: #667eea;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.3s;
}
.btn-read-all:hover {
  background: #e0e0e0;
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
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 6px;
}
.filter-tabs button.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}
.tab-badge {
  padding: 2px 8px;
  background: #ffebee;
  color: #f44336;
  border-radius: 10px;
  font-size: 12px;
}
.filter-tabs button.active .tab-badge {
  background: white;
}

/* 通知列表 */
.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.notification-card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
  cursor: pointer;
}
.notification-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}
.notification-card.unread {
  background: #f9faff;
  border-left: 4px solid #667eea;
}
.notification-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}
.notification-content {
  flex: 1;
  min-width: 0;
}
.notification-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}
.notification-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}
.notification-type {
  padding: 2px 8px;
  background: #f0f4ff;
  color: #667eea;
  border-radius: 4px;
  font-size: 12px;
}
.unread-dot {
  width: 8px;
  height: 8px;
  background: #f44336;
  border-radius: 50%;
}
.notification-text {
  color: #666;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 12px;
}
.notification-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
}
.course-name {
  color: #667eea;
}
.notification-time {
  color: #999;
}
.btn-delete {
  width: 32px;
  height: 32px;
  border: none;
  background: #f5f7fa;
  border-radius: 8px;
  color: #999;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.3s;
}
.btn-delete:hover {
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
@media (max-width: 600px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  .notification-header {
    flex-wrap: wrap;
  }
  .notification-meta {
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>
