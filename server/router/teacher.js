const express = require('express')
const router = express.Router()
const { imgStorage, videoStorage } = require('../middleware/upload')
const teacher = require('../router_handler/teacher')

// 课程信息上传接口
router.post('/upload', imgStorage.single('file'), teacher.course)
// 课程列表查询接口
router.get('/course_list',teacher.courseListSearch)
// 课程详细查询接口
router.get('/course_detail',teacher.courseDetail)
// 视频列表查询接口
router.get('/video_list',teacher.videoList)
// 视频URL请求接口
router.get('/video_url',teacher.videoUrl)
// 检查分片文件是否存在
router.get('/chunk_exist',teacher.chunkExist)
// 分片上传接口
router.post('/chunk',videoStorage.single('file'), teacher.chunk)
// 合并文件接口
router.post('/chunkMerge',teacher.chunkMerge)

// ==================== 章节管理路由 ====================
// 获取章节列表 - 支持 /teacher/course/:courseId/chapters 和 /teacher/chapters?course_id=xxx
router.get('/course/:courseId/chapters', teacher.getChapters)
router.get('/chapters', teacher.getChapters)
// 添加章节
router.post('/chapter', teacher.addChapter)
// 更新章节
router.put('/chapter/:chapterId', teacher.updateChapter)
// 删除章节
router.delete('/chapter/:chapterId', teacher.deleteChapter)
// 删除视频
router.delete('/video/:videoId', teacher.deleteVideo)

// ==================== 学生管理路由 ====================
// 获取课程学生列表
router.get('/course/:courseId/students', teacher.getCourseStudents)
// 移除学生
router.delete('/course/:courseId/student/:studentId', teacher.removeStudent)
// 恢复学生
router.post('/course/:courseId/student/:studentId/restore', teacher.restoreStudent)
// 获取学生学习进度
router.get('/course/:courseId/student/:studentId/progress', teacher.getStudentProgress)

module.exports = router