// 学生端路由模块
const express = require('express')
const router = express.Router()
const studentHandler = require('../router_handler/student')

// 课程广场 - 获取公开课程列表
router.get('/courses', studentHandler.getCourseList)

// 我的课程 - 获取学生已加入的课程
router.get('/my-courses', studentHandler.getMyCourses)

// 加入课程
router.post('/course/join', studentHandler.joinCourse)

// 获取课程详情
router.get('/course/:courseId', studentHandler.getCourseDetail)

// 获取课程章节列表
router.get('/course/:courseId/chapters', studentHandler.getChapters)

// 获取视频列表
router.get('/course/:courseId/videos', studentHandler.getVideos)

// 获取视频详情
router.get('/video/:videoId', studentHandler.getVideoDetail)

// 更新视频学习进度
router.post('/video/progress', studentHandler.updateVideoProgress)

// 获取课程学习进度
router.get('/course/:courseId/progress', studentHandler.getCourseProgress)

// 获取视频评论
router.get('/video/:videoId/comments', studentHandler.getComments)

// 发表评论
router.post('/comment', studentHandler.addComment)

// 点赞视频
router.post('/video/like', studentHandler.likeVideo)

// 获取考试列表
router.get('/exams', studentHandler.getExamList)

// 获取考试详情
router.get('/exam/:examId', studentHandler.getExamDetail)

// 开始考试
router.post('/exam/start', studentHandler.startExam)

// 提交答卷
router.post('/exam/submit', studentHandler.submitExam)

// 获取考试结果
router.get('/exam/:examId/result', studentHandler.getExamResult)

// 获取实验任务列表
router.get('/experiments', studentHandler.getExperimentList)

// 获取实验详情
router.get('/experiment/:experimentId', studentHandler.getExperimentDetail)

// 提交实验报告
router.post('/experiment/submit', studentHandler.submitExperiment)

// 获取讨论列表
router.get('/discussions', studentHandler.getDiscussionList)

// 获取课程讨论
router.get('/course/:courseId/discussions', studentHandler.getCourseDiscussions)

// 发起讨论
router.post('/discussion', studentHandler.addDiscussion)

// 回复讨论
router.post('/discussion/reply', studentHandler.replyDiscussion)

// 点赞讨论
router.post('/discussion/like', studentHandler.likeDiscussion)

// 获取通知列表
router.get('/notifications', studentHandler.getNotifications)

// 标记通知已读
router.post('/notification/read', studentHandler.markNotificationRead)

// 获取学习资料
router.get('/course/:courseId/materials', studentHandler.getMaterials)

module.exports = router
