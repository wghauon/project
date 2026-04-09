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
