// 导入数据库操作模块
const db = require('../db/index')
// 导入token生成包
const jwt = require('jsonwebtoken')
// 导入全局配置文件
const config = require('../config')
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
      const [result] = await db.execute('insert into users (username, real_name, student_no, phone, email, password, department, role) values (?, ?, ?, ?, ?, ?, ?, ?)', [username, real_name, user_no, phone, email, password, department, role])
      if (result.affectedRows !== 1) { return res.send({ message: '注册失败'}) }
    }
    else if ( role === 2 ) {
      const [result] = await db.execute('insert into users (username, real_name, teacher_no, phone, email, password, department, role) values (?, ?, ?, ?, ?, ?, ?, ?)', [username, real_name, user_no, phone, email, password, department, role])
      if (result.affectedRows !== 1) { return res.send({ message: '注册失败'}) }
    }
    else if ( role === 3 ) {
      const [result] = await db.execute('insert into users (username, real_name, phone, email, password, department, role) values (?, ?, ?, ?, ?, ?, ?)', [username, real_name, phone, email, password, department, role])
      if (result.affectedRows !== 1) { return res.send({ message: '注册失败'}) }
    }
    else {
      return res.send({ message: '没有指定注册身份'})
    }
    // 注册成功
    res.send({ message: '注册成功'})
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
    // 登录成功,返回登录token字符串
    const user = { username, user_id, role: user_role }
    const tokenStr = jwt.sign(user, config.jwtSecretKey, {expiresIn: config.expiresIn})
    res.send({ 
      message: '登录成功', 
      token: 'Bearer ' + tokenStr, 
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

