// SSE路由模块 - 管理员仪表盘实时数据推送
const express = require('express')
const router = express.Router()
const sseHandler = require('../router_handler/sse')

// SSE连接端点 - 管理员仪表盘实时数据流
router.get('/admin/dashboard-stream', sseHandler.dashboardStream)

// 手动触发数据更新（供其他路由调用）
router.post('/admin/notify-update', sseHandler.notifyUpdate)

// 获取SSE连接统计
router.get('/admin/sse-stats', sseHandler.getStats)

module.exports = router
