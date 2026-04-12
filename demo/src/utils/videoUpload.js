import { chunkExist, videoService, mergeService } from '@/api/video'
import { cutFile } from '@/utils/cutFile'
import { createFileHash } from '@/utils/fileHash'

/**
 * 获取视频文件的元信息（时长、分辨率等）
 * @param {File} file - 视频文件
 * @returns {Promise<{duration: number, width: number, height: number}>}
 */
function getVideoMetadata(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const url = URL.createObjectURL(file)

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url)
      resolve({
        duration: Math.round(video.duration),
        width: video.videoWidth,
        height: video.videoHeight
      })
    }

    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('无法获取视频元信息'))
    }

    video.src = url
    video.load()
  })
}

/**
 * 获取文件格式（扩展名）
 * @param {File} file - 视频文件
 * @returns {string} 格式如 MP4, AVI 等
 */
function getFileFormat(file) {
  const name = file.name || ''
  const ext = name.split('.').pop().toUpperCase()
  return ext || 'MP4'
}

/**
 * 上传视频文件
 * @param {File} file - 视频文件
 * @param {string} video_name - 视频名称
 * @param {string} description - 视频描述
 * @param {string} course_id - 课程ID
 * @param {string} chapter_id - 章节ID
 * @param {Function} onProgress - 进度回调函数 (percentage) => {}
 */
export async function videUpload(file, video_name, description, course_id, chapter_id, onProgress) {
  if (!file) {
    throw new Error('未选择文件')
  }
  if (!course_id) {
    throw new Error('缺少课程ID')
  }
  if (!video_name) {
    throw new Error('缺少视频名称')
  }

  console.log('开始上传视频:', { fileName: file.name, fileSize: file.size, video_name, course_id, chapter_id })

  // 获取视频元信息
  let videoMetadata = { duration: 0, width: 0, height: 0 }
  try {
    videoMetadata = await getVideoMetadata(file)
    console.log('视频元信息:', videoMetadata)
  } catch (e) {
    console.warn('获取视频元信息失败:', e.message)
  }

  const fileHash = await createFileHash(file) // 整体文件hash
  console.log('文件哈希:', fileHash)

  const chunks = await cutFile(file)
  console.log('文件分片数量:', chunks.length)

  // 分片上传
  await chunkUpload(chunks, fileHash, onProgress)

  // 准备视频信息
  const file_size = file.size
  const format = getFileFormat(file)
  const resolution = videoMetadata.width && videoMetadata.height
    ? `${videoMetadata.width}x${videoMetadata.height}`
    : null
  const duration = videoMetadata.duration

  // 分片合并
  console.log('分片上传完成，开始合并...')
  const res = await mergeService(
    fileHash,
    video_name,
    description,
    course_id,
    chapter_id,
    duration,
    file_size,
    format,
    resolution
  )
  console.log('合并结果:', res.data)

  if (res.data.status !== 0) {
    throw new Error(res.data.message || '合并文件失败')
  }

  return res
}

async function chunkUpload(chunks, fileHash, onProgress) {
  let uploadedCount = 0
  const totalChunks = chunks.length

  for (let i = 0; i < chunks.length; i++) {
    const file = chunks[i].blob
    const chunkHash = chunks[i].hash
    const chunkIndex = chunks[i].index

    try {
      // 检查分片文件是否存在
      const check = await chunkExist(fileHash, chunkHash, chunkIndex)
      if (check.data.status === 1) {
        // 分片已存在，跳过
        console.log(`分片 ${chunkIndex} 已存在，跳过`)
        uploadedCount++
        if (onProgress) {
          onProgress(Math.round((uploadedCount / totalChunks) * 100))
        }
        continue
      }

      console.log(`上传分片 ${chunkIndex + 1}/${totalChunks}...`)

      const formdata = new FormData()
      formdata.append('file', file)
      formdata.append('fileHash', fileHash)
      formdata.append('chunkHash', chunkHash)
      formdata.append('chunkIndex', chunkIndex)

      const res = await videoService(formdata)
      if (res.data.status !== 0) {
        throw new Error(`分片 ${chunkIndex} 上传失败: ${res.data.message}`)
      }

      uploadedCount++
      console.log(`分片 ${chunkIndex} 上传成功`)

      if (onProgress) {
        onProgress(Math.round((uploadedCount / totalChunks) * 100))
      }
    } catch (error) {
      console.error(`分片 ${chunkIndex} 上传失败:`, error)
      throw new Error(`分片 ${chunkIndex} 上传失败: ${error.message}`)
    }
  }

  console.log(`所有分片上传完成，共 ${uploadedCount} 个`)
}
