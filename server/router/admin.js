// 管理员端路由模块
const express = require('express')
const router = express.Router()
const adminHandler = require('../router_handler/admin')

// 获取仪表盘统计数据
router.get('/dashboard/stats', adminHandler.getDashboardStats)

// 获取最近活动
router.get('/dashboard/activities', adminHandler.getRecentActivities)

// 用户管理
router.get('/users', adminHandler.getUserList)
router.post('/user', adminHandler.createUser)
router.put('/user/:userId', adminHandler.updateUser)
router.delete('/user/:userId', adminHandler.deleteUser)
router.post('/user/reset-password/:userId', adminHandler.resetPassword)
router.post('/user/toggle-status/:userId', adminHandler.toggleUserStatus)

// 课程审核
router.get('/courses/pending', adminHandler.getPendingCourses)
router.post('/course/approve/:courseId', adminHandler.approveCourse)
router.post('/course/reject/:courseId', adminHandler.rejectCourse)

// 系统公告
router.get('/announcements', adminHandler.getAnnouncements)
router.post('/announcement', adminHandler.createAnnouncement)
router.put('/announcement/:announcementId', adminHandler.updateAnnouncement)
router.delete('/announcement/:announcementId', adminHandler.deleteAnnouncement)

module.exports = router
