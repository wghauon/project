// SSE路由处理函数 - 管理员仪表盘实时数据推送
const sseManager = require('../utils/sse-manager')
const db = require('../db/index')

// 获取仪表盘统计数据的SQL查询
async function getDashboardData() {
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

    // 获取最近活动 - 从数据库查询真实的活动记录
    const [activities] = await db.execute(`
      SELECT 
        user_id as id,
        CONCAT('用户 ', real_name, ' 注册成功') as content,
        '刚刚' as time,
        'user' as type
      FROM users 
      WHERE status = 1 
      ORDER BY created_at DESC 
      LIMIT 5
    `)

    return {
      stats: {
        users: userStats[0],
        courses: courseStats[0],
        videos: videoStats[0],
        exams: examStats[0]
      },
      activities: activities.map((a, index) => ({
        id: a.id || index + 1,
        content: a.content,
        time: a.time,
        type: a.type
      })),
      timestamp: new Date().toISOString()
    }
  } catch (err) {
    console.error('[SSE] 获取仪表盘数据失败:', err)
    throw err
  }
}

// 初始化SSE管理器的定时任务
let isInitialized = false
function initSSEManager() {
  if (isInitialized) return
  
  // 每30秒自动推送最新数据
  sseManager.startInterval(async () => {
    return await getDashboardData()
  }, 30000)

  // 每30秒发送心跳保持连接
  sseManager.startHeartbeat(30000)
  
  isInitialized = true
  console.log('[SSE] 管理器初始化完成')
}

// SSE连接端点 - 管理员仪表盘实时数据流
exports.dashboardStream = async (req, res) => {
  try {
    // 验证用户身份（只接受管理员）
    const userId = req.auth?.user_id
    const userRole = req.auth?.role

    if (!userId) {
      return res.status(401).json({ status: 1, message: '未授权访问' })
    }

    if (userRole !== 3) {
      return res.status(403).json({ status: 1, message: '只有管理员可以访问实时数据流' })
    }

    // 初始化管理器
    initSSEManager()

    // 获取初始数据
    const initialData = await getDashboardData()
    sseManager.updateCache(initialData)

    // 添加客户端连接
    sseManager.addClient(userId, res)

  } catch (err) {
    console.error('[SSE] 连接错误:', err)
    if (!res.headersSent) {
      res.status(500).json({ status: 1, message: err.message })
    }
  }
}

// 手动触发数据更新
exports.notifyUpdate = async (req, res) => {
  try {
    const data = await getDashboardData()
    sseManager.updateCache(data)
    sseManager.broadcast(data)
    
    res.json({ 
      status: 0, 
      message: '数据更新已推送给所有客户端',
      clientCount: sseManager.clients?.size || 0
    })
  } catch (err) {
    res.status(500).json({ status: 1, message: err.message })
  }
}

// 获取SSE连接统计
exports.getStats = (req, res) => {
  try {
    const stats = sseManager.getStats()
    res.json({
      status: 0,
      data: stats
    })
  } catch (err) {
    res.status(500).json({ status: 1, message: err.message })
  }
}

// 导出获取数据函数供其他模块使用
exports.getDashboardData = getDashboardData
