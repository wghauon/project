const CHUNK_SIZE = 1 * 1024 * 1024 // 定义分片大小
const THREAD_COUNT = navigator.hardwareConcurrency || 4 //获取cpu内核数
export function cutFile(file) {
  return new Promise((resolve) => {
    // 计算分片数量,向上取整
    const chunkCount = Math.ceil(file.size / CHUNK_SIZE)
    const threadChunkCount = Math.ceil(chunkCount / THREAD_COUNT) // 每个线程负责处理的分片数
    const result = []
    let finishCount = 0 // 线程完成数

    // 实际使用的线程数不能超过分片数
    const actualThreadCount = Math.min(THREAD_COUNT, chunkCount)

    for (let i = 0; i < actualThreadCount; i++) {
      // 创建一个线程,分配任务
      const worker = new Worker(new URL('../../public/work.js', import.meta.url), {
        type: 'module',
      })
      let start = i * threadChunkCount
      let end = (i + 1) * threadChunkCount
      if (end > chunkCount) {
        end = chunkCount
      }
      worker.postMessage({
        file,
        CHUNK_SIZE,
        startChunkIndex: start,
        endChunkIndex: end,
      })
      worker.onmessage = (e) => {
        for (let i = start; i < end; i++) {
          result[i] = e.data[i - start]
        }
        worker.terminate()
        finishCount++
        if (finishCount === actualThreadCount) {
          resolve(result)
        }
      }
    }
  })
}
