// 管理员端路由处理函数
const db = require('../db/index')

// 获取仪表盘统计数据
exports.getDashboardStats = async (req, res) => {
  try {
    // 用户统计
    const [userStats] = await db.execute(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN role = 1 THEN 1 ELSE 0 END) as student_count,
        SUM(CASE WHEN role = 2 THEN 1 ELSE 0 END) as teacher_count,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as new_users_today
      FROM users
      WHERE status = 1
    `)

    // 课程统计
    const [courseStats] = await db.execute(`
      SELECT 
        COUNT(*) as total_courses,
        SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as pending_courses,
        SUM(CASE WHEN status = 2 THEN 1 ELSE 0 END) as published_courses,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as new_courses_today
      FROM courses
    `)

    // 视频统计
    const [videoStats] = await db.execute(`
      SELECT COUNT(*) as total_videos FROM videos WHERE status = 1
    `)

    // 考试统计
    const [examStats] = await db.execute(`
      SELECT COUNT(*) as total_exams FROM exams
    `)

    res.send({
      status: 0,
      message: '获取成功',
      data: {
        users: userStats[0],
        courses: courseStats[0],
        videos: videoStats[0],
        exams: examStats[0]
      }
    })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 获取最近活动
exports.getRecentActivities = async (req, res) => {
  try {
    // 这里可以查询操作日志表，暂时返回模拟数据
    const activities = [
      { id: 1, content: '系统运行正常', time: '刚刚', type: 'system' },
      { id: 2, content: '新用户注册', time: '5分钟前', type: 'user' },
      { id: 3, content: '新课程创建', time: '10分钟前', type: 'course' }
    ]
    res.send({ status: 0, message: '获取成功', data: activities })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 获取用户列表
exports.getUserList = async (req, res) => {
  try {
    const { keyword, role, page = 1, pageSize = 10 } = req.query
    let sql = `
      SELECT user_id, username, real_name, role, email, phone, department, status, created_at
      FROM users
      WHERE 1=1
    `
    const params = []

    if (keyword && keyword.trim()) {
      sql += ' AND (username LIKE ? OR real_name LIKE ? OR email LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
    }

    if (role && role !== '' && role !== 'undefined') {
      sql += ' AND role = ?'
      params.push(parseInt(role))
    }

    // sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    // params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize))

    const [rows] = await db.execute(sql, params)

    // 获取总数
    let countSql = 'SELECT COUNT(*) as total FROM users WHERE 1=1'
    const countParams = []
    if (keyword && keyword.trim()) {
      countSql += ' AND (username LIKE ? OR real_name LIKE ? OR email LIKE ?)'
      countParams.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
    }
    if (role && role !== '' && role !== 'undefined') {
      countSql += ' AND role = ?'
      countParams.push(parseInt(role))
    }
    const [countResult] = await db.execute(countSql, countParams)

    res.send({
      status: 0,
      message: '获取成功',
      data: {
        list: rows,
        total: countResult[0].total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 创建用户
exports.createUser = async (req, res) => {
  try {
    const { username, real_name, role, email, phone, department, password } = req.body

    // 检查用户名是否已存在
    const [existing] = await db.execute('SELECT * FROM users WHERE username = ?', [username])
    if (existing.length > 0) {
      return res.send({ status: 1, message: '用户名已存在' })
    }

    const [result] = await db.execute(`
      INSERT INTO users (username, password, real_name, role, email, phone, department, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW())
    `, [username, password, real_name, role, email, phone, department])

    res.send({ status: 0, message: '创建成功', data: { user_id: result.insertId } })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 更新用户
exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params
    const { real_name, role, email, phone, department, status } = req.body

    await db.execute(`
      UPDATE users 
      SET real_name = ?, role = ?, email = ?, phone = ?, department = ?, status = ?
      WHERE user_id = ?
    `, [real_name, role, email, phone, department, status, userId])

    res.send({ status: 0, message: '更新成功' })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 删除用户
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params

    // 检查是否是管理员
    const [users] = await db.execute('SELECT role FROM users WHERE user_id = ?', [userId])
    if (users.length === 0) {
      return res.send({ status: 1, message: '用户不存在' })
    }
    if (users[0].role === 3) {
      return res.send({ status: 1, message: '不能删除管理员账号' })
    }

    await db.execute('DELETE FROM users WHERE user_id = ?', [userId])
    res.send({ status: 0, message: '删除成功' })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 重置密码
exports.resetPassword = async (req, res) => {
  try {
    const { userId } = req.params
    const defaultPassword = '123456'

    await db.execute('UPDATE users SET password = ? WHERE user_id = ?', [defaultPassword, userId])
    res.send({ status: 0, message: '密码已重置为：123456' })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 切换用户状态
exports.toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params

    const [users] = await db.execute('SELECT status, role FROM users WHERE user_id = ?', [userId])
    if (users.length === 0) {
      return res.send({ status: 1, message: '用户不存在' })
    }

    // 不能禁用管理员
    if (users[0].role === 3) {
      return res.send({ status: 1, message: '不能禁用管理员账号' })
    }

    const newStatus = users[0].status === 1 ? 0 : 1
    await db.execute('UPDATE users SET status = ? WHERE user_id = ?', [newStatus, userId])

    res.send({ status: 0, message: newStatus === 1 ? '用户已启用' : '用户已禁用' })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 获取待审核课程
exports.getPendingCourses = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT c.*, u.real_name as teacher_name, u.department
      FROM courses c
      LEFT JOIN users u ON c.teacher_id = u.user_id
      WHERE c.status = 1
      ORDER BY c.created_at DESC
    `)
    res.send({ status: 0, message: '获取成功', data: rows })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 审核通过课程
exports.approveCourse = async (req, res) => {
  try {
    const { courseId } = req.params
    const { review_remark } = req.body

    await db.execute(`
      UPDATE courses 
      SET status = 2, review_remark = ?, published_at = NOW()
      WHERE course_id = ?
    `, [review_remark || '', courseId])

    res.send({ status: 0, message: '审核通过' })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 驳回课程
exports.rejectCourse = async (req, res) => {
  try {
    const { courseId } = req.params
    const { review_remark } = req.body

    await db.execute(`
      UPDATE courses 
      SET status = 3, review_remark = ?
      WHERE course_id = ?
    `, [review_remark || '', courseId])

    res.send({ status: 0, message: '已驳回' })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 获取系统公告
exports.getAnnouncements = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT n.*, u.real_name as sender_name
      FROM notifications n
      LEFT JOIN users u ON n.sender_id = u.user_id
      WHERE n.type = 1
      ORDER BY n.is_top DESC, n.created_at DESC
    `)
    res.send({ status: 0, message: '获取成功', data: rows })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 创建系统公告
exports.createAnnouncement = async (req, res) => {
  try {
    const { title, content, is_top } = req.body
    const senderId = req.auth.user_id

    const [result] = await db.execute(`
      INSERT INTO notifications (title, content, type, sender_id, is_top, status, created_at)
      VALUES (?, ?, 1, ?, ?, 1, NOW())
    `, [title, content, senderId, is_top ? 1 : 0])

    res.send({ status: 0, message: '发布成功', data: { notification_id: result.insertId } })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 更新系统公告
exports.updateAnnouncement = async (req, res) => {
  try {
    const { announcementId } = req.params
    const { title, content, is_top, status } = req.body

    await db.execute(`
      UPDATE notifications 
      SET title = ?, content = ?, is_top = ?, status = ?
      WHERE notification_id = ?
    `, [title, content, is_top, status, announcementId])

    res.send({ status: 0, message: '更新成功' })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}

// 删除系统公告
exports.deleteAnnouncement = async (req, res) => {
  try {
    const { announcementId } = req.params
    await db.execute('DELETE FROM notifications WHERE notification_id = ?', [announcementId])
    res.send({ status: 0, message: '删除成功' })
  } catch (err) {
    res.send({ status: 1, message: err.message })
  }
}
