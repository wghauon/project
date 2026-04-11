import instance from '@/utils/request'

// 课程广场 - 获取公开课程列表
export const getCourseList = (params) => {
  return instance.get('/student/courses', { params })
}

// 我的课程 - 获取学生已加入的课程
export const getMyCourses = () => {
  return instance.get('/student/my-courses')
}

// 加入课程
export const joinCourse = (data) => {
  return instance.post('/student/course/join', data)
}

// 获取课程详情
export const getCourseDetail = (courseId) => {
  return instance.get(`/student/course/${courseId}`)
}

// 获取课程章节列表
export const getChapters = (courseId) => {
  return instance.get(`/student/course/${courseId}/chapters`)
}

// 获取视频列表
export const getVideos = (courseId) => {
  return instance.get(`/student/course/${courseId}/videos`)
}

// 获取视频详情
export const getVideoDetail = (videoId) => {
  return instance.get(`/student/video/${videoId}`)
}

// 更新视频学习进度
export const updateVideoProgress = (data) => {
  return instance.post('/student/video/progress', data)
}

// 获取课程学习进度
export const getCourseProgress = (courseId) => {
  return instance.get(`/student/course/${courseId}/progress`)
}

// 获取视频评论
export const getComments = (videoId) => {
  return instance.get(`/student/video/${videoId}/comments`)
}

// 发表评论
export const addComment = (data) => {
  return instance.post('/student/comment', data)
}

// 点赞视频
export const likeVideo = (data) => {
  return instance.post('/student/video/like', data)
}

// 获取考试列表
export const getExamList = () => {
  return instance.get('/student/exams')
}

// 获取考试详情
export const getExamDetail = (examId) => {
  return instance.get(`/student/exam/${examId}`)
}

// 开始考试
export const startExam = (data) => {
  return instance.post('/student/exam/start', data)
}

// 提交答卷
export const submitExam = (data) => {
  return instance.post('/student/exam/submit', data)
}

// 获取考试结果
export const getExamResult = (examId) => {
  return instance.get(`/student/exam/${examId}/result`)
}

// 获取实验任务列表
export const getExperimentList = () => {
  return instance.get('/student/experiments')
}

// 获取实验详情
export const getExperimentDetail = (experimentId) => {
  return instance.get(`/student/experiment/${experimentId}`)
}

// 提交实验报告
export const submitExperiment = (data) => {
  return instance.post('/student/experiment/submit', data)
}

// 获取讨论列表
export const getDiscussionList = () => {
  return instance.get('/student/discussions')
}

// 获取课程讨论
export const getCourseDiscussions = (courseId) => {
  return instance.get(`/student/course/${courseId}/discussions`)
}

// 发起讨论
export const addDiscussion = (data) => {
  return instance.post('/student/discussion', data)
}

// 回复讨论
export const replyDiscussion = (data) => {
  return instance.post('/student/discussion/reply', data)
}

// 点赞讨论
export const likeDiscussion = (data) => {
  return instance.post('/student/discussion/like', data)
}

// 获取通知列表
export const getNotifications = () => {
  return instance.get('/student/notifications')
}

// 标记通知已读
export const markNotificationRead = (data) => {
  return instance.post('/student/notification/read', data)
}

// 获取学习资料
export const getMaterials = (courseId) => {
  return instance.get(`/student/course/${courseId}/materials`)
}
