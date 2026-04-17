const express = require('express')
const router = express.Router()
const { imgStorage, videoStorage, fileStorage } = require('../middleware/upload')
const teacher = require('../router_handler/teacher')

// 课程信息上传接口
router.post('/upload', imgStorage.single('file'), teacher.course)
// 课程列表查询接口
router.get('/course_list',teacher.courseListSearch)
// 获取教师课程列表（用于下拉选择等）
router.get('/courses', teacher.getTeacherCourses)
// 课程详细查询接口
router.get('/course_detail',teacher.courseDetail)
// 课程更新接口
router.post('/course/update', imgStorage.single('file'), teacher.updateCourse)
// 删除课程接口
router.delete('/course/:courseId', teacher.deleteCourse)
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
// 获取章节详情
router.get('/chapter/:chapterId', teacher.getChapterDetail)
// 更新章节
router.put('/chapter/:chapterId', teacher.updateChapter)
// 删除章节
router.delete('/chapter/:chapterId', teacher.deleteChapter)
// 删除视频
router.delete('/video/:videoId', teacher.deleteVideo)
// 更新视频
router.put('/video/:videoId', teacher.updateVideo)
// 获取视频详情
router.get('/video_detail', teacher.getVideoDetail)

// ==================== 学生管理路由 ====================
// 获取课程学生列表
router.get('/course/:courseId/students', teacher.getCourseStudents)
// 移除学生
router.delete('/course/:courseId/student/:studentId', teacher.removeStudent)
// 恢复学生
router.post('/course/:courseId/student/:studentId/restore', teacher.restoreStudent)
// 获取学生学习进度
router.get('/course/:courseId/student/:studentId/progress', teacher.getStudentProgress)

// ==================== 教师统计数据路由 ====================
// 获取教师统计数据
router.get('/stats', teacher.getTeacherStats)

// ==================== 资料管理路由 ====================
// 获取课程资料列表
router.get('/course/:courseId/materials', teacher.getMaterials)
// 上传资料
router.post('/material', fileStorage.single('file'), teacher.uploadMaterial)
// 更新资料信息
router.put('/material/:materialId', teacher.updateMaterial)
// 删除资料
router.delete('/material/:materialId', teacher.deleteMaterial)

// ==================== 系统公告路由 ====================
// 获取系统公告列表
router.get('/announcements', teacher.getAnnouncements)

module.exports = router