<script setup>
import { useRouter, useRoute } from 'vue-router'
import { useTeacherStore } from '@/stores/teacher'
import { ref, watch } from 'vue'
const router = useRouter()
const route = useRoute()
const teacherStore = useTeacherStore()
const selected = ref(1)

// 根据当前路由设置选中状态
const updateSelectedFromRoute = () => {
  const path = route.path
  if (path.includes('/chapter-manage')) {
    selected.value = 1
  } else if (path.includes('/video-manage')) {
    selected.value = 2
  } else if (path.includes('/material-manage')) {
    selected.value = 3
  }
}

// 初始化时设置选中状态
updateSelectedFromRoute()

// 监听路由变化
watch(() => route.path, updateSelectedFromRoute)

function change(s) {
  selected.value = s
}
</script>
<template>
  <aside class="side-menu">
    <div
      class="menu-item"
      :class="{ active: selected === 1 }"
      @click="
        () => {
          router.push(`/teacher/course-manage/${teacherStore.course_id}/chapter-manage`)
          change(1)
        }
      "
    >
      <span class="menu-icon">📑</span>
      <span class="menu-text">章节管理</span>
    </div>
    <div
      class="menu-item"
      :class="{ active: selected === 2 }"
      @click="
        () => {
          router.push(`/teacher/course-manage/${teacherStore.course_id}/video-manage`)
          change(2)
        }
      "
    >
      <span class="menu-icon">📹</span>
      <span class="menu-text">视频管理</span>
    </div>
    <div
      class="menu-item"
      :class="{ active: selected === 3 }"
      @click="
        () => {
          router.push(`/teacher/course-manage/${teacherStore.course_id}/material-manage`)
          change(3)
        }
      "
    >
      <span class="menu-icon">📎</span>
      <span class="menu-text">资料管理</span>
    </div>
    <div class="menu-item">
      <span class="menu-icon">📝</span>
      <span class="menu-text">作业管理</span>
    </div>
    <div class="menu-item">
      <span class="menu-icon">📢</span>
      <span class="menu-text">通知管理</span>
    </div>
    <div class="menu-item">
      <span class="menu-icon">💬</span>
      <span class="menu-text">讨论管理</span>
    </div>
    <div class="menu-item">
      <span class="menu-icon">🧪</span>
      <span class="menu-text">实验管理</span>
    </div>
    <div class="menu-item">
      <span class="menu-icon">📊</span>
      <span class="menu-text">数据统计</span>
    </div>
  </aside>
</template>
<style scoped>
/* 侧边菜单 */
.side-menu {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  height: fit-content;
}
.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 4px;
}
.menu-item:hover {
  background: #f5f7fa;
}
.menu-item.active {
  background: #f0f4ff;
  color: #667eea;
}
.menu-icon {
  font-size: 20px;
}
.menu-text {
  font-size: 14px;
}
</style>
