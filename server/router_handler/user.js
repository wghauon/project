// 导入数据库操作模块
const db = require('../db/index')
// 导入token生成包
const jwt = require('jsonwebtoken')
// 导入全局配置文件
const config = require('../config')
// 导入SSE管理器
const sseManager = require('../utils/sse-manager')
// 导入SSE处理函数
const { getDashboardData } = require('./sse')

// 主动推送仪表盘更新（供内部调用）
async function broadcastDashboardUpdate() {
  try {
    const data = await getDashboardData()
    sseManager.updateCache(data)
    sseManager.broadcast(data)
    console.log('[SSE] 仪表盘数据已主动推送')
  } catch (err) {
    console.error('[SSE] 推送更新失败:', err)
  }
}

// 注册
exports.register = async (req, res) => {
  try {
    const { username, real_name, user_no, phone, email, password, department, role } = req.body
    console.log({ username, real_name, user_no, phone, email, password, department, role })
    // 检查userInfo
    if (username === '' || password === '') { return res.send({ message: '用户名和密码不能为空'})}
    // 查询用户名是否被占用
    const [rows] = await db.execute('select * from users where username = ?', [username])
    if (rows.length > 0) { return res.send({ message: '用户名被占用'}) }
    // 根据身份插入新用户
    if ( role === 1 ) {
      const [result] = await db.execute('insert into users (username, real_name, student_no, phone, email, password, department, role, created_at) values (?, ?, ?, ?, ?, ?, ?, ?, NOW())', [username, real_name, user_no, phone, email, password, department, role])
      if (result.affectedRows !== 1) { return res.send({ status: 1, message: '注册失败'}) }
    }
    else if ( role === 2 ) {
      const [result] = await db.execute('insert into users (username, real_name, teacher_no, phone, email, password, department, role, created_at) values (?, ?, ?, ?, ?, ?, ?, ?, NOW())', [username, real_name, user_no, phone, email, password, department, role])
      if (result.affectedRows !== 1) { return res.send({ status: 1, message: '注册失败'}) }
    }
    else if ( role === 3 ) {
      const [result] = await db.execute('insert into users (username, real_name, phone, email, password, department, role, created_at) values (?, ?, ?, ?, ?, ?, ?, NOW())', [username, real_name, phone, email, password, department, role])
      if (result.affectedRows !== 1) { return res.send({ status: 1, message: '注册失败'}) }
    }
    else {
      return res.send({ status: 1, message: '没有指定注册身份'})
    }
    // 注册成功，主动推送仪表盘更新
    broadcastDashboardUpdate()
    
    // 注册成功
    res.send({ status: 0, message: '注册成功'})
  } 
  catch (err) {
    res.send({ message: err.message})
  }
}

// 登录
exports.login = async (req,res) => {
  try {
    const {username, password, role} = req.body
    // 查询用户是否存在
    const [rows] = await db.execute('select * from users where username = ?', [username])
    if (rows.length !== 1) { return res.send({ message: '用户不存在'}) }
    // 用户ID
    const user_id = rows[0].user_id
    const user_role = rows[0].role
    const real_name = rows[0].real_name
    // 确认密码是否匹配
    if (rows[0].password !== password) { return res.send({ message: '密码错误'}) }
    // 确认身份是否匹配
    if (user_role !== role) { return res.send({ message:'身份不匹配'})}
    // 登录成功,生成双token
    const user = { username, user_id, role: user_role }
    
    // 生成access token（15分钟有效期）
    const accessToken = jwt.sign(user, config.jwtSecretKey, {expiresIn: config.accessTokenExpiresIn})
    
    // 生成refresh token（7天有效期）
    const refreshToken = jwt.sign({ user_id }, config.refreshTokenSecretKey, {expiresIn: config.refreshTokenExpiresIn})
    
    // 将refresh token存入数据库
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7天后过期
    await db.execute(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE token = ?, expires_at = ?',
      [user_id, refreshToken, expiresAt, refreshToken, expiresAt]
    )
    
    res.send({ 
      status: 0,
      message: '登录成功', 
      accessToken: 'Bearer ' + accessToken,
      refreshToken: refreshToken,
      user_id,
      role: user_role,
      real_name,
      username
    })
  }
  catch (err) {
    res.send({ message: err.message})
  }
}

// 刷新token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body
    
    if (!refreshToken) {
      return res.status(401).send({ status: 1, message: '缺少refresh token' })
    }
    
    // 验证refresh token
    let decoded
    try {
      decoded = jwt.verify(refreshToken, config.refreshTokenSecretKey)
    } catch (err) {
      return res.status(401).send({ status: 1, message: 'refresh token无效或已过期' })
    }
    
    // 检查数据库中是否存在
    const [rows] = await db.execute(
      'SELECT * FROM refresh_tokens WHERE user_id = ? AND token = ? AND expires_at > NOW()',
      [decoded.user_id, refreshToken]
    )
    
    if (rows.length === 0) {
      return res.status(401).send({ status: 1, message: 'refresh token已失效' })
    }
    
    // 查询用户信息
    const [userRows] = await db.execute('SELECT * FROM users WHERE user_id = ?', [decoded.user_id])
    if (userRows.length === 0) {
      return res.status(401).send({ status: 1, message: '用户不存在' })
    }
    
    const user = userRows[0]
    const userInfo = { 
      username: user.username, 
      user_id: user.user_id, 
      role: user.role 
    }
    
    // 生成新的access token
    const newAccessToken = jwt.sign(userInfo, config.jwtSecretKey, {expiresIn: config.accessTokenExpiresIn})
    
    // 生成新的refresh token（轮换机制）
    const newRefreshToken = jwt.sign({ user_id: user.user_id }, config.refreshTokenSecretKey, {expiresIn: config.refreshTokenExpiresIn})
    
    // 更新数据库中的refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await db.execute(
      'UPDATE refresh_tokens SET token = ?, expires_at = ? WHERE user_id = ?',
      [newRefreshToken, expiresAt, user.user_id]
    )
    
    res.send({
      status: 0,
      message: '刷新成功',
      accessToken: 'Bearer ' + newAccessToken,
      refreshToken: newRefreshToken
    })
  } catch (err) {
    res.status(500).send({ status: 1, message: err.message })
  }
}

