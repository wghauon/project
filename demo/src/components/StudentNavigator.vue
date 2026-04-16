<script setup lang="ts">
import SearchBox from './SearchBox.vue'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const router = useRouter()

// 退出登录
const handleLogout = () => {
  if (confirm('确定要退出登录吗？')) {
    userStore.logout()
    router.push('/')
  }
}
</script>

<template>
  <!-- 导航栏 -->
  <nav class="navbar">
    <div class="nav-container">
      <div class="logo">
        <span>📚</span>
        <span>智慧学堂</span>
      </div>
      <div class="nav-menu">
        <router-link to="/student/class">课程广场</router-link>
        <router-link to="/student/my-courses">我的课程</router-link>
        <router-link to="/student/exams">考试中心</router-link>
        <router-link to="/student/room-list">在线课堂</router-link>
        <router-link to="/student/ai-chat">🤖 AI答疑</router-link>
        <router-link to="/student/announcements">公告查看</router-link>
      </div>
      <div class="nav-right">
        <SearchBox></SearchBox>
        <div class="user-info">
          <div class="avatar">{{ userStore.username ? userStore.username.charAt(0) : 'U' }}</div>
          <span>{{ userStore.username || '用户' }}</span>
        </div>
        <button class="btn-logout" @click="handleLogout">退出</button>
      </div>
    </div>
  </nav>
</template>

<style scoped>
/* 顶部导航 */
.navbar {
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}
.nav-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}
.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 24px;
  font-weight: bold;
  color: #667eea;
}
.nav-menu {
  display: flex;
  gap: 32px;
}
.nav-menu a {
  text-decoration: none;
  color: #333;
  font-size: 15px;
  font-weight: 500;
  transition: color 0.3s;
}
.nav-menu a:hover,
.nav-menu a.active {
  color: #667eea;
}
.nav-right {
  display: flex;
  align-items: center;
  gap: 20px;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
}
.btn-logout {
  padding: 6px 14px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  transition: all 0.3s;
}
.btn-logout:hover {
  background: #ff4d4f;
  color: white;
  border-color: #ff4d4f;
}
</style>
