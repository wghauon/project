// 导入数据库操作模块
const db = require('../db/index')
// 导入fs-extra
const fs = require('fs-extra')
// 导入path
const path = require('path')
// 导入spark-md5
const SparkMD5 = require('spark-md5')
// 课程信息上传接口
exports.course = async (req, res) => {
  try {
    // 检查图片是否上传
    if (!req.file) { return res.send({ message: '未选择图片'})}
    // 检查表单必要项是否填写
    const { course_name, category_name, course_type, difficulty, description, hours, credit, createPerson, status} = req.body
    console.log({ course_name, category_name, course_type, difficulty, description, hours, credit, createPerson})
    if (!course_name || !category_name || !course_type || !difficulty || !description || !hours || !credit) {return res.send({ message: '课程信息填写不完全'})}
    // 获取协议,主机名和端口
    const protocol = req.protocol
    const host = req.get('host')
    // 构建完整的图片URL
    const cover_image = `${protocol}://${host}/uploads/img/${req.file.filename}`
    // 查询课程分类ID
    let category_id = null
    const [category] = await db.execute('select * from course_categories where category_name = ?',[category_name])
    if (category.length > 0) {
      category_id = category[0].category_id
    }
    else {
      const [result] = await db.execute('insert into course_categories (category_name) values (?)',[category_name])
      category_id = result.insertId
    }
    // 查询创建人ID
    let teacher_id = null
    const [users] = await db.execute('select * from users where username = ?',[createPerson])
    if (users.length > 0) {
      teacher_id = users[0].user_id
    }
    else {
      return res.send({ message: '没有查询到教师ID,创建课程失败'})
    }
    // 课程表
    const [result] = await db.execute('insert into courses (course_name, teacher_id, category_id, description, cover_image, difficulty, credit, hours, status) values (?, ?, ?, ?, ?, ?, ?, ?, ?)',[course_name, teacher_id, category_id, description, cover_image, difficulty, credit, hours, status])
    if (result.affectedRows !== 1) { return res.send({ message: '课程信息录入失败'}) }
    res.send({ message: '课程信息录入成功' })
  }
  catch (err) {
    res.send({ message: err.message})
  }
}
// 课程列表查询接口
exports.courseListSearch = async (req, res) => {
  try {
    const { user_id } = req.query
    // 查询课程表
    const [courses] = await db.execute('select * from courses where teacher_id = ?',[user_id])
    if (courses.length < 1) { return res.send({ message: '未查询到课程信息'})}
    res.send({ message: '课程信息查询成功', data: courses})
  }
  catch (err) {
    res.send({ message: err.message })
  }
}
// 课程详情信息查询接口
exports.courseDetail = async (req, res) => {
  try {
    const { course_id } = req.query
    const [course] = await db.execute('select * from courses where course_id = ?',[course_id])
    if (course.length !== 1) { return res.send({ message: '课程信息查询失败'})}
    res.send({message: '课程信息查询成功', data: course[0]}) 
  }
  catch (err) {
    res.send({ message: err.message })
  }
}
// 视频列表查询接口
exports.videoList = async (req, res) => {
  try {
    const { course_id } = req.query
    const [list] = await db.execute('select * from videos where course_id = ?',[course_id])
    if(list.length < 1) {
      return res.send({ message: '未查询到课程视频'})
    }
    res.send({ data: list, message: '课程视频查询成功'})
  }
  catch (err) {
    res.send({ message: err.message })
  }
}
// 视频URL请求接口
exports.videoUrl = async (req, res) => {
  const { video_id } = req.query
  try {
    const [video] = await db.execute('select * from videos where video_id = ?',[video_id])
    if (video.length !== 1) {
      return res.send({ message: '视频请求错误'})
    }
    res.send({ data: video[0].video_url, message: '视频URL请求成功'})
  }
  catch (err) {

  }
}
// 检查分片文件是否存在
exports.chunkExist = async(req, res) => {
  const { fileHash, chunkHash, chunkIndex } = req.query
  const chunkFilename = `${chunkHash}_${chunkIndex}.part`
  const chunkPath = path.join(__dirname,'..','uploads','video',`${fileHash}`,chunkFilename)
  try {
    const exists = await fs.pathExists(chunkPath)
    if (exists) {
      res.send({ status: 1,message: '分片已存在'})
    }
    else {
      res.send({ status: 0,message: '分片不存在'})
    }
  }
  catch (err) {
    res.send({ message: err.message })
  }
}
// 分片上传接口
exports.chunk = async (req, res) => {
  try {
    const chunkFile = req.file // 分片文件
    const { fileHash, chunkHash, chunkIndex } = req.body
    const chunkFilename = `${chunkHash}_${chunkIndex}.part`
    const chunkPath = path.join(__dirname,'..','uploads','video',`${fileHash}`,chunkFilename)
    await fs.move(chunkFile.path,chunkPath)
    finishChunk++
    res.send({ message: '分片上传成功' })
  }
  catch (err) {
    res.send({ message: err.message})
  }
}
// 合并文件接口
exports.chunkMerge = async (req, res) => {
  const { fileHash, course_id, video_name, description} = req.body
  console.log({ fileHash, course_id, video_name, description})
  const chunkDir = path.join(__dirname,'..','uploads','video',`${fileHash}`) // 分片文件目录
  const mergeDir = path.join(__dirname,'..','uploads','video')
  const mergeFilePath = path.join(mergeDir, `${video_name}.mp4`)
  // 获取协议,主机名和端口
  const protocol = req.protocol
  const host = req.get('host')
  // 构建视频URL
  const video_url = `${protocol}://${host}/uploads/video/${video_name}.mp4`
  try {
    // 检查分片目录是否存在
    if (!fs.existsSync(chunkDir)) { return res.send({ message: '分片文件不存在'})}
    // 获取所有分片文件
    const allFiles = fs.readdirSync(chunkDir)
    const chunks = []
    // 正则提取索引
    const pattern = /_(\d+)\.part$/ 
    for(const filename of allFiles) {
      const match = filename.match(pattern)
      const chunkIndex = parseInt(match[1], 10)
      chunks.push({ filePath: filename, chunkIndex })
    }
    // 排序分片文件
    chunks.sort((fileA,fileB) => {
      return fileA.chunkIndex - fileB.chunkIndex
    })
    // 修改为完整文件路径
    chunks.forEach((e) => {
      e.filePath = path.join(chunkDir,e.filePath)
    })
    // 创建可写流
    const writeStream = fs.createWriteStream(mergeFilePath);
    // 使用流管道逐个合并文件
    await mergeChunksSequentially(chunks, writeStream)
    // 视频表
    const [videos] = await db.execute('insert into videos (course_id, video_name, description, video_url) values (?, ?, ?, ?)',[course_id, video_name, description, video_url])
    if (videos.affectedRows !== 1) { return res.send({ message: '视频信息录入失败'})}
    res.send({ message: '视频上传成功'})
  }
  catch (err) {
    res.send({ message: err.message})
  }
}
// 顺序合并分片文件的辅助函数
function mergeChunksSequentially(chunks, writeStream) {
  return new Promise((resolve, reject) => {
    // 关闭管道流
    const processNextChunk = (index) => {
      if (index >= chunks.length) {
        writeStream.end()
        return resolve()
      }
      const chunkPath = chunks[index].filePath
      const readStream = fs.createReadStream(chunkPath)
      readStream.on('error',(err) => {
        reject(err)
      })
      readStream.on('end',() => {
        processNextChunk(index + 1)
      })
      readStream.pipe(writeStream, { end: false })
    }
    // 开始处理第一个分片
    processNextChunk(0)
    // 监听写入完成事件
    writeStream.on('finish', resolve)
    writeStream.on('error', reject)
  })
}