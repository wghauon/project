import { chunkExist, videoService, mergeService } from '@/api/video'
import { cutFile } from '@/utils/cutFile'
import { createFileHash } from '@/utils/fileHash'
import { useTeacherStore } from '@/stores/teacher'
const teacherStore = useTeacherStore()
export async function videUpload(file, video_name, description) {
  if (!file) {
    return console.log('未选择文件')
  }
  const fileHash = await createFileHash(file) // 整体文件hash
  const chunks = await cutFile(file)
  // 分片上传
  await chunkUpload(chunks, fileHash)
  // 分片合并
  console.log(teacherStore.course_id)
  const res = await mergeService(fileHash, video_name, description, teacherStore.course_id)
  console.log(res)
}
async function chunkUpload(chunks, fileHash) {
  let percentage = 0
  for (let i = 0; i < chunks.length; i++) {
    const file = chunks[i].blob
    const chunkHash = chunks[i].hash
    const chunkIndex = chunks[i].index
    // 检查分片文件是否存在
    const check = await chunkExist(fileHash, chunkHash, chunkIndex)
    if (check.data.status === 1) {
      continue
    }
    const formdata = new FormData()
    formdata.append('file', file)
    formdata.append('fileHash', fileHash)
    formdata.append('chunkHash', chunkHash)
    formdata.append('chunkIndex', chunkIndex)
    const res = await videoService(formdata)
    percentage = res.data.finishChunk / chunks.length
    console.log(res.data)
  }
}
