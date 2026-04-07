<script setup>
import { useRoute } from 'vue-router'
import { onMounted, ref } from 'vue'
import { videoUrl } from '@/api/video'

const route = useRoute()
const { video_id } = route.params
const video_url = ref('')
const error = ref('')

onMounted(async () => {
  try {
    const res = await videoUrl(video_id)
    video_url.value = res.data.data
    console.log('视频地址:', video_url.value)
  } catch (err) {
    console.error('获取视频地址失败:', err)
    error.value = '获取视频地址失败'
  }
})
</script>

<template>
  <div class="video-preview">
    <div v-if="error" class="error-message">{{ error }}</div>
    <video v-else-if="video_url" :src="video_url" controls class="video-player"></video>
    <div v-else class="loading">加载中...</div>
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
}
</style>
