<script setup>
import { useRoute } from 'vue-router'
import { onMounted, ref } from 'vue'
import { videoUrl } from '@/api/video'

const route = useRoute()
const video_id = route.params.video_id
const video_url = ref('')
const error = ref('')
const loading = ref(true)

onMounted(async () => {
  if (!video_id) {
    error.value = '缺少视频ID'
    loading.value = false
    return
  }

  try {
    const res = await videoUrl(video_id)
    console.log('视频URL响应:', res.data)

    if (res.data.status === 0) {
      video_url.value = res.data.data
      console.log('视频地址:', video_url.value)
    } else {
      error.value = res.data.message || '获取视频地址失败'
    }
  } catch (err) {
    console.error('获取视频地址失败:', err)
    error.value = '获取视频地址失败: ' + (err.message || '未知错误')
  } finally {
    loading.value = false
  }
})

// 视频加载错误处理
const handleVideoError = (e) => {
  console.error('视频加载失败:', e)
  error.value = '视频加载失败，请检查视频文件是否存在'
}
</script>

<template>
  <div class="video-preview">
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="error" class="error-message">
      <p>{{ error }}</p>
      <button class="btn-back" @click="$router.back()">返回</button>
    </div>
    <div v-else-if="video_url" class="video-container">
      <video
        :src="video_url"
        controls
        class="video-player"
        @error="handleVideoError"
        preload="metadata"
      ></video>
      <div class="video-info">
        <p>视频URL: {{ video_url }}</p>
      </div>
    </div>
    <div v-else class="error-message">
      <p>无法获取视频地址</p>
      <button class="btn-back" @click="$router.back()">返回</button>
    </div>
  </div>
</template>

<style scoped>
.video-preview {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
}

.video-player {
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
}

.error-message,
.loading {
  color: #fff;
  font-size: 16px;
  text-align: center;
}

.error-message p {
  margin-bottom: 20px;
}

.btn-back {
  padding: 10px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}

.btn-back:hover {
  opacity: 0.9;
}

.video-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.video-info {
  position: absolute;
  bottom: 20px;
  left: 20px;
  color: #fff;
  font-size: 12px;
  background: rgba(0, 0, 0, 0.5);
  padding: 10px;
  border-radius: 4px;
  max-width: 80%;
  word-break: break-all;
}
</style>
