import SparkMD5 from 'spark-md5'
export function createChunk(file, index, chunkSize) {
  return new Promise((resolve) => {
    const start = index * chunkSize // 开始字节
    const end = start + chunkSize // 结束字节
    const spark = new SparkMD5.ArrayBuffer()
    const fileReader = new FileReader()
    const blob = file.slice(start, end)
    // 读取切片文件后触发
    fileReader.onload = (e) => {
      spark.append(e.target.result)
      resolve({
        start,
        end,
        index,
        hash: spark.end(),
        blob, // 分片文件对象
      })
    }
    fileReader.readAsArrayBuffer(blob)
  })
}
