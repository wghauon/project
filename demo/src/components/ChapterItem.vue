<template>
  <div class="chapter-item">
    <div class="chapter-header">
      <span class="chapter-title">第1章：Python基础入门</span>
      <div class="chapter-actions">
        <button class="btn-icon">➕ 添加课时</button>
        <button class="btn-icon">✏️ 编辑</button>
        <button class="btn-icon">🗑️ 删除</button>
      </div>
    </div>
    <div class="lesson-list">
      <div class="lesson-item">
        <div class="lesson-info">
          <span class="lesson-type">视频</span>
          <span class="lesson-name">1.1 Python简介与安装</span>
        </div>
        <span class="lesson-duration">⏱️ 15:30</span>
      </div>
      <div class="lesson-item">
        <div class="lesson-info">
          <span class="lesson-type">视频</span>
          <span class="lesson-name">1.2 第一个Python程序</span>
        </div>
        <span class="lesson-duration">⏱️ 20:15</span>
      </div>
      <div class="lesson-item">
        <div class="lesson-info">
          <span class="lesson-type">视频</span>
          <span class="lesson-name">1.3 基础语法</span>
        </div>
        <span class="lesson-duration">⏱️ 25:00</span>
      </div>
    </div>
  </div>
</template>
<style scoped>
.chapter-item {
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
}
.chapter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f5f7fa;
}
.chapter-title {
  font-weight: 600;
  color: #333;
}
.chapter-actions {
  display: flex;
  gap: 8px;
}
.btn-icon {
  padding: 6px 12px;
  background: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}
.lesson-list {
  padding: 12px 20px;
}
.lesson-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
}
.lesson-item:last-child {
  border-bottom: none;
}
.lesson-info {
  display: flex;
  align-items: center;
  gap: 12px;
}
.lesson-type {
  padding: 4px 10px;
  background: #e3f2fd;
  color: #2196f3;
  border-radius: 4px;
  font-size: 12px;
}
.lesson-name {
  color: #333;
}
.lesson-duration {
  color: #999;
  font-size: 13px;
}
</style>
