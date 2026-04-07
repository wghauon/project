<script setup>
import { videUpload } from '@/utils/videoUpload'
import { ref } from 'vue'
const file = ref(null)
// 收集表单信息
let video_name, description

// 存储选中的文件名
const selectedFileName = ref('')

// 处理文件选择
const handleFileChange = (event) => {
  const selectedFile = event.target.files[0]
  if (selectedFile) {
    selectedFileName.value = selectedFile.name
  }
}
</script>
<template>
  <!-- 主内容 -->
  <main class="main-container">
    <div class="page-header">
      <h1 class="page-title">📤 上传视频</h1>
      <p class="page-subtitle">Python程序设计基础 - 上传课程视频内容</p>
    </div>

    <!-- 上传区域 -->
    <div class="upload-card">
      <div class="upload-area">
        <div v-if="!selectedFileName">
          <div class="upload-icon">📹</div>
          <h2 class="upload-title">拖拽视频文件到此处</h2>
          <p class="upload-subtitle">或点击选择文件上传</p>
        </div>
        <div v-else class="selected-file-info">
          <div class="file-icon">🎬</div>
          <div class="file-name-display">{{ selectedFileName }}</div>
          <label for="video-upload" class="btn-change-file">更换文件</label>
        </div>
        <input
          type="file"
          id="video-upload"
          class="file-input"
          accept="video/*"
          ref="file"
          @change="handleFileChange"
        />
        <label v-if="!selectedFileName" for="video-upload" class="btn-upload">选择文件</label>

        <div class="upload-formats">
          <p class="format-title">支持格式</p>
          <div class="format-list">
            <span class="format-item">📹 MP4</span>
            <span class="format-item">📹 AVI</span>
            <span class="format-item">📹 MOV</span>
            <span class="format-item">📹 MKV</span>
            <span class="format-item">📹 FLV</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 上传进度（示例） -->
    <!-- <div class="upload-progress active">
      <div class="progress-header">
        <h3 class="progress-title">正在上传</h3>
        <span class="progress-status">65%</span>
      </div>
      <div class="progress-file">
        <div class="file-icon">🎬</div>
        <div class="file-info">
          <div class="file-name">4.1 面向对象编程概述.mp4</div>
          <div class="file-size">256 MB</div>
        </div>
        <button class="file-cancel">取消上传</button>
      </div>
      <div class="progress-bar-container">
        <div class="progress-bar" style="width: 65%"></div>
      </div>
      <div class="progress-text">
        <span>已上传 166 MB</span>
        <span>预计剩余 30 秒</span>
      </div>
    </div> -->

    <!-- 视频信息表单 -->
    <div class="form-card">
      <div class="form-section">
        <h2 class="section-title">📋 视频基本信息</h2>

        <div class="form-group">
          <label class="form-label">视频标题 <span class="required">*</span></label>
          <input type="text" class="form-input" placeholder="请输入视频标题" v-model="video_name" />
          <p class="form-hint">建议标题简洁明了，包含章节信息，如：4.1 面向对象编程概述</p>
        </div>

        <!-- <div class="form-row">
          <div class="form-group">
            <label class="form-label">所属章节 <span class="required">*</span></label>
            <select class="form-select">
              <option value="">请选择章节</option>
              <option value="ch1">第1章：Python基础入门</option>
              <option value="ch2">第2章：数据类型与运算符</option>
              <option value="ch3">第3章：函数与模块</option>
              <option value="ch4">第4章：面向对象编程</option>
              <option value="ch5">第5章：文件操作与异常处理</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">课时序号 <span class="required">*</span></label>
            <select class="form-select">
              <option value="1" selected>第1课时</option>
              <option value="2">第2课时</option>
              <option value="3">第3课时</option>
              <option value="4">第4课时</option>
              <option value="5">第5课时</option>
            </select>
          </div>
        </div> -->

        <div class="form-group">
          <label class="form-label">视频简介</label>
          <textarea
            class="form-textarea"
            placeholder="请输入视频内容简介，帮助学生了解本节课的学习目标..."
            v-model="description"
          ></textarea>
        </div>
      </div>

      <!-- <div class="form-section">
        <h2 class="section-title">🖼️ 视频封面</h2>

        <div class="cover-upload">
          <div class="cover-preview">🎬</div>
          <div class="cover-options">
            <button class="cover-btn">📤 上传自定义封面</button>
            <p class="form-hint" style="margin-bottom: 12px">或使用系统推荐封面</p>
            <div class="cover-templates">
              <div
                class="cover-template selected"
                style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              ></div>
              <div
                class="cover-template"
                style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
              ></div>
              <div
                class="cover-template"
                style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
              ></div>
              <div
                class="cover-template"
                style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
              ></div>
              <div
                class="cover-template"
                style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
              ></div>
            </div>
          </div>
        </div>
      </div> -->

      <!-- <div class="form-section">
        <h2 class="section-title">⚙️ 发布设置</h2>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">发布状态</label>
            <select class="form-select">
              <option value="published" selected>立即发布</option>
              <option value="draft">保存为草稿</option>
              <option value="scheduled">定时发布</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">发布时间（定时发布时必填）</label>
            <input type="datetime-local" class="form-input" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">学习权限</label>
          <select class="form-select">
            <option value="public" selected>公开 - 所有学生可见</option>
            <option value="enrolled">选课学生 - 仅选课学生可见</option>
            <option value="vip">VIP专享 - 付费学生可见</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">标签（可选，用逗号分隔）</label>
          <input type="text" class="form-input" placeholder="如：Python, 面向对象, 类, 对象" />
        </div>
      </div> -->

      <!-- 按钮组 -->
      <div class="form-actions">
        <button class="btn-secondary">取消</button>
        <button class="btn-secondary">保存为草稿</button>
        <button class="btn-primary" @click="videUpload(file.files[0], video_name, description)">
          ✓ 确认上传
        </button>
      </div>
    </div>
  </main>
