const express = require('express')
const router = express.Router()
const user = require('../router_handler/user')

//监听注册请求
router.post('/register', user.register)

//监听登录请求
router.post('/login', user.login)

//监听刷新token请求
router.post('/refresh', user.refreshToken)

module.exports = router