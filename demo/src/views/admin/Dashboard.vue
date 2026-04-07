<template>
  <!-- 主内容 -->
  <main class="main-container">
    <h1 class="page-title">📊 系统概览</h1>

    <!-- 统计数据 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon blue">👨‍🎓</div>
        <div class="stat-info">
          <h3>2,856</h3>
          <p>学生总数</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">👨‍🏫</div>
        <div class="stat-info">
          <h3>186</h3>
          <p>教师总数</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon orange">📚</div>
        <div class="stat-info">
          <h3>324</h3>
          <p>课程总数</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon purple">📝</div>
        <div class="stat-info">
          <h3>1,245</h3>
          <p>考试总数</p>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-section">
      <div class="chart-card">
        <h2 class="chart-title">📈 用户增长趋势</h2>
        <div class="chart-placeholder">用户增长趋势图表</div>
      </div>
      <div class="chart-card">
        <h2 class="chart-title">📊 课程分类占比</h2>
        <div class="chart-placeholder">课程分类饼图</div>
      </div>
    </div>

    <!-- 待办事项 -->
    <div class="todo-section">
      <div class="todo-card">
        <div class="todo-header">
          <h2 class="todo-title">⏳ 待审核课程</h2>
          <span class="todo-badge">5 待处理</span>
        </div>
        <div class="todo-list">
          <div class="todo-item">
            <span class="todo-text">机器学习基础 - 李教授</span>
            <button class="todo-action">去审核</button>
          </div>
          <div class="todo-item">
            <span class="todo-text">深度学习入门 - 张老师</span>
            <button class="todo-action">去审核</button>
          </div>
          <div class="todo-item">
            <span class="todo-text">云计算技术 - 王教授</span>
            <button class="todo-action">去审核</button>
          </div>
        </div>
      </div>
      <div class="todo-card">
        <div class="todo-header">
          <h2 class="todo-title">🚨 系统告警</h2>
          <span class="todo-badge">2 待处理</span>
        </div>
        <div class="todo-list">
          <div class="todo-item">
            <span class="todo-text">存储空间使用率超过 85%</span>
            <button class="todo-action">查看</button>
          </div>
          <div class="todo-item">
            <span class="todo-text">3个用户账号异常登录</span>
            <button class="todo-action">查看</button>
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
.page-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 24px;
}
/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}
.stat-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 16px;
}
.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}
.stat-icon.blue {
  background: #e3f2fd;
}
.stat-icon.green {
  background: #e8f5e9;
}
.stat-icon.orange {
  background: #fff3e0;
}
.stat-icon.purple {
  background: #f3e5f5;
}
.stat-info h3 {
  font-size: 28px;
  font-weight: bold;
  color: #333;
}
.stat-info p {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}
/* 图表区域 */
.charts-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  margin-bottom: 32px;
}
.chart-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
}
.chart-placeholder {
  height: 280px;
  background: #f5f7fa;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
}
/* 待办事项 */
.todo-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}
.todo-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.todo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.todo-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}
.todo-badge {
  padding: 4px 10px;
  background: #ffebee;
  color: #f44336;
  border-radius: 10px;
  font-size: 12px;
}
.todo-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.todo-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
}
.todo-text {
  color: #333;
  font-size: 14px;
}
.todo-action {
  padding: 6px 12px;
  background: white;
  color: #667eea;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
}
</style>