</template>
<style scoped>
/* 主内容 */
.main-container {
  max-width: 1000px;
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

/* 上传区域 */
.upload-card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 24px;
}
.upload-area {
  border: 3px dashed #e0e0e0;
  border-radius: 16px;
  padding: 60px 40px;
  text-align: center;
  transition: all 0.3s;
  cursor: pointer;
}
.upload-area:hover {
  border-color: #667eea;
  background: #f0f4ff;
}
.upload-area.dragover {
  border-color: #667eea;
  background: #f0f4ff;
  transform: scale(1.02);
}
.upload-icon {
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  font-size: 48px;
}
.upload-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}
.upload-subtitle {
  font-size: 14px;
  color: #666;
  margin-bottom: 24px;
}
.file-input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
.btn-upload {
  display: inline-block;
  padding: 14px 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.3s;
}
.btn-upload:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}
.upload-formats {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #f0f0f0;
}
.format-title {
  font-size: 13px;
  color: #999;
  margin-bottom: 12px;
}
.format-list {
  display: flex;
  justify-content: center;
  gap: 16px;
}
.format-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #f5f7fa;
  border-radius: 6px;
  font-size: 13px;
  color: #666;
}
/* 选中文件信息显示 */
.selected-file-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}
.selected-file-info .file-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
}
.file-name-display {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 20px;
}
.btn-change-file {
  display: inline-block;
  padding: 10px 24px;
  background: #f5f7fa;
  color: #667eea;
  border: 2px solid #667eea;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}
.btn-change-file:hover {
  background: #667eea;
  color: white;
}
/* 上传进度 */
.upload-progress {
  display: none;
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 24px;
}
.upload-progress.active {
  display: block;
}
.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.progress-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}
.progress-status {
  font-size: 14px;
  color: #667eea;
}
.progress-file {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 16px;
}
.file-icon {
  width: 48px;
  height: 48px;
  background: #667eea;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
}
.file-info {
  flex: 1;
}
.file-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}
.file-size {
  font-size: 12px;
  color: #999;
}
.file-cancel {
  padding: 8px 16px;
  background: #ffebee;
  color: #f44336;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}
.progress-bar-container {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}
.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
  transition: width 0.3s;
}
.progress-text {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #666;
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
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
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
  min-height: 100px;
  resize: vertical;
}
.form-hint {
  font-size: 12px;
  color: #999;
  margin-top: 6px;
}
/* 封面上传 */
.cover-upload {
  display: flex;
  gap: 20px;
}
.cover-preview {
  width: 200px;
  height: 120px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 48px;
}
.cover-options {
  flex: 1;
}
.cover-btn {
  padding: 12px 24px;
  background: #f5f7fa;
  border: 2px dashed #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}
.cover-templates {
  display: flex;
  gap: 8px;
}
.cover-template {
  width: 60px;
  height: 36px;
  border-radius: 4px;
  cursor: pointer;
  border: 2px solid transparent;
}
.cover-template.selected {
  border-color: #667eea;
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
.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
