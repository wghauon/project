import instance from '@/utils/request'

// ==================== 仪表盘 ====================

// 获取仪表盘统计数据
export const getDashboardStats = () => {
  return instance.get('/admin/dashboard/stats')
}

// 获取最近活动
export const getRecentActivities = () => {
  return instance.get('/admin/dashboard/activities')
}

// ==================== SSE实时数据流 ====================

/**
 * 创建SSE连接 - 管理员仪表盘实时数据流
 * @param {Object} options - 配置选项
 * @param {Function} options.onMessage - 收到消息时的回调
 * @param {Function} options.onConnect - 连接成功时的回调
 * @param {Function} options.onError - 连接错误时的回调
 * @param {Function} options.onClose - 连接关闭时的回调
 * @param {string} options.token - 访问令牌
 * @returns {Object} SSE连接控制器 { close: Function }
 */
export const createDashboardStream = (options = {}) => {
  const { onMessage, onConnect, onError, onClose, token } = options
  
  // 构建SSE连接URL，添加token作为查询参数
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000'
  const url = `${baseURL}/sse/admin/dashboard-stream?token=${encodeURIComponent(token || '')}`
  
  // 创建EventSource连接
  const eventSource = new EventSource(url)
  
  // 连接成功
  eventSource.addEventListener('connected', (event) => {
    console.log('[SSE] 连接成功:', JSON.parse(event.data))
    if (onConnect) onConnect(JSON.parse(event.data))
  })
  
  // 收到仪表盘数据更新
  eventSource.addEventListener('dashboard-update', (event) => {
    try {
      const data = JSON.parse(event.data)
      if (onMessage) onMessage(data)
    } catch (err) {
      console.error('[SSE] 解析数据失败:', err)
    }
  })
  
  // 心跳保持
  eventSource.addEventListener('heartbeat', (event) => {
    console.log('[SSE] 心跳:', JSON.parse(event.data))
  })
  
  // 错误处理
  eventSource.onerror = (error) => {
    console.error('[SSE] 连接错误:', error)
    if (onError) onError(error)
  }
  
  // 返回控制器
  return {
    close: () => {
      eventSource.close()
      if (onClose) onClose()
      console.log('[SSE] 连接已关闭')
    },
    get readyState() {
      return eventSource.readyState
    }
  }
}

/**
 * 手动触发数据更新推送
 */
export const notifyDashboardUpdate = () => {
  return instance.post('/sse/admin/notify-update')
}

/**
 * 获取SSE连接统计
 */
export const getSSEStats = () => {
  return instance.get('/sse/admin/sse-stats')
}

// ==================== 用户管理 ====================

// 获取用户列表
export const getUserList = (params) => {
  return instance.get('/admin/users', { params })
}

// 创建用户
export const createUser = (data) => {
  return instance.post('/admin/user', data)
}

// 更新用户
export const updateUser = (userId, data) => {
  return instance.put(`/admin/user/${userId}`, data)
}

// 删除用户
export const deleteUser = (userId) => {
  return instance.delete(`/admin/user/${userId}`)
}

// 重置密码
export const resetPassword = (userId) => {
  return instance.post(`/admin/user/reset-password/${userId}`)
}

// 切换用户状态
export const toggleUserStatus = (userId) => {
  return instance.post(`/admin/user/toggle-status/${userId}`)
}

// ==================== 课程审核 ====================

// 获取待审核课程
export const getPendingCourses = () => {
  return instance.get('/admin/courses/pending')
}

// 审核通过课程
export const approveCourse = (courseId, data) => {
  return instance.post(`/admin/course/approve/${courseId}`, data)
}

// 驳回课程
export const rejectCourse = (courseId, data) => {
  return instance.post(`/admin/course/reject/${courseId}`, data)
}

// ==================== 系统公告 ====================

// 获取系统公告
export const getAnnouncements = () => {
  return instance.get('/admin/announcements')
}

// 创建系统公告
export const createAnnouncement = (data) => {
  return instance.post('/admin/announcement', data)
}

// 更新系统公告
export const updateAnnouncement = (announcementId, data) => {
  return instance.put(`/admin/announcement/${announcementId}`, data)
}

// 删除系统公告
export const deleteAnnouncement = (announcementId) => {
  return instance.delete(`/admin/announcement/${announcementId}`)
}
