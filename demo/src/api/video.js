import instance from '@/utils/request'
// 查询课程视频列表
export const videoSearch = (course_id) => {
  return instance.get('/teacher/video_list', {
    params: {
      course_id,
    },
  })
}
// 获取视频URL
export const videoUrl = (video_id) => {
  return instance.get('/teacher/video_url', {
    params: {
      video_id,
    },
  })
}
// 检查分片文件是否存在
export const chunkExist = (fileHash, chunkHash, chunkIndex) => {
  return instance.get('/teacher/chunk_exist', {
    params: {
      fileHash,
      chunkHash,
      chunkIndex,
    },
  })
}
// 上传分片
export const videoService = (formdata) => {
  return instance.post('/teacher/chunk', formdata)
}
// 合并分片
export const mergeService = (fileHash, video_name, description, course_id, chapter_id) => {
  return instance.post('/teacher/chunkMerge', {
    fileHash,
    video_name,
    description,
    course_id,
    chapter_id,
  })
}
