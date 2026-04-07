<template>
  <!-- 主内容 -->
  <main class="main-container">
    <div class="page-header">
      <h1 class="page-title">📖 我的课程</h1>
      <div class="course-tabs">
        <button class="active">全部课程</button>
        <button>进行中</button>
        <button>已结束</button>
      </div>
    </div>

    <div class="course-grid">
      <div class="course-card">
        <div class="course-header">
          <span class="course-status">进行中</span>
          <h3 class="course-name">Python程序设计基础</h3>
        </div>
        <div class="course-body">
          <div class="course-teacher">
            <div class="teacher-avatar">👤</div>
            <span>王教授 · 计算机学院</span>
          </div>
          <div class="progress-section">
            <div class="progress-header">
              <span>学习进度</span>
              <span style="color: #667eea; font-weight: bold">65%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: 65%"></div>
            </div>
          </div>
          <div class="course-actions">
            <button class="btn-primary">继续学习</button>
            <button class="btn-secondary">查看详情</button>
          </div>
        </div>
      </div>

      <div class="course-card">
        <div
          class="course-header"
          style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
        >
          <span class="course-status">进行中</span>
          <h3 class="course-name">数据结构与算法</h3>
        </div>
        <div class="course-body">
          <div class="course-teacher">
            <div class="teacher-avatar">👤</div>
            <span>李老师 · 软件学院</span>
          </div>
          <div class="progress-section">
            <div class="progress-header">
              <span>学习进度</span>
              <span style="color: #667eea; font-weight: bold">42%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: 42%"></div>
            </div>
          </div>
          <div class="course-actions">
            <button class="btn-primary">继续学习</button>
            <button class="btn-secondary">查看详情</button>
          </div>
        </div>
      </div>

      <div class="course-card">
        <div
          class="course-header"
          style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
        >
          <span class="course-status">进行中</span>
          <h3 class="course-name">高等数学（上）</h3>
        </div>
        <div class="course-body">
          <div class="course-teacher">
            <div class="teacher-avatar">👤</div>
            <span>张教授 · 数学学院</span>
          </div>
          <div class="progress-section">
            <div class="progress-header">
              <span>学习进度</span>
              <span style="color: #667eea; font-weight: bold">88%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: 88%"></div>
            </div>
          </div>
          <div class="course-actions">
            <button class="btn-primary">继续学习</button>
            <button class="btn-secondary">查看详情</button>
          </div>
        </div>
      </div>

      <div class="course-card">
        <div
          class="course-header"
          style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
        >
          <span class="course-status">已结束</span>
          <h3 class="course-name">大学英语（一）</h3>
        </div>
        <div class="course-body">
          <div class="course-teacher">
            <div class="teacher-avatar">👤</div>
            <span>陈老师 · 外语学院</span>
          </div>
          <div class="progress-section">
            <div class="progress-header">
              <span>学习进度</span>
              <span style="color: #667eea; font-weight: bold">100%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: 100%"></div>
            </div>
          </div>
          <div class="course-actions">
            <button class="btn-primary">复习课程</button>
            <button class="btn-secondary">查看成绩</button>
          </div>
        </div>
      </div>

      <div class="course-card">
        <div
          class="course-header"
          style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
        >
          <span class="course-status">进行中</span>
          <h3 class="course-name">Web前端开发技术</h3>
        </div>
        <div class="course-body">
          <div class="course-teacher">
            <div class="teacher-avatar">👤</div>
            <span>赵老师 · 信息学院</span>
          </div>
          <div class="progress-section">
            <div class="progress-header">
              <span>学习进度</span>
              <span style="color: #667eea; font-weight: bold">23%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: 23%"></div>
            </div>
          </div>
          <div class="course-actions">
            <button class="btn-primary">继续学习</button>
            <button class="btn-secondary">查看详情</button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
<style scoped>
/* 主内容区 */
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
.course-tabs {
  display: flex;
  gap: 8px;
}
.course-tabs button {
  padding: 10px 20px;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}
.course-tabs button.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}
/* 课程卡片 */
.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 24px;
}
.course-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition:
    transform 0.3s,
    box-shadow 0.3s;
}
.course-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}
.course-header {
  height: 140px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: white;
}
.course-status {
  display: inline-block;
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  font-size: 12px;
  width: fit-content;
}
.course-name {
  font-size: 20px;
  font-weight: bold;
}
.course-body {
  padding: 20px;
}
.course-teacher {
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
.progress-section {
  margin-bottom: 16px;
}
.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}
.progress-bar {
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
  transition: width 0.3s;
}
.course-actions {
  display: flex;
  gap: 12px;
}
.btn-primary {
  flex: 1;
  padding: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.2s;
}
.btn-primary:hover {
  transform: translateY(-2px);
}
.btn-secondary {
  padding: 10px 16px;
  background: #f5f7fa;
  color: #667eea;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}
</style>
