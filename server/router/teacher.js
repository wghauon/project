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
module.exports = router