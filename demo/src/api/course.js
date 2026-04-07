import instance from '@/utils/request'
// 上传课程信息
export const uploadService = (formdata) => {
  return instance.post('/teacher/upload', formdata)
}
// 查询课程列表
export const courseListSearch = (user_id) => {
  return instance.get('/teacher/course_list', {
    params: {
      user_id,
    },
  })
}
// 查询课程详情
export const courseDetailSearch = (course_id) => {
  return instance.get('/teacher/course_detail', {
    params: {
      course_id,
    },
  })
}
