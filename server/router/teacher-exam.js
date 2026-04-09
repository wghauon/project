// 教师端考试管理路由模块
const express = require('express')
const router = express.Router()
const examHandler = require('../router_handler/teacher-exam')

// 获取考试列表
router.get('/exams', examHandler.getExamList)

// 创建考试
router.post('/exam', examHandler.createExam)

// 更新考试
router.put('/exam/:examId', examHandler.updateExam)

// 删除考试
router.delete('/exam/:examId', examHandler.deleteExam)

// 发布考试
router.post('/exam/publish/:examId', examHandler.publishExam)

// 获取考试题目
router.get('/exam/:examId/questions', examHandler.getQuestions)

// 添加题目
router.post('/exam/question', examHandler.addQuestion)

// 更新题目
router.put('/exam/question/:questionId', examHandler.updateQuestion)

// 删除题目
router.delete('/exam/question/:questionId', examHandler.deleteQuestion)

// 获取考试统计
router.get('/exam/:examId/statistics', examHandler.getExamStatistics)

// 获取学生答卷
router.get('/exam/:examId/records', examHandler.getExamRecords)

// 批改答卷
router.post('/exam/grade', examHandler.gradeExam)

module.exports = router
