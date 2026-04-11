// 教师端考试管理路由处理函数
const db = require('../db/index')

// 获取考试列表
exports.getExamList = async (req, res) => {
  try {
    const teacherId = req.auth.user_id
    const [rows] = await db.execute(`
      SELECT e.*, c.course_name,
             (SELECT COUNT(*) FROM exam_questions WHERE exam_id = e.exam_id) as question_count,
             (SELECT COUNT(*) FROM exam_records WHERE exam_id = e.exam_id AND status = 1) as submitted_count
      FROM exams e
      JOIN courses c ON e.course_id = c.course_id
      WHERE c.teacher_id = ?
      ORDER BY e.created_at DESC
    `, [teacherId])
    res.send({ status: 0, message: '获取成功', data: rows })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 创建考试
exports.createExam = async (req, res) => {
  try {
    const { course_id, title, description, duration, start_time, end_time, total_score, pass_score } = req.body

    // 参数校验和转换，将 undefined 转换为 null
    const params = [
      course_id ?? null,
      title ?? null,
      description ?? null,
      duration ?? null,
      start_time ?? null,
      end_time ?? null,
      total_score ?? null,
      pass_score ?? null
    ]

    // 检查必填字段
    if (!course_id || !title) {
      return res.send({ status: 1, message: '课程ID和考试标题不能为空' })
    }

    const [result] = await db.execute(`
      INSERT INTO exams (course_id, title, description, duration, start_time, end_time, total_score, pass_score, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NOW())
    `, params)

    res.send({ status: 0, message: '创建成功', data: { exam_id: result.insertId } })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 更新考试
exports.updateExam = async (req, res) => {
  try {
    const { examId } = req.params
    const { title, description, duration, start_time, end_time, total_score, pass_score } = req.body

    // 参数校验和转换，将 undefined 转换为 null
    const params = [
      title ?? null,
      description ?? null,
      duration ?? null,
      start_time ?? null,
      end_time ?? null,
      total_score ?? null,
      pass_score ?? null,
      examId
    ]

    await db.execute(`
      UPDATE exams
      SET title = ?, description = ?, duration = ?, start_time = ?, end_time = ?, total_score = ?, pass_score = ?
      WHERE exam_id = ?
    `, params)

    res.send({ status: 0, message: '更新成功' })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 删除考试
exports.deleteExam = async (req, res) => {
  try {
    const { examId } = req.params
    
    // 先删除相关题目和记录
    await db.execute('DELETE FROM exam_questions WHERE exam_id = ?', [examId])
    await db.execute('DELETE FROM exam_records WHERE exam_id = ?', [examId])
    await db.execute('DELETE FROM exams WHERE exam_id = ?', [examId])
    
    res.send({ status: 0, message: '删除成功' })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 发布考试
exports.publishExam = async (req, res) => {
  try {
    const { examId } = req.params
    
    // 检查是否有题目
    const [questions] = await db.execute(
      'SELECT COUNT(*) as count FROM exam_questions WHERE exam_id = ?',
      [examId]
    )
    
    if (questions[0].count === 0) {
      return res.send({ status: 1, message: '请先添加题目' })
    }
    
    await db.execute('UPDATE exams SET status = 1 WHERE exam_id = ?', [examId])
    res.send({ status: 0, message: '发布成功' })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 获取考试题目
exports.getQuestions = async (req, res) => {
  try {
    const { examId } = req.params
    const [rows] = await db.execute(`
      SELECT question_id, question_type, question_text, options, correct_answer, score, sort_order
      FROM exam_questions
      WHERE exam_id = ?
      ORDER BY sort_order ASC
    `, [examId])
    
    // 解析options JSON
    rows.forEach(row => {
      if (row.options) {
        row.options = JSON.parse(row.options)
      }
    })
    
    res.send({ status: 0, message: '获取成功', data: rows })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 添加题目
exports.addQuestion = async (req, res) => {
  try {
    const { exam_id, question_type, question_text, options, correct_answer, score, sort_order } = req.body
    
    const [result] = await db.execute(`
      INSERT INTO exam_questions (exam_id, question_type, question_text, options, correct_answer, score, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [exam_id, question_type, question_text, JSON.stringify(options), correct_answer, score, sort_order])
    
    res.send({ status: 0, message: '添加成功', data: { question_id: result.insertId } })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 更新题目
exports.updateQuestion = async (req, res) => {
  try {
    const { questionId } = req.params
    const { question_type, question_text, options, correct_answer, score, sort_order } = req.body
    
    await db.execute(`
      UPDATE exam_questions 
      SET question_type = ?, question_text = ?, options = ?, correct_answer = ?, score = ?, sort_order = ?
      WHERE question_id = ?
    `, [question_type, question_text, JSON.stringify(options), correct_answer, score, sort_order, questionId])
    
    res.send({ status: 0, message: '更新成功' })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 删除题目
exports.deleteQuestion = async (req, res) => {
  try {
    const { questionId } = req.params
    await db.execute('DELETE FROM exam_questions WHERE question_id = ?', [questionId])
    res.send({ status: 0, message: '删除成功' })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 获取考试统计
exports.getExamStatistics = async (req, res) => {
  try {
    const { examId } = req.params
    
    // 获取基本统计
    const [stats] = await db.execute(`
      SELECT 
        COUNT(*) as total_students,
        AVG(score) as avg_score,
        MAX(score) as max_score,
        MIN(score) as min_score
      FROM exam_records
      WHERE exam_id = ? AND status = 1
    `, [examId])
    
    // 获取分数分布
    const [distribution] = await db.execute(`
      SELECT 
        CASE 
          WHEN score >= 90 THEN '90-100'
          WHEN score >= 80 THEN '80-89'
          WHEN score >= 70 THEN '70-79'
          WHEN score >= 60 THEN '60-69'
          ELSE '0-59'
        END as score_range,
        COUNT(*) as count
      FROM exam_records
      WHERE exam_id = ? AND status = 1
      GROUP BY score_range
      ORDER BY score_range DESC
    `, [examId])
    
    res.send({
      status: 0,
      message: '获取成功',
      data: {
        ...stats[0],
        distribution
      }
    })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 获取学生答卷
exports.getExamRecords = async (req, res) => {
  try {
    const { examId } = req.params
    const [rows] = await db.execute(`
      SELECT er.*, u.real_name, u.student_no
      FROM exam_records er
      JOIN users u ON er.student_id = u.user_id
      WHERE er.exam_id = ?
      ORDER BY er.submit_time DESC
    `, [examId])
    res.send({ status: 0, message: '获取成功', data: rows })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 批改答卷
exports.gradeExam = async (req, res) => {
  try {
    const { record_id, score, feedback } = req.body
    
    await db.execute(`
      UPDATE exam_records 
      SET score = ?, feedback = ?, status = 1
      WHERE record_id = ?
    `, [score, feedback, record_id])
    
    res.send({ status: 0, message: '批改成功' })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}
