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

// ==================== 章节管理接口 ====================

// 获取章节列表
exports.getChapters = async (req, res) => {
  try {
    // 支持从路由参数或查询参数获取 course_id
    const course_id = req.params.courseId || req.query.course_id
    if (!course_id) {
      return res.send({ status: 1, message: '缺少课程ID' })
    }
    const [rows] = await db.execute(
      'SELECT * FROM chapters WHERE course_id = ? ORDER BY chapter_no',
      [course_id]
    )
    res.send({ status: 0, message: '获取成功', data: rows })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 添加章节
exports.addChapter = async (req, res) => {
  try {
    const { course_id, chapter_name, chapter_no } = req.body
    const [result] = await db.execute(
      'INSERT INTO chapters (course_id, chapter_name, chapter_no, created_at) VALUES (?, ?, ?, NOW())',
      [course_id, chapter_name, chapter_no]
    )
    res.send({ status: 0, message: '添加成功', data: { chapter_id: result.insertId } })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 更新章节
exports.updateChapter = async (req, res) => {
  try {
    const { chapterId } = req.params
    const { chapter_name, chapter_no } = req.body
    await db.execute(
      'UPDATE chapters SET chapter_name = ?, chapter_no = ? WHERE chapter_id = ?',
      [chapter_name, chapter_no, chapterId]
    )
    res.send({ status: 0, message: '更新成功' })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 删除章节
exports.deleteChapter = async (req, res) => {
  try {
    const { chapterId } = req.params
    await db.execute('DELETE FROM chapters WHERE chapter_id = ?', [chapterId])
    res.send({ status: 0, message: '删除成功' })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 删除视频
exports.deleteVideo = async (req, res) => {
  try {
    const { videoId } = req.params
    await db.execute('DELETE FROM videos WHERE video_id = ?', [videoId])
    res.send({ status: 0, message: '删除成功' })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// ==================== 学生管理接口 ====================

// 获取课程学生列表
exports.getCourseStudents = async (req, res) => {
  try {
    const { courseId } = req.params
    const [rows] = await db.execute(`
      SELECT 
        u.user_id,
        u.username,
        u.real_name,
        u.student_no,
        u.email,
        u.department,
        cs.status,
        cs.join_time,
        cs.progress,
        cs.avg_score
      FROM users u
      INNER JOIN course_students cs ON u.user_id = cs.student_id
      WHERE cs.course_id = ?
      ORDER BY cs.join_time DESC
    `, [courseId])
    res.send({ status: 0, message: '获取成功', data: rows })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 移除学生
exports.removeStudent = async (req, res) => {
  try {
    const { courseId, studentId } = req.params
    await db.execute(
      'UPDATE course_students SET status = 0 WHERE course_id = ? AND student_id = ?',
      [courseId, studentId]
    )
    res.send({ status: 0, message: '移除成功' })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 恢复学生
exports.restoreStudent = async (req, res) => {
  try {
    const { courseId, studentId } = req.params
    await db.execute(
      'UPDATE course_students SET status = 1 WHERE course_id = ? AND student_id = ?',
      [courseId, studentId]
    )
    res.send({ status: 0, message: '恢复成功' })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 获取学生学习进度
exports.getStudentProgress = async (req, res) => {
  try {
    const { courseId, studentId } = req.params
    
    // 获取课程总视频数
    const [totalVideos] = await db.execute(`
      SELECT COUNT(*) as total FROM videos v
      INNER JOIN chapters c ON v.chapter_id = c.chapter_id
      WHERE c.course_id = ? AND v.status = 1
    `, [courseId])
    
    // 获取学生已完成的视频数
    const [completedVideos] = await db.execute(`
      SELECT COUNT(*) as completed FROM video_progress vp
      INNER JOIN videos v ON vp.video_id = v.video_id
      INNER JOIN chapters c ON v.chapter_id = c.chapter_id
      WHERE c.course_id = ? AND vp.student_id = ? AND vp.is_completed = 1
    `, [courseId, studentId])
    
    // 获取学生考试成绩
    const [examScores] = await db.execute(`
      SELECT AVG(score) as avg_score, COUNT(*) as exam_count
      FROM exam_records
      WHERE student_id = ? AND exam_id IN (
        SELECT exam_id FROM exams WHERE course_id = ?
      )
    `, [studentId, courseId])
    
    const total = totalVideos[0].total
    const completed = completedVideos[0].completed
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0
    
    res.send({
      status: 0,
      message: '获取成功',
      data: {
        total_videos: total,
        completed_videos: completed,
        progress: progress,
        avg_score: examScores[0].avg_score || 0,
        exam_count: examScores[0].exam_count || 0
      }
    })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}