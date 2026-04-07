<script setup>
import LessonItem from '@/components/LessonItem.vue'
import { ref } from 'vue'
const select = ref(null)
const lessonList = ref([])
let chapter_no, chapter_name, description
function change(s) {
  select.value = s
  chapter_no = s
  console.log(chapter_no)
}
</script>
<template>
  <!-- 主内容 -->
  <main class="main-container">
    <div class="page-header">
      <h1 class="page-title">➕ 添加章节</h1>
      <p class="page-subtitle">Python程序设计基础 - 为课程添加新章节和课时内容</p>
    </div>

    <div class="form-card">
      <!-- 基本信息 -->
      <div class="form-section">
        <h2 class="section-title">📋 章节基本信息</h2>

        <div class="form-group">
          <label class="form-label">章节序号 <span class="required">*</span></label>
          <div class="chapter-number-options">
            <div
              class="chapter-number-option"
              :class="{ selected: select === 1 }"
              @click="change(1)"
            >
              第1章
            </div>
            <div
              class="chapter-number-option"
              :class="{ selected: select === 2 }"
              @click="change(2)"
            >
              第2章
            </div>
            <div
              class="chapter-number-option"
              :class="{ selected: select === 3 }"
              @click="change(3)"
            >
              第3章
            </div>
            <div
              class="chapter-number-option"
              :class="{ selected: select === 4 }"
              @click="change(4)"
            >
              第4章
            </div>
            <div
              class="chapter-number-option"
              :class="{ selected: select === 5 }"
              @click="change(5)"
            >
              第5章
            </div>
            <!-- <div
              class="chapter-number-option custom"
              :class="{ selected: select === 6 }"
              @click="change(6)"
            >
              自定义 <input type="number" placeholder="6" min="1" />
            </div> -->
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">章节标题 <span class="required">*</span></label>
          <input
            type="text"
            class="form-input"
            placeholder="请输入章节标题，如：面向对象编程"
            v-model="chapter_name"
          />
          <p class="form-hint">建议标题简洁明了，不超过30个字符</p>
        </div>

        <div class="form-group">
          <label class="form-label">章节简介</label>
          <textarea
            class="form-textarea"
            placeholder="请输入章节内容简介，帮助学生了解本章学习目标..."
            v-model="description"
          ></textarea>
          <p class="form-hint">简要描述本章的主要内容和知识点</p>
        </div>
      </div>

      <!-- 课时内容 -->
      <div class="form-section">
        <h2 class="section-title">📹 课时内容</h2>

        <div class="lesson-list">
          <LessonItem v-for="item in lessonList" :key="item" :lessonNumber="item"></LessonItem>
        </div>

        <button
          class="btn-add-lesson"
          style="margin-top: 12px"
          @click="
            () => {
              lessonList.push(lessonList.length + 1)
            }
          "
        >
          ➕ 添加课时
        </button>
      </div>

      <!-- 发布设置 -->
      <div class="form-section">
        <h2 class="section-title">⚙️ 发布设置</h2>

        <div class="switch-group">
          <div class="switch-label">
            立即发布
            <span class="sub">开启后学生可立即查看本章内容</span>
          </div>
          <label class="switch">
            <input type="checkbox" checked />
            <span class="slider"></span>
          </label>
        </div>

        <div class="form-group" style="margin-top: 20px">
          <label class="form-label">发布时间（可选）</label>
          <input type="datetime-local" class="form-input" />
          <p class="form-hint">设置定时发布时间，留空则立即发布</p>
        </div>

        <div class="form-group">
          <label class="form-label">学习要求</label>
          <select class="form-select">
            <option value="">请选择学习要求</option>
            <option value="optional">选修 - 学生可自由学习</option>
            <option value="required" selected>必修 - 必须完成本章学习</option>
            <option value="advanced">进阶 - 建议有基础后学习</option>
          </select>
        </div>
      </div>

      <!-- 按钮组 -->
      <div class="form-actions">
        <button class="btn-secondary">取消</button>
        <button class="btn-secondary">保存为草稿</button>
        <button class="btn-primary">✓ 确认添加</button>
      </div>
    </div>
  </main>
</template>
<style>
/* 主内容 */
.main-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px 20px;
}
/* 页面标题 */
.page-header {
  margin-bottom: 24px;
}
.page-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}
.page-subtitle {
  font-size: 14px;
  color: #666;
  margin-top: 8px;
}
/* 表单卡片 */
.form-card {
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.form-section {
  margin-bottom: 28px;
}
.form-section:last-child {
  margin-bottom: 0;
}
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f0f0;
}
.form-group {
  margin-bottom: 20px;
}
.form-group:last-child {
  margin-bottom: 0;
}
.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}
.form-label .required {
  color: #f44336;
  margin-left: 4px;
}
.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s;
}
.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #667eea;
}
.form-textarea {
  min-height: 120px;
  resize: vertical;
}
.form-hint {
  font-size: 12px;
  color: #999;
  margin-top: 6px;
}
/* 章节序号选择 */
.chapter-number-options {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.chapter-number-option {
  padding: 12px 24px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
}
.chapter-number-option:hover {
  border-color: #667eea;
}
.chapter-number-option.selected {
  background: #667eea;
  color: white;
  border-color: #667eea;
}
.chapter-number-option.custom {
  display: flex;
  align-items: center;
  gap: 8px;
}
.chapter-number-option.custom input {
  width: 60px;
  padding: 4px 8px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  text-align: center;
}
/* 开关 */
.switch-group {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}
.switch-label {
  font-size: 14px;
  color: #333;
}
.switch-label .sub {
  font-size: 12px;
  color: #999;
  display: block;
  margin-top: 4px;
}
.switch {
  position: relative;
  width: 50px;
  height: 26px;
}
.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.4s;
  border-radius: 26px;
}
.slider:before {
  position: absolute;
  content: '';
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
}
input:checked + .slider {
  background-color: #667eea;
}
input:checked + .slider:before {
  transform: translateX(24px);
}
/* 课时列表 */
.lesson-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.btn-add-lesson {
  width: 100%;
  padding: 14px;
  background: white;
  border: 2px dashed #667eea;
  color: #667eea;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
/* 按钮组 */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 2px solid #f0f0f0;
}
.btn-secondary {
  padding: 12px 24px;
  background: #f5f7fa;
  color: #666;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}
.btn-primary {
  padding: 12px 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}
</style>
