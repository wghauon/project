import instance from '@/utils/request'

// ==================== 课程管理 ====================

// 创建课程
export const createCourse = (data) => {
  return instance.post('/teacher/course', data)
}

// 获取教师课程列表
export const getTeacherCourses = () => {
  return instance.get('/teacher/courses')
}

// 获取课程详情
export const getCourseDetail = (courseId) => {
  return instance.get(`/teacher/course/${courseId}`)
}

// 更新课程
export const updateCourse = (courseId, data) => {
  return instance.put(`/teacher/course/${courseId}`, data)
}

// 删除课程
export const deleteCourse = (courseId) => {
  return instance.delete(`/teacher/course/${courseId}`)
}

// ==================== 章节管理 ====================

// 获取章节列表
export const getChapters = (courseId) => {
  return instance.get(`/teacher/course/${courseId}/chapters`)
}

// 添加章节
export const addChapter = (data) => {
  return instance.post('/teacher/chapter', data)
}

// 获取章节详情
export const getChapterDetail = (chapterId) => {
  return instance.get(`/teacher/chapter/${chapterId}`)
}

// 更新章节
export const updateChapter = (chapterId, data) => {
  return instance.put(`/teacher/chapter/${chapterId}`, data)
}

// 删除章节
export const deleteChapter = (chapterId) => {
  return instance.delete(`/teacher/chapter/${chapterId}`)
}

// ==================== 视频管理 ====================

// 获取视频列表
export const getVideos = (courseId) => {
  return instance.get('/teacher/video_list', {
    params: { course_id: courseId }
  })
}

// 获取视频详情
export const getVideoDetail = (videoId) => {
  return instance.get('/teacher/video_detail', {
    params: { video_id: videoId }
  })
}

// 上传视频（分片上传）
export const uploadVideoChunk = (formData) => {
  return instance.post('/teacher/chunk', formData)
}

// 检查分片是否存在
export const checkChunkExist = (fileHash, chunkHash, chunkIndex) => {
  return instance.get('/teacher/chunk_exist', {
    params: { fileHash, chunkHash, chunkIndex }
  })
}

// 合并视频分片
export const mergeVideoChunks = (data) => {
  return instance.post('/teacher/chunkMerge', data)
}

// 更新视频信息
export const updateVideo = (videoId, data) => {
  return instance.put(`/teacher/video/${videoId}`, data)
}

// 删除视频
export const deleteVideo = (videoId) => {
  return instance.delete(`/teacher/video/${videoId}`)
}

// ==================== 考试管理 ====================

// 获取考试列表
export const getExamList = () => {
  return instance.get('/teacher-exam/exams')
}

// 创建考试
export const createExam = (data) => {
  return instance.post('/teacher-exam/exam', data)
}

// 更新考试
export const updateExam = (examId, data) => {
  return instance.put(`/teacher-exam/exam/${examId}`, data)
}

// 删除考试
export const deleteExam = (examId) => {
  return instance.delete(`/teacher-exam/exam/${examId}`)
}

// 发布考试
export const publishExam = (examId) => {
  return instance.post(`/teacher-exam/exam/publish/${examId}`)
}

// 获取考试题目
export const getExamQuestions = (examId) => {
  return instance.get(`/teacher-exam/exam/${examId}/questions`)
}

// 添加题目
export const addQuestion = (data) => {
  return instance.post('/teacher-exam/exam/question', data)
}

// 更新题目
export const updateQuestion = (questionId, data) => {
  return instance.put(`/teacher-exam/exam/question/${questionId}`, data)
}

// 删除题目
export const deleteQuestion = (questionId) => {
  return instance.delete(`/teacher-exam/exam/question/${questionId}`)
}

// 获取考试统计
export const getExamStatistics = (examId) => {
  return instance.get(`/teacher-exam/exam/${examId}/statistics`)
}

// 获取学生答卷
export const getExamRecords = (examId) => {
  return instance.get(`/teacher-exam/exam/${examId}/records`)
}

// 批改答卷
export const gradeExam = (data) => {
  return instance.post('/teacher-exam/exam/grade', data)
}

// ==================== 学生管理 ====================

// 获取课程学生列表
export const getCourseStudents = (courseId) => {
  return instance.get(`/teacher/course/${courseId}/students`)
}

// 移除学生
export const removeStudent = (courseId, studentId) => {
  return instance.delete(`/teacher/course/${courseId}/student/${studentId}`)
}

// 恢复学生
export const restoreStudentAPI = (courseId, studentId) => {
  return instance.post(`/teacher/course/${courseId}/student/${studentId}/restore`)
}

// 获取学生学习进度
export const getStudentProgress = (courseId, studentId) => {
  return instance.get(`/teacher/course/${courseId}/student/${studentId}/progress`)
}

// ==================== 资料管理 ====================

// 获取课程资料列表
export const getMaterials = (courseId) => {
  return instance.get(`/teacher/course/${courseId}/materials`)
}

// 上传资料
export const uploadMaterial = (formData) => {
  return instance.post('/teacher/material', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 更新资料信息
export const updateMaterial = (materialId, data) => {
  return instance.put(`/teacher/material/${materialId}`, data)
}

// 删除资料
export const deleteMaterial = (materialId) => {
  return instance.delete(`/teacher/material/${materialId}`)
}
