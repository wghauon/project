// SSE连接管理器 - 用于管理管理员仪表盘实时连接

class SSEManager {
  constructor() {
    // 存储所有活跃的SSE连接
    this.clients = new Map()
    // 存储定时器
    this.intervalId = null
    // 数据缓存
    this.cache = {
      stats: null,
      activities: null,
      lastUpdate: null
    }
  }

  // 添加新的客户端连接
  addClient(userId, res) {
    const clientId = `${userId}_${Date.now()}`
    
    // 设置SSE响应头
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no' // 禁用Nginx缓冲
    })

    // 发送初始连接成功消息
    res.write(`event: connected\n`)
    res.write(`data: ${JSON.stringify({ message: 'SSE连接成功', clientId })}\n\n`)

    // 存储客户端
    this.clients.set(clientId, {
      userId,
      res,
      connectedAt: new Date()
    })

    console.log(`[SSE] 客户端连接: ${clientId}, 当前连接数: ${this.clients.size}`)

    // 当连接关闭时移除客户端
    res.on('close', () => {
      this.removeClient(clientId)
    })

    res.on('error', (err) => {
      console.error(`[SSE] 客户端错误: ${clientId}`, err)
      this.removeClient(clientId)
    })

    // 立即发送一次数据
    this.sendDataToClient(clientId)

    return clientId
  }

  // 移除客户端
  removeClient(clientId) {
    if (this.clients.has(clientId)) {
      this.clients.delete(clientId)
      console.log(`[SSE] 客户端断开: ${clientId}, 当前连接数: ${this.clients.size}`)
    }
  }

  // 发送数据给指定客户端
  sendDataToClient(clientId, data = null) {
    const client = this.clients.get(clientId)
    if (!client) return

    const message = data || this.cache
    try {
      client.res.write(`event: dashboard-update\n`)
      client.res.write(`data: ${JSON.stringify(message)}\n\n`)
    } catch (err) {
      console.error(`[SSE] 发送数据失败: ${clientId}`, err)
      this.removeClient(clientId)
    }
  }

  // 广播数据给所有客户端
  broadcast(data, eventName = 'dashboard-update') {
    if (this.clients.size === 0) return

    const message = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`
    
    for (const [clientId, client] of this.clients) {
      try {
        client.res.write(message)
      } catch (err) {
        console.error(`[SSE] 广播失败: ${clientId}`, err)
        this.removeClient(clientId)
      }
    }
  }

  // 更新缓存数据
  updateCache(data) {
    this.cache = {
      ...this.cache,
      ...data,
      lastUpdate: new Date().toISOString()
    }
  }

  // 获取统计信息
  getStats() {
    return {
      totalConnections: this.clients.size,
      clients: Array.from(this.clients.entries()).map(([id, client]) => ({
        clientId: id,
        userId: client.userId,
        connectedAt: client.connectedAt
      }))
    }
  }

  // 启动定时推送
  startInterval(callback, interval = 30000) {
    if (this.intervalId) {
      clearInterval(this.intervalId)
    }

    this.intervalId = setInterval(async () => {
      if (this.clients.size > 0 && callback) {
        try {
          const data = await callback()
          if (data) {
            this.updateCache(data)
            this.broadcast(data)
          }
        } catch (err) {
          console.error('[SSE] 定时任务错误:', err)
        }
      }
    }, interval)

    console.log(`[SSE] 定时推送已启动, 间隔: ${interval}ms`)
  }

  // 停止定时推送
  stopInterval() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
      console.log('[SSE] 定时推送已停止')
    }
  }

  // 发送心跳保持连接
  startHeartbeat(interval = 30000) {
    setInterval(() => {
      if (this.clients.size > 0) {
        this.broadcast({ type: 'heartbeat', time: new Date().toISOString() }, 'heartbeat')
      }
    }, interval)
  }
}

// 导出单例实例
module.exports = new SSEManager()
