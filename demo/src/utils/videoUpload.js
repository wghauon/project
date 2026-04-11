import { chunkExist, videoService, mergeService } from '@/api/video'
import { cutFile } from '@/utils/cutFile'
import { createFileHash } from '@/utils/fileHash'

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

  const fileHash = await createFileHash(file) // 整体文件hash
  console.log('文件哈希:', fileHash)

  const chunks = await cutFile(file)
  console.log('文件分片数量:', chunks.length)

  // 分片上传
  await chunkUpload(chunks, fileHash, onProgress)

  // 分片合并
  console.log('分片上传完成，开始合并...')
  const res = await mergeService(fileHash, video_name, description, course_id, chapter_id)
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
