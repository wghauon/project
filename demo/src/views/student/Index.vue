<script setup>
import StudentNavigator from '@/components/StudentNavigator.vue'
</script>
<template>
  <!-- 导航栏 -->
  <StudentNavigator></StudentNavigator>
  <!-- 二级路由 -->
  <router-view></router-view>
</template>

<style scoped></style>
