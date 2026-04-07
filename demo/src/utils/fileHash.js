import SparkMD5 from 'spark-md5'
export function createFileHash(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    const spark = new SparkMD5.ArrayBuffer()
    reader.onload = (e) => {
      spark.append(e.target.result)
      resolve(spark.end())
    }
    reader.onerror = (e) => {
      reject(new Error('读取文件失败'))
    }
    reader.readAsArrayBuffer(file)
  })
}
