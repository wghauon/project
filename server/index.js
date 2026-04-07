// express模块
const express = require('express')
// 创建 express 服务器实例
const app = express()
// 导入 cors 中间件
const cors = require('cors')
// 导入全局配置文件
const config = require('./config')
// 导入解析token中间件
const { expressjwt: expressJWT } = require('express-jwt')
// 导入用户路由模块
const userRouter = require('./router/user')
// 导入教师路由模块
const teacherRouter = require('./router/teacher')

// 更详细的CORS配置
app.use(cors({
  origin: '*', 
  credentials: true
}))

// 配置解析JSON格式数据中间件
app.use(express.json())
// 配置解析 application/x-www-form-urlencoded 格式表单数据中间件
app.use(express.urlencoded({ extended: true }))
// 全局注册解析token中间件
// app.use(expressJWT({
//   secret: config.jwtSecretKey,
//   algorithms: ['HS256']
// }).unless({ path: [/^\/api\//] }))

// 设置静态文件目录，添加更多选项
app.use('/uploads', (req, res, next) => {
  // 为视频文件设置正确的MIME类型
  if (req.path.endsWith('.mp4')) {
    res.setHeader('Content-Type', 'video/mp4')
  }
  // 允许跨域
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  next()
}, express.static('uploads', {
  setHeaders: (res, path) => {
    // 对于视频文件，允许范围请求（支持视频跳转）
    if (path.endsWith('.mp4')) {
      res.setHeader('Accept-Ranges', 'bytes')
      res.setHeader('Cache-Control', 'no-cache')
    }
  }
}))

// 注册用户路由模块
app.use('/api',userRouter)
// 注册教师上传路由模块
app.use('/teacher',teacherRouter)





// 错误中间件
app.use(function (err,req,res,next) {
  // 捕获身份认证失败的错误
  if(err.name === 'UnauthorizedError') { return res.send({ status: 1, message: '身份认证失败'})}
  // 打印错误日志
  console.error(err)
  res.status(500).send({ status: 1, message: err.message || '服务器内部错误' })
})
// 启动服务器
app.listen('3000', () => {
  console.log('api server running at http://127.0.0.1:3000')
})