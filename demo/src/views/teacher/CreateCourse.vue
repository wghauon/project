<script setup>
import { ref } from 'vue'
import { uploadService } from '@/api/course'
import { useUserStore } from '@/stores/user'
import router from '@/router'
const useStore = useUserStore()
const coverImageUrl = ref('')
const imgInput = ref(null)
// 收集表单信息
let course_name, category_name, course_type, difficulty, description, hours, credit, status
// 图片预览
const handleCoverUpload = (e) => {
  const file = e.target.files[0]
  if (file) {
    // 生成图片预览URL
    coverImageUrl.value = URL.createObjectURL(file)
  }
}
// 移除图片
const removeCover = () => {
  coverImageUrl.value = ''
  // 重置input的value，否则无法再次选择同一文件
  if (imgInput.value) {
    imgInput.value.value = ''
  }
}
// 创建课程信息
async function upload() {
  const formdata = new FormData()
  formdata.append('file', imgInput.value.files[0])
  formdata.append('course_name', course_name)
  formdata.append('category_name', category_name)
  formdata.append('course_type', course_type)
  formdata.append('difficulty', difficulty)
  formdata.append('description', description)
  formdata.append('hours', hours)
  formdata.append('credit', credit)
  formdata.append('createPerson', useStore.username)
  formdata.append('status', status)
  await uploadService(formdata)
}
</script>
<template>
  <!-- 主内容 -->
  <main class="main-container">
    <div class="page-header">
      <h1 class="page-title">➕ 创建课程</h1>
      <p class="page-subtitle">填写课程信息，创建您的在线课程</p>
    </div>

    <div class="form-card">
      <form>
        <!-- 基本信息 -->
        <div class="form-section">
          <h2 class="section-title">📋 基本信息</h2>
          <div class="form-group">
            <label>课程封面</label>
            <div class="cover-upload" :class="{ 'has-image': coverImageUrl }">
              <img v-if="coverImageUrl" :src="coverImageUrl" class="cover-preview" />
              <div v-else class="upload-placeholder">
                <div class="upload-icon">🖼️</div>
                <div class="upload-text">点击上传课程封面</div>
                <div class="upload-hint">支持 JPG、PNG 格式，建议尺寸 1200x600</div>
              </div>
              <input
                ref="imgInput"
                type="file"
                accept="image/jpeg,image/png"
                @change="handleCoverUpload"
              />
              <button
                v-if="coverImageUrl"
                type="button"
                class="remove-cover"
                @click.stop="removeCover"
              >
                ×
              </button>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>课程名称 <span class="required">*</span></label>
              <input type="text" v-model="course_name" />
            </div>
            <div class="form-group">
              <label>课程分类 <span class="required">*</span></label>
              <select v-model="category_name">
                <option value="">请选择分类</option>
                <option value="cs">计算机科学</option>
                <option value="math">数学</option>
                <option value="physics">物理</option>
                <option value="chemistry">化学</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>课程类型 <span class="required">*</span></label>
              <select v-model="course_type">
                <option value="">请选择类型</option>
                <option value="required">必修课</option>
                <option value="elective">选修课</option>
                <option value="public">公共课</option>
              </select>
            </div>
            <div class="form-group">
              <label>难度等级 <span class="required">*</span></label>
              <select v-model="difficulty">
                <option value="">请选择难度</option>
                <option value="1">入门级</option>
                <option value="2">进阶级</option>
                <option value="3">高级</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>课程简介 <span class="required">*</span></label>
            <textarea
              placeholder="请输入课程简介，介绍课程内容、学习目标等..."
              v-model="description"
            ></textarea>
          </div>
        </div>

        <!-- 课程安排 -->
        <div class="form-section">
          <h2 class="section-title">📅 课程安排</h2>
          <div class="form-row">
            <div class="form-group">
              <label>开课时间 <span class="required">*</span></label>
              <input type="datetime-local" />
            </div>
            <div class="form-group">
              <label>结课时间 <span class="required">*</span></label>
              <input type="datetime-local" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>预计课时 <span class="required">*</span></label>
              <input type="number" placeholder="请输入课时数" v-model="hours" />
            </div>
            <div class="form-group">
              <label>学分 <span class="required">*</span></label>
              <input type="number" placeholder="请输入学分" v-model="credit" />
            </div>
          </div>
        </div>

        <!-- 加入权限 -->
        <div class="form-section">
          <h2 class="section-title">🔒 加入权限</h2>
          <div class="permission-options">
            <label class="permission-item">
              <input type="radio" name="permission" value="open" checked />
              <div class="permission-info">
                <div class="permission-title">公开课程</div>
                <div class="permission-desc">所有学生都可以自由加入课程</div>
              </div>
            </label>
            <label class="permission-item">
              <input type="radio" name="permission" value="apply" />
              <div class="permission-info">
                <div class="permission-title">申请加入</div>
                <div class="permission-desc">学生需要提交申请，经您审核通过后方可加入</div>
              </div>
            </label>
            <label class="permission-item">
              <input type="radio" name="permission" value="code" />
              <div class="permission-info">
                <div class="permission-title">邀请码加入</div>
                <div class="permission-desc">学生需要输入邀请码才能加入课程</div>
              </div>
            </label>
            <label class="permission-item">
              <input type="radio" name="permission" value="close" />
              <div class="permission-info">
                <div class="permission-title">暂不开放</div>
                <div class="permission-desc">暂时不允许学生加入，您可以在之后修改此设置</div>
              </div>
            </label>
          </div>
        </div>

        <!-- 按钮 -->
        <div class="form-actions">
          <button
            type="button"
            class="btn-secondary"
            @click="
              () => {
                status = 0
                upload()
                router.push('/teacher/my-teaching')
              }
            "
          >
            保存草稿
          </button>
          <button
            type="button"
            class="btn-primary"
            @click="
              () => {
                status = 1
                upload()
                router.push('/teacher/my-teaching')
              }
            "
          >
            创建课程
          </button>
        </div>
      </form>
    </div>
  </main>
