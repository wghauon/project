<script setup>
import SearchBox from '@/components/SearchBox.vue'
import VideoItem from '@/components/VideoItem.vue'
import router from '@/router'
import { ref, onMounted } from 'vue'
import { useTeacherStore } from '@/stores/teacher'
import { videoSearch } from '@/api/video'
const teacherStore = useTeacherStore()
const videoList = ref([])
onMounted(async () => {
  const res = await videoSearch(teacherStore.course_id)
  videoList.value = res.data.data
})
</script>

<template>
  <div class="content-area">
    <div class="content-header">
      <h2 class="content-title">📹 视频管理</h2>
      <button class="btn-primary" @click="router.push('/teacher/video-upload')">➕ 上传视频</button>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">{{ videoList.length }}</div>
        <div class="stat-label">视频总数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">28</div>
        <div class="stat-label">已发布</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">3</div>
        <div class="stat-label">处理中</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">1</div>
        <div class="stat-label">草稿</div>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="filter-group">
        <select>
          <option value="">全部状态</option>
          <option value="published">已发布</option>
          <option value="draft">草稿</option>
          <option value="processing">处理中</option>
        </select>
        <select>
          <option value="">全部章节</option>
          <option value="ch1">第1章：Python基础入门</option>
          <option value="ch2">第2章：数据类型与运算符</option>
          <option value="ch3">第3章：函数与模块</option>
        </select>
      </div>
      <SearchBox></SearchBox>
    </div>

    <!-- 视频列表 -->
    <div class="video-list">
      <VideoItem v-for="item in videoList" :key="item.video_id" :item="item"></VideoItem>
    </div>

    <!-- 分页 -->
    <div class="pagination">
      <button>上一页</button>
      <button class="active">1</button>
      <button>2</button>
      <button>3</button>
      <button>下一页</button>
    </div>
  </div>
</template>
<style scoped>
/* 内容区 */
.content-area {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.content-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}
/* 按钮样式 */
.btn-primary {
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}
/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}
.stat-card {
  background: #f5f7fa;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
}
.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 4px;
}
.stat-label {
  font-size: 13px;
  color: #666;
}
/* 工具栏 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 10px;
}
.filter-group {
  display: flex;
  gap: 12px;
}
.filter-group select,
.filter-group input {
  padding: 8px 14px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
}
.search-box {
  position: relative;
}
.search-box input {
  width: 240px;
  padding-left: 36px;
}
.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
}
/* 视频列表 */
.video-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 24px;
}
.pagination button {
  padding: 10px 16px;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}
.pagination button.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}
</style>
