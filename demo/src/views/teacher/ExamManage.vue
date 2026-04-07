<template>
  <!-- 主内容 -->
  <main class="main-container">
    <div class="page-header">
      <h1 class="page-title">📝 考试管理</h1>
      <button class="btn-primary">➕ 创建考试</button>
    </div>

    <div class="filter-bar">
      <div class="filter-group">
        <label>课程</label>
        <select>
          <option value="">全部课程</option>
          <option value="python">Python程序设计基础</option>
          <option value="ds">数据结构与算法</option>
        </select>
      </div>
      <div class="filter-tabs">
        <button class="active">全部</button>
        <button>未开始</button>
        <button>进行中</button>
        <button>已结束</button>
      </div>
    </div>

    <div class="exam-list">
      <div class="exam-card">
        <div class="exam-header">
          <div class="exam-title-section">
            <h3>Python程序设计期中考试</h3>
            <div class="exam-course">📖 Python程序设计基础</div>
          </div>
          <div class="exam-status">
            <span class="status-badge ongoing">进行中</span>
          </div>
        </div>
        <div class="exam-stats">
          <div class="stat-item">
            <div class="stat-value">86</div>
            <div class="stat-label">应考人数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">72</div>
            <div class="stat-label">已参加</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">14</div>
            <div class="stat-label">未参加</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">84.5</div>
            <div class="stat-label">平均分</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">50</div>
            <div class="stat-label">题目数量</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">120分钟</div>
            <div class="stat-label">考试时长</div>
          </div>
        </div>
        <div class="exam-actions">
          <button class="btn-manage">监考面板</button>
          <button class="btn-secondary">查看成绩</button>
          <button class="btn-secondary">编辑考试</button>
        </div>
      </div>

      <div class="exam-card">
        <div class="exam-header">
          <div class="exam-title-section">
            <h3>数据结构单元测试</h3>
            <div class="exam-course">📖 数据结构与算法</div>
          </div>
          <div class="exam-status">
            <span class="status-badge upcoming">未开始</span>
          </div>
        </div>
        <div class="exam-stats">
          <div class="stat-item">
            <div class="stat-value">64</div>
            <div class="stat-label">应考人数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">0</div>
            <div class="stat-label">已参加</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">64</div>
            <div class="stat-label">未参加</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">-</div>
            <div class="stat-label">平均分</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">40</div>
            <div class="stat-label">题目数量</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">90分钟</div>
            <div class="stat-label">考试时长</div>
          </div>
        </div>
        <div class="exam-actions">
          <button class="btn-manage">题库管理</button>
          <button class="btn-secondary">发布考试</button>
          <button class="btn-secondary">编辑考试</button>
        </div>
      </div>

      <div class="exam-card">
        <div class="exam-header">
          <div class="exam-title-section">
            <h3>计算机导论期末考试</h3>
            <div class="exam-course">📖 计算机导论</div>
          </div>
          <div class="exam-status">
            <span class="status-badge ended">已结束</span>
          </div>
        </div>
        <div class="exam-stats">
          <div class="stat-item">
            <div class="stat-value">136</div>
            <div class="stat-label">应考人数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">132</div>
            <div class="stat-label">已参加</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">4</div>
            <div class="stat-label">未参加</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">81.2</div>
            <div class="stat-label">平均分</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">60</div>
            <div class="stat-label">题目数量</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">120分钟</div>
            <div class="stat-label">考试时长</div>
          </div>
        </div>
        <div class="exam-actions">
          <button class="btn-manage">成绩分析</button>
          <button class="btn-secondary">导出成绩</button>
          <button class="btn-secondary">查看试卷</button>
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
.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}
.filter-group label {
  font-size: 14px;
  color: #666;
}
.filter-group select {
  padding: 8px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
}
.filter-tabs {
  display: flex;
  gap: 8px;
  margin-left: auto;
}
.filter-tabs button {
  padding: 8px 16px;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}
.filter-tabs button.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}
/* 考试列表 */
.exam-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.exam-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.exam-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}
.exam-title-section h3 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}
.exam-course {
  color: #667eea;
  font-size: 14px;
}
.exam-status {
  display: flex;
  gap: 12px;
}
.status-badge {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
}
.status-badge.upcoming {
  background: #e3f2fd;
  color: #2196f3;
}
.status-badge.ongoing {
  background: #e8f5e9;
  color: #4caf50;
}
.status-badge.ended {
  background: #f5f5f5;
  color: #666;
}
.exam-stats {
  display: flex;
  gap: 32px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 16px;
}
.stat-item {
  text-align: center;
}
.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}
.stat-label {
  font-size: 13px;
  color: #666;
  margin-top: 4px;
}
.exam-actions {
  display: flex;
  gap: 12px;
}
.btn-manage {
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}
.btn-secondary {
  padding: 10px 20px;
  background: #f5f7fa;
  color: #667eea;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}
</style>