</template>
<style scoped>
/* 主内容 */
.main-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 32px 20px;
}
.page-header {
  margin-bottom: 32px;
}
.page-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}
.page-subtitle {
  color: #666;
  margin-top: 8px;
}
/* 表单 */
.form-card {
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.form-section {
  margin-bottom: 32px;
}
.form-section:last-child {
  margin-bottom: 0;
}
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f0f0;
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.form-group {
  margin-bottom: 20px;
}
.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-size: 14px;
  font-weight: 500;
}
.form-group label .required {
  color: #f44336;
  margin-left: 4px;
}
.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s;
}
.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
}
.form-group textarea {
  min-height: 120px;
  resize: vertical;
}
/* 封面上传 */
.cover-upload {
  border: 2px dashed #e0e0e0;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
  min-height: 200px;
}
.cover-upload:hover {
  border-color: #667eea;
  background: #f0f4ff;
}
.cover-upload.has-image {
  padding: 0;
  border-style: solid;
}
.cover-upload input[type='file'] {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}
.cover-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.upload-icon {
  font-size: 48px;
  margin-bottom: 12px;
}
.upload-text {
  color: #666;
  font-size: 14px;
}
.upload-hint {
  color: #999;
  font-size: 12px;
  margin-top: 8px;
}
.remove-cover {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}
.remove-cover:hover {
  background: rgba(0, 0, 0, 0.7);
}
/* 权限设置 */
.permission-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.permission-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}
.permission-item:hover {
  background: #f0f4ff;
}
.permission-item input[type='radio'] {
  width: 20px;
  height: 20px;
  accent-color: #667eea;
}
.permission-info {
  flex: 1;
}
.permission-title {
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}
.permission-desc {
  font-size: 13px;
  color: #666;
}
/* 按钮 */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 2px solid #f0f0f0;
}
.btn-secondary {
  padding: 12px 32px;
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
  font-weight: 500;
  cursor: pointer;
}
</style>
