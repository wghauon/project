<template>
  <main class="main-container">
    <div class="page-header">
      <h1 class="page-title">🎥 在线课堂</h1>
      <button class="btn-primary">➕ 创建课堂</button>
    </div>

    <div class="filter-bar">
      <div class="filter-tabs">
        <button class="active">全部</button>
        <button>进行中</button>
        <button>即将开始</button>
        <button>已结束</button>
      </div>
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input type="text" placeholder="搜索课堂..." />
      </div>
    </div>

    <div class="room-grid">
      <div class="room-card">
        <div class="room-header">
          <span class="room-status live">🔴 直播中</span>
          <h3 class="room-title">Python程序设计 - 第5章答疑</h3>
        </div>
        <div class="room-body">
          <div class="room-teacher">
            <div class="teacher-avatar">👤</div>
            <span>王教授 · Python程序设计基础</span>
          </div>
          <div class="room-meta">
            <span>👥 45人在线</span>
            <span>⏱️ 已进行 32分钟</span>
          </div>
          <div class="room-actions">
            <button class="btn-join live">立即加入</button>
            <button class="btn-secondary">详情</button>
          </div>
        </div>
      </div>

      <div class="room-card">
        <div
          class="room-header"
          style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
        >
          <span class="room-status live">🔴 直播中</span>
          <h3 class="room-title">数据结构 - 链表专题讲解</h3>
        </div>
        <div class="room-body">
          <div class="room-teacher">
            <div class="teacher-avatar">👤</div>
            <span>李老师 · 数据结构与算法</span>
          </div>
          <div class="room-meta">
            <span>👥 38人在线</span>
            <span>⏱️ 已进行 15分钟</span>
          </div>
          <div class="room-actions">
            <button class="btn-join live">立即加入</button>
            <button class="btn-secondary">详情</button>
          </div>
        </div>
      </div>

      <div class="room-card">
        <div
          class="room-header"
          style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
        >
          <span class="room-status">⏰ 即将开始</span>
          <h3 class="room-title">高等数学 - 定积分习题课</h3>
        </div>
        <div class="room-body">
          <div class="room-teacher">
            <div class="teacher-avatar">👤</div>
            <span>张教授 · 高等数学（上）</span>
          </div>
          <div class="room-meta">
            <span>📅 今天 14:00</span>
            <span>⏱️ 预计90分钟</span>
          </div>
          <div class="room-actions">
            <button class="btn-join">预约提醒</button>
            <button class="btn-secondary">详情</button>
          </div>
        </div>
      </div>

      <div class="room-card">
        <div
          class="room-header"
          style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
        >
          <span class="room-status">⏰ 即将开始</span>
          <h3 class="room-title">Web前端 - Vue3实战</h3>
        </div>
        <div class="room-body">
          <div class="room-teacher">
            <div class="teacher-avatar">👤</div>
            <span>陈老师 · Web前端开发技术</span>
          </div>
          <div class="room-meta">
            <span>📅 明天 10:00</span>
            <span>⏱️ 预计120分钟</span>
          </div>
          <div class="room-actions">
            <button class="btn-join">预约提醒</button>
            <button class="btn-secondary">详情</button>
          </div>
        </div>
      </div>

      <div class="room-card">
        <div
          class="room-header"
          style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
        >
          <span class="room-status">✅ 已结束</span>
          <h3 class="room-title">Python - 期中复习课</h3>
        </div>
        <div class="room-body">
          <div class="room-teacher">
            <div class="teacher-avatar">👤</div>
            <span>王教授 · Python程序设计基础</span>
          </div>
          <div class="room-meta">
            <span>📅 2024-03-20</span>
            <span>⏱️ 时长 90分钟</span>
          </div>
          <div class="room-actions">
            <button class="btn-join">观看回放</button>
            <button class="btn-secondary">详情</button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
<style scoped>
/* 主内容 */
.main-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px 20px;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.page-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}
.btn-primary {
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}
/* 筛选栏 */
.filter-bar {
  background: white;
  padding: 16px 20px;
  border-radius: 12px;
  margin-bottom: 24px;
  display: flex;
  gap: 16px;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.filter-tabs {
  display: flex;
  gap: 8px;
}
.filter-tabs button {
  padding: 10px 20px;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}
.filter-tabs button.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}
.search-box {
  position: relative;
  margin-left: auto;
}
.search-box input {
  width: 280px;
  padding: 10px 16px 10px 40px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
}
.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
}
/* 课堂列表 */
.room-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 24px;
}
.room-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s;
}
.room-card:hover {
  transform: translateY(-4px);
}
.room-header {
  height: 140px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: white;
  position: relative;
}
.room-status {
  display: inline-block;
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  font-size: 12px;
  width: fit-content;
}
.room-status.live {
  background: #f44336;
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
.room-title {
  font-size: 20px;
  font-weight: bold;
}
.room-body {
  padding: 20px;
}
.room-teacher {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  color: #666;
}
.teacher-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.room-meta {
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
  font-size: 13px;
  color: #999;
}
.room-meta span {
  display: flex;
  align-items: center;
  gap: 6px;
}
.room-actions {
  display: flex;
  gap: 12px;
}
.btn-join {
  flex: 1;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}
.btn-join.live {
  background: #f44336;
  animation: pulse 2s infinite;
}
.btn-secondary {
  padding: 12px 16px;
  background: #f5f7fa;
  color: #667eea;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}
</style>
