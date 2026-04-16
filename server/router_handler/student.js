// 学生端路由处理函数
const db = require('../db/index')

// 获取公开课程列表
exports.getCourseList = async (req, res) => {
  try {
    const { category, difficulty, keyword } = req.query
    let sql = `
      SELECT c.*, u.real_name as teacher_name, u.department,
             (SELECT COUNT(*) FROM course_enrollments WHERE course_id = c.course_id AND status = 1) as student_count
      FROM courses c
      LEFT JOIN users u ON c.teacher_id = u.user_id
      WHERE c.status = 2 AND c.join_type = 1
    `
    const params = []
    
    if (category) {
      sql += ' AND c.category_id = ?'
      params.push(category)
    }
    if (difficulty) {
      sql += ' AND c.difficulty = ?'
      params.push(difficulty)
    }
    if (keyword) {
      sql += ' AND (c.course_name LIKE ? OR c.description LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`)
    }
    
    sql += ' ORDER BY c.created_at DESC'
    
    const [rows] = await db.execute(sql, params)
    res.send({ status: 0, message: '获取成功', data: rows })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 获取学生已加入的课程
exports.getMyCourses = async (req, res) => {
  try {
    const studentId = req.auth.user_id
    const [rows] = await db.execute(`
      SELECT c.*, ce.progress, ce.status as enrollment_status,
             u.real_name as teacher_name, u.department
      FROM course_enrollments ce
      JOIN courses c ON ce.course_id = c.course_id
      LEFT JOIN users u ON c.teacher_id = u.user_id
      WHERE ce.student_id = ? AND ce.status = 1
      ORDER BY ce.enrolled_at DESC
    `, [studentId])
    res.send({ status: 0, message: '获取成功', data: rows })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 加入课程
exports.joinCourse = async (req, res) => {
  try {
    const { course_id, invite_code } = req.body
    const studentId = req.auth.user_id
    
    // 检查课程是否存在
    const [courses] = await db.execute('SELECT * FROM courses WHERE course_id = ?', [course_id])
    if (courses.length === 0) {
      return res.send({ status: 1, message: '课程不存在' })
    }
    
    const course = courses[0]
    
    // 检查加入权限
    if (course.join_type === 4) {
      return res.send({ status: 1, message: '该课程暂不开放加入' })
    }
    if (course.join_type === 3 && course.invite_code !== invite_code) {
      return res.send({ status: 1, message: '邀请码错误' })
    }
    
    // 检查是否已加入
    const [enrollments] = await db.execute(
      'SELECT * FROM course_enrollments WHERE course_id = ? AND student_id = ?',
      [course_id, studentId]
    )
    if (enrollments.length > 0) {
      return res.send({ status: 1, message: '您已加入该课程' })
    }
    
    // 加入课程
    const status = course.join_type === 1 ? 1 : 0 // 公开课程直接通过，其他需要审核
    await db.execute(
      'INSERT INTO course_enrollments (course_id, student_id, status, enrolled_at) VALUES (?, ?, ?, NOW())',
      [course_id, studentId, status]
    )
    
    res.send({ status: 0, message: status === 1 ? '加入成功' : '申请已提交，等待审核' })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 获取课程详情
exports.getCourseDetail = async (req, res) => {
  try {
    const { courseId } = req.params
    const [rows] = await db.execute(`
      SELECT c.*, u.real_name as teacher_name, u.department,
             cc.category_name,
             (SELECT COUNT(*) FROM course_enrollments WHERE course_id = c.course_id AND status = 1) as student_count
      FROM courses c
      LEFT JOIN users u ON c.teacher_id = u.user_id
      LEFT JOIN course_categories cc ON c.category_id = cc.category_id
      WHERE c.course_id = ?
    `, [courseId])
    
    if (rows.length === 0) {
      return res.send({ status: 1, message: '课程不存在' })
    }
    
    res.send({ status: 0, message: '获取成功', data: rows[0] })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 获取课程章节列表
exports.getChapters = async (req, res) => {
  try {
    const { courseId } = req.params
    const [rows] = await db.execute(`
      SELECT * FROM chapters 
      WHERE course_id = ? AND status = 1 
      ORDER BY chapter_no ASC
    `, [courseId])
    res.send({ status: 0, message: '获取成功', data: rows })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 获取视频列表
exports.getVideos = async (req, res) => {
  try {
    const { courseId } = req.params
    const [rows] = await db.execute(`
      SELECT v.*, ch.chapter_name
      FROM videos v
      LEFT JOIN chapters ch ON v.chapter_id = ch.chapter_id
      WHERE v.course_id = ? AND v.status = 1
      ORDER BY ch.chapter_no ASC, v.video_no ASC
    `, [courseId])
    res.send({ status: 0, message: '获取成功', data: rows })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 获取视频详情
exports.getVideoDetail = async (req, res) => {
  try {
    const { videoId } = req.params
    const studentId = req.auth.user_id
    
    const [rows] = await db.execute(`
      SELECT v.*, ch.chapter_name
      FROM videos v
      LEFT JOIN chapters ch ON v.chapter_id = ch.chapter_id
      WHERE v.video_id = ?
    `, [videoId])
    
    if (rows.length === 0) {
      return res.send({ status: 1, message: '视频不存在' })
    }
    
    // 获取学习进度
    const [progress] = await db.execute(
      'SELECT * FROM video_progress WHERE video_id = ? AND student_id = ?',
      [videoId, studentId]
    )
    
    const data = rows[0]
    data.progress = progress.length > 0 ? progress[0] : null
    
    res.send({ status: 0, message: '获取成功', data })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 更新视频学习进度
exports.updateVideoProgress = async (req, res) => {
  try {
    const { video_id, current_time, duration, is_completed } = req.body
    const studentId = req.auth.user_id
    
    console.log('收到进度更新请求:', { video_id, current_time, duration, is_completed, studentId })

    // 参数校验
    if (!video_id || !studentId) {
      console.error('参数缺失:', { video_id, studentId })
      return res.send({ status: 1, message: '参数缺失: video_id 或 student_id 为空' })
    }

    // 防止除以零错误
    const safeDuration = duration > 0 ? duration : 1
    const safeCurrentTime = current_time >= 0 ? current_time : 0
    
    // 如果标记为完成，进度为100%，否则计算百分比
    const progressPercent = is_completed 
      ? 100 
      : Math.min(100, Math.round((safeCurrentTime / safeDuration) * 100))
    
    console.log('准备更新进度:', { video_id, studentId, safeCurrentTime, safeDuration, progressPercent, is_completed })
    
    // 检查是否已有记录
    const [existing] = await db.execute(
      'SELECT * FROM video_progress WHERE video_id = ? AND student_id = ?',
      [video_id, studentId]
    )
    
    console.log('查询现有记录:', existing.length > 0 ? '找到记录' : '未找到记录')
    
    if (existing.length > 0) {
      const [updateResult] = await db.execute(`
        UPDATE video_progress 
        SET \`current_time\` = ?, \`duration\` = ?, \`progress_percent\` = ?, \`is_completed\` = ?, 
            \`watch_count\` = \`watch_count\` + 1, \`last_watch_at\` = NOW()
        WHERE \`video_id\` = ? AND \`student_id\` = ?
      `, [safeCurrentTime, safeDuration, progressPercent, is_completed ? 1 : 0, video_id, studentId])
      console.log('UPDATE结果:', updateResult)
    } else {
      const [insertResult] = await db.execute(`
        INSERT INTO video_progress (\`video_id\`, \`student_id\`, \`current_time\`, \`duration\`, \`progress_percent\`, \`is_completed\`, \`watch_count\`, \`last_watch_at\`, \`created_at\`)
        VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
      `, [video_id, studentId, safeCurrentTime, safeDuration, progressPercent, is_completed ? 1 : 0])
      console.log('INSERT结果:', insertResult)
    }
    
    // 更新课程总进度
    await updateCourseProgress(studentId, video_id)
    
    res.send({ status: 0, message: '进度更新成功' })
  } catch (err) {
    console.error('更新进度失败:', err)
    res.send({ status: 1, message: err.message })
  }
}

// 更新课程总进度
async function updateCourseProgress(studentId, videoId) {
  try {
    // 获取视频所属课程ID
    const [videos] = await db.execute(
      'SELECT course_id FROM videos WHERE video_id = ?',
      [videoId]
    )
    if (videos.length === 0) return
    
    const courseId = videos[0].course_id
    
    // 获取课程所有视频
    const [courseVideos] = await db.execute(
      'SELECT video_id FROM videos WHERE course_id = ? AND status = 1',
      [courseId]
    )
    
    if (courseVideos.length === 0) return
    
    // 获取学生已完成视频数量
    const videoIds = courseVideos.map(v => v.video_id)
    const placeholders = videoIds.map(() => '?').join(',')
    
    const [completedVideos] = await db.execute(
      `SELECT COUNT(*) as count FROM video_progress 
       WHERE student_id = ? AND video_id IN (${placeholders}) AND is_completed = 1`,
      [studentId, ...videoIds]
    )
    
    // 计算课程进度百分比
    const completedCount = completedVideos[0].count
    const totalCount = courseVideos.length
    const courseProgress = Math.round((completedCount / totalCount) * 100)
    
    // 更新选课记录中的进度
    await db.execute(
      'UPDATE course_enrollments SET progress = ? WHERE course_id = ? AND student_id = ?',
      [courseProgress, courseId, studentId]
    )
  } catch (err) {
    console.error('更新课程进度失败:', err)
  }
}

// 获取课程学习进度
exports.getCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params
    const studentId = req.auth.user_id
    
    // 获取课程总体进度
    const [enrollment] = await db.execute(
      'SELECT progress FROM course_enrollments WHERE course_id = ? AND student_id = ? AND status = 1',
      [courseId, studentId]
    )
    
    if (enrollment.length === 0) {
      return res.send({ status: 1, message: '未找到选课记录' })
    }
    
    const courseProgress = enrollment[0].progress || 0
    
    // 获取所有视频及其学习进度
    const [videos] = await db.execute(`
      SELECT 
        v.video_id,
        v.video_name,
        v.duration,
        vp.progress_percent,
        vp.is_completed,
        vp.current_time,
        vp.watch_count
      FROM videos v
      LEFT JOIN video_progress vp ON v.video_id = vp.video_id AND vp.student_id = ?
      WHERE v.course_id = ? AND v.status = 1
      ORDER BY v.video_no ASC
    `, [studentId, courseId])
    
    // 统计信息
    const totalVideos = videos.length
    const completedVideos = videos.filter(v => v.is_completed).length
    const inProgressVideos = videos.filter(v => v.progress_percent > 0 && !v.is_completed).length
    
    res.send({
      status: 0,
      message: '获取成功',
      data: {
        course_progress: courseProgress,
        total_videos: totalVideos,
        completed_videos: completedVideos,
        in_progress_videos: inProgressVideos,
        videos: videos
      }
    })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 获取视频评论
exports.getComments = async (req, res) => {
  try {
    const { videoId } = req.params
    const [rows] = await db.execute(`
      SELECT c.*, u.real_name, u.avatar
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.user_id
      WHERE c.video_id = ? AND c.status = 1 AND c.parent_id IS NULL
      ORDER BY c.created_at DESC
    `, [videoId])
    res.send({ status: 0, message: '获取成功', data: rows })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 发表评论
exports.addComment = async (req, res) => {
  try {
    const { video_id, content, parent_id } = req.body
    const userId = req.auth.user_id
    
    const [result] = await db.execute(
      'INSERT INTO comments (video_id, user_id, parent_id, content, created_at) VALUES (?, ?, ?, ?, NOW())',
      [video_id, userId, parent_id || null, content]
    )
    
    res.send({ status: 0, message: '评论成功', data: { comment_id: result.insertId } })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 点赞视频
exports.likeVideo = async (req, res) => {
  try {
    const { video_id } = req.body
    await db.execute('UPDATE videos SET view_count = view_count + 1 WHERE video_id = ?', [video_id])
    res.send({ status: 0, message: '点赞成功' })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 获取考试列表
exports.getExamList = async (req, res) => {
  try {
    const studentId = req.auth.user_id
    const [rows] = await db.execute(`
      SELECT e.*, c.course_name,
             (SELECT score FROM exam_records WHERE exam_id = e.exam_id AND student_id = ?) as my_score,
             (SELECT status FROM exam_records WHERE exam_id = e.exam_id AND student_id = ?) as my_status
      FROM exams e
      JOIN courses c ON e.course_id = c.course_id
      JOIN course_enrollments ce ON c.course_id = ce.course_id
      WHERE ce.student_id = ? AND ce.status = 1
      ORDER BY e.start_time DESC
    `, [studentId, studentId, studentId])
    
    // 转换数据格式以匹配前端期望
    const now = new Date()
    const formattedRows = rows.map(exam => {
      const startTime = exam.start_time ? new Date(exam.start_time) : null
      const endTime = exam.end_time ? new Date(exam.end_time) : null
      
      // 确定考试状态
      let status
      if (exam.my_status === 1) {
        // 已提交答卷 - 已完成
        status = 'completed'
      } else if (exam.my_status === 0) {
        // 已开始但未提交 - 进行中
        status = 'ongoing'
      } else if (startTime && now < startTime) {
        // 未开始且时间未到 - 待开始
        status = 'upcoming'
      } else if (startTime && endTime && now >= startTime && now <= endTime) {
        // 正在进行中（在考试时间段内，且学生未开始）
        status = 'ongoing'
      } else if (endTime && now > endTime) {
        // 未参加且已结束 - 缺考
        status = 'missed'
      } else {
        // 其他情况，默认为待开始
        status = 'upcoming'
      }
      
      return {
        exam_id: exam.exam_id,
        exam_name: exam.title,
        course_name: exam.course_name,
        duration: exam.duration,
        total_score: exam.total_score,
        start_time: exam.start_time,
        end_time: exam.end_time,
        status: status,
        score: exam.my_score,
        question_count: null // 如果需要可以从 exam_questions 表查询
      }
    })
    
    res.send({ status: 0, message: '获取成功', data: formattedRows })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 获取考试详情
exports.getExamDetail = async (req, res) => {
  try {
    const { examId } = req.params
    const [rows] = await db.execute(`
      SELECT e.*, c.course_name
      FROM exams e
      JOIN courses c ON e.course_id = c.course_id
      WHERE e.exam_id = ?
    `, [examId])
    
    if (rows.length === 0) {
      return res.send({ status: 1, message: '考试不存在' })
    }
    
    // 获取题目
    const [questions] = await db.execute(`
      SELECT question_id, question_type, question_text, options, score
      FROM exam_questions
      WHERE exam_id = ?
      ORDER BY sort_order ASC
    `, [examId])
    
    const data = rows[0]
    data.questions = questions
    
    res.send({ status: 0, message: '获取成功', data })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 开始考试
exports.startExam = async (req, res) => {
  try {
    const { exam_id } = req.body
    const studentId = req.auth.user_id
    
    // 检查是否已开始
    const [existing] = await db.execute(
      'SELECT * FROM exam_records WHERE exam_id = ? AND student_id = ?',
      [exam_id, studentId]
    )
    
    if (existing.length > 0) {
      return res.send({ status: 0, message: '继续考试', data: existing[0] })
    }
    
    // 创建考试记录
    const [result] = await db.execute(
      'INSERT INTO exam_records (exam_id, student_id, status, start_time) VALUES (?, ?, 0, NOW())',
      [exam_id, studentId]
    )
    
    res.send({ status: 0, message: '开始考试', data: { record_id: result.insertId } })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 提交答卷
exports.submitExam = async (req, res) => {
  try {
    const { exam_id, answers } = req.body
    const studentId = req.auth.user_id
    
    // 获取正确答案
    const [questions] = await db.execute(
      'SELECT question_id, correct_answer, score FROM exam_questions WHERE exam_id = ?',
      [exam_id]
    )
    
    // 计算分数
    let totalScore = 0
    questions.forEach(q => {
      const userAnswer = answers[q.question_id]
      if (userAnswer && userAnswer === q.correct_answer) {
        totalScore += parseFloat(q.score)
      }
    })
    
    // 更新考试记录
    await db.execute(`
      UPDATE exam_records 
      SET answers = ?, score = ?, status = 1, submit_time = NOW()
      WHERE exam_id = ? AND student_id = ?
    `, [JSON.stringify(answers), totalScore, exam_id, studentId])
    
    res.send({ status: 0, message: '提交成功', data: { score: totalScore } })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 获取考试结果
exports.getExamResult = async (req, res) => {
  try {
    const { examId } = req.params
    const studentId = req.auth.user_id
    
    const [records] = await db.execute(`
      SELECT er.*, e.title, e.total_score
      FROM exam_records er
      JOIN exams e ON er.exam_id = e.exam_id
      WHERE er.exam_id = ? AND er.student_id = ?
    `, [examId, studentId])
    
    if (records.length === 0) {
      return res.send({ status: 1, message: '未找到考试记录' })
    }
    
    // 获取题目和答案
    const [questions] = await db.execute(`
      SELECT question_id, question_type, question_text, options, correct_answer, score
      FROM exam_questions
      WHERE exam_id = ?
    `, [examId])
    
    const data = records[0]
    data.questions = questions
    data.answers = JSON.parse(data.answers || '{}')
    
    res.send({ status: 0, message: '获取成功', data })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 获取实验任务列表
exports.getExperimentList = async (req, res) => {
  try {
    const studentId = req.auth.user_id
    const [rows] = await db.execute(`
      SELECT e.*, c.course_name,
             es.submission_id, es.score, es.status as submission_status, 
             es.submitted_at, es.report_file_url
      FROM experiments e
      JOIN courses c ON e.course_id = c.course_id
      JOIN course_enrollments ce ON c.course_id = ce.course_id
      LEFT JOIN experiment_submissions es ON e.experiment_id = es.experiment_id AND es.student_id = ?
      WHERE ce.student_id = ? AND ce.status = 1
      ORDER BY e.deadline ASC
    `, [studentId, studentId])
    res.send({ status: 0, message: '获取成功', data: rows })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 获取实验详情
exports.getExperimentDetail = async (req, res) => {
  try {
    const { experimentId } = req.params
    const [rows] = await db.execute(`
      SELECT e.*, c.course_name
      FROM experiments e
      JOIN courses c ON e.course_id = c.course_id
      WHERE e.experiment_id = ?
    `, [experimentId])
    
    if (rows.length === 0) {
      return res.send({ status: 1, message: '实验不存在' })
    }
    
    res.send({ status: 0, message: '获取成功', data: rows[0] })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 提交实验报告
exports.submitExperiment = async (req, res) => {
  try {
    const { experiment_id, report_file_url, report_content } = req.body
    const studentId = req.auth.user_id
    
    // 检查是否已提交
    const [existing] = await db.execute(
      'SELECT * FROM experiment_submissions WHERE experiment_id = ? AND student_id = ?',
      [experiment_id, studentId]
    )
    
    if (existing.length > 0) {
      // 更新
      await db.execute(`
        UPDATE experiment_submissions 
        SET report_file_url = ?, report_content = ?, submitted_at = NOW()
        WHERE experiment_id = ? AND student_id = ?
      `, [report_file_url, report_content, experiment_id, studentId])
    } else {
      // 新增
      await db.execute(`
        INSERT INTO experiment_submissions (experiment_id, student_id, report_file_url, report_content, submitted_at)
        VALUES (?, ?, ?, ?, NOW())
      `, [experiment_id, studentId, report_file_url, report_content])
    }
    
    res.send({ status: 0, message: '提交成功' })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 获取讨论列表
exports.getDiscussionList = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT d.*, u.real_name, u.avatar, c.course_name,
             (SELECT COUNT(*) FROM discussions WHERE parent_id = d.discussion_id) as reply_count
      FROM discussions d
      LEFT JOIN users u ON d.user_id = u.user_id
      LEFT JOIN courses c ON d.course_id = c.course_id
      WHERE d.status = 1 AND d.parent_id IS NULL
      ORDER BY d.is_top DESC, d.created_at DESC
    `)
    res.send({ status: 0, message: '获取成功', data: rows })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 获取课程讨论
exports.getCourseDiscussions = async (req, res) => {
  try {
    const { courseId } = req.params
    const [rows] = await db.execute(`
      SELECT d.*, u.real_name, u.avatar,
             (SELECT COUNT(*) FROM discussions WHERE parent_id = d.discussion_id) as reply_count
      FROM discussions d
      LEFT JOIN users u ON d.user_id = u.user_id
      WHERE d.course_id = ? AND d.status = 1 AND d.parent_id IS NULL
      ORDER BY d.is_top DESC, d.created_at DESC
    `, [courseId])
    res.send({ status: 0, message: '获取成功', data: rows })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 发起讨论
exports.addDiscussion = async (req, res) => {
  try {
    const { course_id, title, content } = req.body
    const userId = req.auth.user_id
    
    const [result] = await db.execute(
      'INSERT INTO discussions (course_id, user_id, title, content, created_at) VALUES (?, ?, ?, ?, NOW())',
      [course_id, userId, title, content]
    )
    
    res.send({ status: 0, message: '发布成功', data: { discussion_id: result.insertId } })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 回复讨论
exports.replyDiscussion = async (req, res) => {
  try {
    const { course_id, parent_id, content } = req.body
    const userId = req.auth.user_id
    
    const [result] = await db.execute(
      'INSERT INTO discussions (course_id, user_id, parent_id, content, created_at) VALUES (?, ?, ?, ?, NOW())',
      [course_id, userId, parent_id, content]
    )
    
    res.send({ status: 0, message: '回复成功', data: { discussion_id: result.insertId } })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 点赞讨论
exports.likeDiscussion = async (req, res) => {
  try {
    const { discussion_id } = req.body
    await db.execute('UPDATE discussions SET likes = likes + 1 WHERE discussion_id = ?', [discussion_id])
    res.send({ status: 0, message: '点赞成功' })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 获取通知列表
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.auth.user_id
    const [rows] = await db.execute(`
      SELECT n.*, c.course_name
      FROM notifications n
      LEFT JOIN courses c ON n.course_id = c.course_id
      WHERE n.status = 1
      ORDER BY n.is_top DESC, n.created_at DESC
    `)
    res.send({ status: 0, message: '获取成功', data: rows })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 标记通知已读
exports.markNotificationRead = async (req, res) => {
  try {
    // 这里可以实现已读记录功能
    res.send({ status: 0, message: '标记成功' })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 获取学习资料
exports.getMaterials = async (req, res) => {
  try {
    const { courseId } = req.params
    const [rows] = await db.execute(`
      SELECT m.*, u.real_name as uploader_name
      FROM materials m
      LEFT JOIN users u ON m.uploaded_by = u.user_id
      WHERE m.course_id = ? AND m.status = 1
      ORDER BY m.created_at DESC
    `, [courseId])
    res.send({ status: 0, message: '获取成功', data: rows })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 获取系统公告列表
exports.getAnnouncements = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT n.*, u.real_name as sender_name
      FROM notifications n
      LEFT JOIN users u ON n.sender_id = u.user_id
      WHERE n.type = 1 AND n.status = 1
      ORDER BY n.is_top DESC, n.created_at DESC
    `)
    res.send({ status: 0, message: '获取成功', data: rows })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}
