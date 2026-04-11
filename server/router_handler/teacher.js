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
    const { course_name, category_name, course_type, difficulty, description, hours, credit, createPerson, status, join_type, invite_code} = req.body
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
    const [result] = await db.execute('insert into courses (course_name, teacher_id, category_id, description, cover_image, difficulty, credit, hours, status, join_type, invite_code) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',[course_name, teacher_id, category_id, description, cover_image, difficulty, credit, hours, status, join_type || 1, invite_code || ''])
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
    if (courses.length < 1) { return res.send({ status: 0, message: '未查询到课程信息', data: [] })}
    res.send({ status: 0, message: '课程信息查询成功', data: courses})
  }
  catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 获取教师课程列表（简化版，用于下拉选择）
exports.getTeacherCourses = async (req, res) => {
  try {
    // 从token中获取教师ID
    const teacherId = req.auth?.user_id
    if (!teacherId) {
      return res.send({ status: 1, message: '未登录或token无效' })
    }
    
    const [courses] = await db.execute(
      'SELECT course_id, course_name FROM courses WHERE teacher_id = ? AND status = 2 ORDER BY created_at DESC',
      [teacherId]
    )
    res.send({ status: 0, message: '获取成功', data: courses })
  } catch (err) {
    res.send({ status: 1, message: err.message })
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

// 课程更新接口
exports.updateCourse = async (req, res) => {
  try {
    const { course_id, course_name, category_name, course_type, difficulty, description, hours, credit, start_time, end_time, join_type, invite_code, status, cover_image } = req.body
    
    if (!course_id) {
      return res.send({ status: 1, message: '缺少课程ID' })
    }
    
    // 查询课程分类ID
    let category_id = null
    const [category] = await db.execute('select * from course_categories where category_name = ?',[category_name])
    if (category.length > 0) {
      category_id = category[0].category_id
    } else {
      const [result] = await db.execute('insert into course_categories (category_name) values (?)',[category_name])
      category_id = result.insertId
    }
    
    // 处理封面图片
    let new_cover_image = cover_image
    if (req.file) {
      const protocol = req.protocol
      const host = req.get('host')
      new_cover_image = `${protocol}://${host}/uploads/img/${req.file.filename}`
    }
    
    // 更新课程表
    const [result] = await db.execute(
      `update courses set 
        course_name = ?, 
        category_id = ?, 
        description = ?, 
        cover_image = ?, 
        difficulty = ?, 
        credit = ?, 
        hours = ?, 
        status = ?,
        join_type = ?,
        invite_code = ?,
        start_time = ?,
        end_time = ?,
        updated_at = NOW()
      where course_id = ?`,
      [course_name, category_id, description, new_cover_image, difficulty, credit, hours, status || 0, join_type || 1, invite_code || '', start_time || null, end_time || null, course_id]
    )
    
    if (result.affectedRows !== 1) { 
      return res.send({ status: 1, message: '课程信息更新失败' }) 
    }
    
    res.send({ status: 0, message: '课程信息更新成功' })
  }
  catch (err) {
    res.send({ status: 1, message: err.message })
  }
}
// 视频列表查询接口
exports.videoList = async (req, res) => {
  try {
    const { course_id } = req.query
    if (!course_id) {
      return res.send({ status: 1, message: '缺少课程ID', data: [] })
    }
    const [list] = await db.execute(`
      SELECT 
        video_id,
        video_name,
        description,
        video_url,
        cover_image,
        duration,
        file_size,
        status,
        view_count,
        created_at
      FROM videos 
      WHERE course_id = ?
      ORDER BY created_at DESC
    `, [course_id])
    res.send({ status: 0, message: '查询成功', data: list })
  }
  catch (err) {
    res.send({ status: 1, message: err.message, data: [] })
  }
}
// 视频URL请求接口
exports.videoUrl = async (req, res) => {
  const { video_id } = req.query
  try {
    if (!video_id) {
      return res.send({ status: 1, message: '缺少视频ID', data: '' })
    }

    const [video] = await db.execute('SELECT * FROM videos WHERE video_id = ?', [video_id])
    if (video.length !== 1) {
      return res.send({ status: 1, message: '视频不存在', data: '' })
    }

    const videoData = video[0]

    // 检查视频URL是否存在
    if (!videoData.video_url) {
      return res.send({ status: 1, message: '视频URL不存在', data: '' })
    }

    // 构建完整的视频URL
    let fullVideoUrl = videoData.video_url

    // 如果URL不是以http开头，添加当前服务器的协议和主机名
    if (!fullVideoUrl.startsWith('http')) {
      const protocol = req.protocol
      const host = req.get('host')
      // 确保URL以/开头
      if (!fullVideoUrl.startsWith('/')) {
        fullVideoUrl = '/' + fullVideoUrl
      }
      fullVideoUrl = `${protocol}://${host}${fullVideoUrl}`
    }

    console.log('视频URL请求成功:', { video_id, video_url: fullVideoUrl })
    res.send({ status: 0, message: '视频URL请求成功', data: fullVideoUrl })
  }
  catch (err) {
    console.error('获取视频URL失败:', err)
    res.send({ status: 1, message: err.message || '获取视频URL失败', data: '' })
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
    res.send({ status: 0, message: '分片上传成功' })
  }
  catch (err) {
    res.send({ status: 1, message: err.message })
  }
}
// 合并文件接口
exports.chunkMerge = async (req, res) => {
  const { fileHash, course_id, video_name, description, chapter_id } = req.body
  console.log('合并请求参数:', { fileHash, course_id, video_name, description, chapter_id })

  // 参数校验
  if (!fileHash) {
    return res.send({ status: 1, message: '缺少文件哈希值(fileHash)' })
  }
  if (!course_id) {
    return res.send({ status: 1, message: '缺少课程ID(course_id)' })
  }
  if (!video_name) {
    return res.send({ status: 1, message: '缺少视频名称(video_name)' })
  }

  const chunkDir = path.join(__dirname,'..','uploads','video',`${fileHash}`) // 分片文件目录
  const mergeDir = path.join(__dirname,'..','uploads','video')

  // 使用文件哈希作为文件名，避免特殊字符问题
  const safeFileName = `${fileHash}.mp4`
  const mergeFilePath = path.join(mergeDir, safeFileName)

  // 获取协议,主机名和端口
  const protocol = req.protocol
  const host = req.get('host')
  // 构建视频URL
  const video_url = `${protocol}://${host}/uploads/video/${safeFileName}`

  try {
    // 确保合并目录存在
    await fs.ensureDir(mergeDir)

    // 检查分片目录是否存在
    if (!fs.existsSync(chunkDir)) {
      return res.send({ status: 1, message: '分片文件目录不存在' })
    }

    // 获取所有分片文件
    const allFiles = fs.readdirSync(chunkDir)
    const chunks = []
    // 正则提取索引
    const pattern = /_(\d+)\.part$/
    for(const filename of allFiles) {
      const match = filename.match(pattern)
      if (match) {
        const chunkIndex = parseInt(match[1], 10)
        chunks.push({ filePath: filename, chunkIndex })
      }
    }

    // 检查是否有分片文件
    if (chunks.length === 0) {
      return res.send({ status: 1, message: '没有找到分片文件' })
    }

    console.log(`找到 ${chunks.length} 个分片文件，开始合并...`)

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

    console.log('分片合并完成，保存到数据库...')

    // 获取该章节下已有视频数量，用于设置 video_no
    let video_no = 1
    if (chapter_id) {
      const [existingVideos] = await db.execute(
        'SELECT COUNT(*) as count FROM videos WHERE chapter_id = ?',
        [chapter_id]
      )
      video_no = (existingVideos[0].count || 0) + 1
    }

    // 视频表 - 设置默认状态为1(已发布)
    const [videos] = await db.execute(
      'INSERT INTO videos (course_id, chapter_id, video_name, description, video_url, status, video_no, created_at) VALUES (?, ?, ?, ?, ?, 1, ?, NOW())',
      [course_id, chapter_id || null, video_name, description || '', video_url, video_no]
    )
    if (videos.affectedRows !== 1) {
      return res.send({ status: 1, message: '视频信息录入失败' })
    }

    console.log('视频上传成功，video_id:', videos.insertId)
    res.send({ status: 0, message: '视频上传成功', data: { video_id: videos.insertId } })
  }
  catch (err) {
    console.error('合并文件失败:', err)
    res.send({ status: 1, message: err.message || '合并文件失败' })
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
    const [chapters] = await db.execute(
      'SELECT * FROM chapters WHERE course_id = ? ORDER BY chapter_no',
      [course_id]
    )
    
    // 获取每个章节的视频列表
    const chaptersWithVideos = await Promise.all(
      chapters.map(async (chapter) => {
        const [videos] = await db.execute(
          'SELECT video_id as id, video_name as title, video_no as video_order, duration, chapter_id FROM videos WHERE chapter_id = ? ORDER BY video_no',
          [chapter.chapter_id]
        )
        return {
          ...chapter,
          videos: videos || []
        }
      })
    )
    
    res.send({ status: 0, message: '获取成功', data: chaptersWithVideos })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 添加章节
exports.addChapter = async (req, res) => {
  try {
    const { course_id, chapter_name, chapter_no, description, is_required, status } = req.body

    if (!course_id || !chapter_name || !chapter_no) {
      return res.send({ status: 1, message: '缺少必要参数' })
    }

    const [result] = await db.execute(
      'INSERT INTO chapters (course_id, chapter_name, chapter_no, description, is_required, status, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [course_id, chapter_name, chapter_no, description || '', is_required !== undefined ? is_required : 1, status !== undefined ? status : 1]
    )
    res.send({ status: 0, message: '添加成功', data: { chapter_id: result.insertId } })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 获取章节详情
exports.getChapterDetail = async (req, res) => {
  try {
    const { chapterId } = req.params
    const [chapters] = await db.execute(
      'SELECT * FROM chapters WHERE chapter_id = ?',
      [chapterId]
    )
    if (chapters.length === 0) {
      return res.send({ status: 1, message: '章节不存在' })
    }
    res.send({ status: 0, message: '获取成功', data: chapters[0] })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 更新章节
exports.updateChapter = async (req, res) => {
  try {
    const { chapterId } = req.params
    const { chapter_name, chapter_no, description, is_required, status } = req.body

    // 构建更新字段
    const updates = []
    const values = []

    if (chapter_name !== undefined) {
      updates.push('chapter_name = ?')
      values.push(chapter_name)
    }
    if (chapter_no !== undefined) {
      updates.push('chapter_no = ?')
      values.push(chapter_no)
    }
    if (description !== undefined) {
      updates.push('description = ?')
      values.push(description)
    }
    if (is_required !== undefined) {
      updates.push('is_required = ?')
      values.push(is_required)
    }
    if (status !== undefined) {
      updates.push('status = ?')
      values.push(status)
    }

    if (updates.length === 0) {
      return res.send({ status: 1, message: '没有需要更新的字段' })
    }

    values.push(chapterId)
    const sql = `UPDATE chapters SET ${updates.join(', ')} WHERE chapter_id = ?`
    await db.execute(sql, values)

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

// 更新视频信息
exports.updateVideo = async (req, res) => {
  try {
    const { videoId } = req.params
    const { video_name, description, chapter_id, video_no, status, allow_comment, allow_download, permission } = req.body

    if (!videoId) {
      return res.send({ status: 1, message: '缺少视频ID' })
    }

    // 构建更新字段
    const updates = []
    const values = []

    if (video_name !== undefined) {
      updates.push('video_name = ?')
      values.push(video_name)
    }
    if (description !== undefined) {
      updates.push('description = ?')
      values.push(description)
    }
    if (chapter_id !== undefined) {
      updates.push('chapter_id = ?')
      values.push(chapter_id)
    }
    if (video_no !== undefined) {
      updates.push('video_no = ?')
      values.push(video_no)
    }
    if (status !== undefined) {
      updates.push('status = ?')
      values.push(status)
    }
    if (allow_comment !== undefined) {
      updates.push('allow_comment = ?')
      values.push(allow_comment ? 1 : 0)
    }
    if (allow_download !== undefined) {
      updates.push('allow_download = ?')
      values.push(allow_download ? 1 : 0)
    }
    if (permission !== undefined) {
      updates.push('permission = ?')
      values.push(permission)
    }

    if (updates.length === 0) {
      return res.send({ status: 1, message: '没有需要更新的字段' })
    }

    values.push(videoId)
    const sql = `UPDATE videos SET ${updates.join(', ')}, updated_at = NOW() WHERE video_id = ?`
    await db.execute(sql, values)

    res.send({ status: 0, message: '更新成功' })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 获取视频详情
exports.getVideoDetail = async (req, res) => {
  try {
    const { video_id } = req.query

    if (!video_id) {
      return res.send({ status: 1, message: '缺少视频ID' })
    }

    const [videos] = await db.execute(`
      SELECT 
        video_id,
        video_name,
        description,
        video_url,
        cover_image,
        duration,
        file_size,
        status,
        chapter_id,
        video_no,
        view_count,
        allow_comment,
        allow_download,
        permission,
        created_at,
        updated_at
      FROM videos 
      WHERE video_id = ?
    `, [video_id])

    if (videos.length === 0) {
      return res.send({ status: 1, message: '视频不存在' })
    }

    res.send({ status: 0, message: '获取成功', data: videos[0] })
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
        ce.status,
        ce.enrolled_at as join_time,
        ce.progress,
        0 as avg_score
      FROM users u
      INNER JOIN course_enrollments ce ON u.user_id = ce.student_id
      WHERE ce.course_id = ?
      ORDER BY ce.enrolled_at DESC
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
      'UPDATE course_enrollments SET status = 3 WHERE course_id = ? AND student_id = ?',
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
      'UPDATE course_enrollments SET status = 1 WHERE course_id = ? AND student_id = ?',
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

// ==================== 教师统计数据接口 ====================

// 获取教师统计数据
exports.getTeacherStats = async (req, res) => {
  try {
    const { teacher_id } = req.query
    
    if (!teacher_id) {
      return res.send({ status: 1, message: '缺少教师ID' })
    }

    // 1. 获取在授课程数
    const [courseResult] = await db.execute(`
      SELECT COUNT(*) as count FROM courses 
      WHERE teacher_id = ? AND status = 2
    `, [teacher_id])
    const courseCount = courseResult[0].count

    // 2. 获取学生总数（该教师所有课程的学生数）
    const [studentResult] = await db.execute(`
      SELECT COUNT(DISTINCT ce.student_id) as count
      FROM course_enrollments ce
      INNER JOIN courses c ON ce.course_id = c.course_id
      WHERE c.teacher_id = ? AND ce.status = 1
    `, [teacher_id])
    const studentCount = studentResult[0].count

    // 3. 获取待批改作业数（实验提交表中status=0的记录）
    const [homeworkResult] = await db.execute(`
      SELECT COUNT(*) as count 
      FROM experiment_submissions es
      INNER JOIN experiments e ON es.experiment_id = e.experiment_id
      INNER JOIN courses c ON e.course_id = c.course_id
      WHERE c.teacher_id = ? AND es.status = 0
    `, [teacher_id])
    const pendingHomework = homeworkResult[0].count

    // 4. 获取新讨论数（最近7天的讨论）
    const [discussionResult] = await db.execute(`
      SELECT COUNT(*) as count 
      FROM discussions d
      INNER JOIN courses c ON d.course_id = c.course_id
      WHERE c.teacher_id = ? AND d.status = 1 
      AND d.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `, [teacher_id])
    const newDiscussions = discussionResult[0].count

    res.send({
      status: 0,
      message: '获取成功',
      data: {
        course_count: courseCount,
        student_count: studentCount,
        pending_homework: pendingHomework,
        new_discussions: newDiscussions
      }
    })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// ==================== 资料管理接口 ====================

// 获取课程资料列表
exports.getMaterials = async (req, res) => {
  try {
    const { courseId } = req.params
    
    if (!courseId) {
      return res.send({ status: 1, message: '缺少课程ID' })
    }

    const [materials] = await db.execute(`
      SELECT 
        m.material_id,
        m.file_name,
        m.file_url,
        m.file_size,
        m.file_type,
        m.description,
        m.download_count,
        m.status,
        m.created_at,
        u.username as uploader_name
      FROM materials m
      LEFT JOIN users u ON m.uploaded_by = u.user_id
      WHERE m.course_id = ?
      ORDER BY m.created_at DESC
    `, [courseId])

    res.send({ status: 0, message: '获取成功', data: materials })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 上传资料
exports.uploadMaterial = async (req, res) => {
  try {
    if (!req.file) {
      return res.send({ status: 1, message: '未选择文件' })
    }

    const { course_id, description } = req.body
    
    if (!course_id) {
      return res.send({ status: 1, message: '缺少课程ID' })
    }

    // 获取上传者ID
    const uploadedBy = req.auth?.user_id

    // 获取协议,主机名和端口
    const protocol = req.protocol
    const host = req.get('host')
    
    // 构建完整的文件URL
    const fileUrl = `${protocol}://${host}/uploads/file/${req.file.filename}`

    // 获取文件信息
    const fileName = Buffer.from(req.file.originalname, 'latin1').toString('utf8')
    const fileSize = req.file.size
    const fileType = req.file.mimetype

    // 插入数据库
    const [result] = await db.execute(`
      INSERT INTO materials 
      (course_id, file_name, file_url, file_size, file_type, description, uploaded_by, status, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW())
    `, [course_id, fileName, fileUrl, fileSize, fileType, description || '', uploadedBy])

    if (result.affectedRows !== 1) {
      return res.send({ status: 1, message: '资料上传失败' })
    }

    res.send({ 
      status: 0, 
      message: '资料上传成功',
      data: { material_id: result.insertId }
    })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 更新资料信息
exports.updateMaterial = async (req, res) => {
  try {
    const { materialId } = req.params
    const { file_name, description, status } = req.body

    if (!materialId) {
      return res.send({ status: 1, message: '缺少资料ID' })
    }

    await db.execute(`
      UPDATE materials 
      SET file_name = ?, description = ?, status = ?
      WHERE material_id = ?
    `, [file_name, description, status, materialId])

    res.send({ status: 0, message: '更新成功' })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 删除资料
exports.deleteMaterial = async (req, res) => {
  try {
    const { materialId } = req.params

    if (!materialId) {
      return res.send({ status: 1, message: '缺少资料ID' })
    }

    // 先获取文件URL
    const [materials] = await db.execute(
      'SELECT file_url FROM materials WHERE material_id = ?',
      [materialId]
    )

    if (materials.length > 0) {
      // 删除物理文件
      const fileUrl = materials[0].file_url
      const fileName = fileUrl.split('/').pop()
      const filePath = path.join(__dirname, '..', 'uploads', 'file', fileName)
      
      try {
        await fs.remove(filePath)
      } catch (e) {
        console.log('文件删除失败或不存在:', e.message)
      }
    }

    // 删除数据库记录
    await db.execute('DELETE FROM materials WHERE material_id = ?', [materialId])

    res.send({ status: 0, message: '删除成功' })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}