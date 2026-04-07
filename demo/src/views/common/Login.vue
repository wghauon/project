<script setup>
import { loginService } from '@/api/login'
import { useUserStore } from '@/stores/user'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()
// 收集表单信息
let username, password
const useStore = useUserStore()
// 切换身份
const role = ref(1)
function selectRole(r) {
  role.value = r
}
// 登录函数
async function login(username, password, role) {
  const res = await loginService(username, password, role)
  console.log(res.data)
  // 存储token
  useStore.setToken(res.data.token)
  // 存储身份
  useStore.setRole(res.data.role)
  // 存储用户ID
  useStore.setUserID(res.data.user_id)
  // 存储用户名
  useStore.setUsername(username)
  // 根据角色跳转
  if (role === 1) {
    router.push('/student')
  } else if (role === 2) {
    router.push('/teacher')
  } else if (role === 3) {
    router.push('/admin')
  } else {
    console.log('跳转失败')
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-container">
      <div class="logo">
        <h1>📚 智慧学堂</h1>
        <p>在线教育平台</p>
      </div>
      <form>
        <div class="form-group">
          <label>选择身份</label>
          <div class="role-select">
            <div class="role-option" :class="{ active: role === 1 }" @click="selectRole(1)">
              <span>👨‍🎓</span>
              <div>学生</div>
            </div>
            <div class="role-option" :class="{ active: role === 2 }" @click="selectRole(2)">
              <span>👨‍🏫</span>
              <div>教师</div>
            </div>
            <div class="role-option" :class="{ active: role === 3 }" @click="selectRole(3)">
              <span>👨‍💼</span>
              <div>管理员</div>
            </div>
          </div>
        </div>
        <div class="form-group">
          <label for="username">用户名</label>
          <input
            type="text"
            id="username"
            placeholder="请输入用户名"
            v-model="username"
            autocomplete="username"
          />
        </div>
        <div class="form-group">
          <label for="password">密码</label>
          <input
            type="password"
            id="password"
            placeholder="请输入密码"
            v-model="password"
            autocomplete="current-password"
          />
        </div>
        <button type="button" class="btn-login" @click="login(username, password, role)">
          登 录
        </button>
        <div class="links">
          <router-link to="/register">注册账号</router-link>
          <a href="#">忘记密码？</a>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.login-page {
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.login-container {
  background: white;
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 420px;
}
.logo {
  text-align: center;
  margin-bottom: 30px;
}
.logo h1 {
  color: #667eea;
  font-size: 28px;
  margin-bottom: 8px;
}
.logo p {
  color: #666;
  font-size: 14px;
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
.form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s;
}
.form-group input:focus {
  outline: none;
  border-color: #667eea;
}
.role-select {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}
.role-option {
  flex: 1;
  text-align: center;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}
.role-option:hover {
  border-color: #667eea;
}
.role-option.active {
  border-color: #667eea;
  background: #f0f4ff;
  color: #667eea;
}
.role-option i {
  display: block;
  font-size: 24px;
  margin-bottom: 4px;
}
.btn-login {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}
.btn-login:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}
.links {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
  font-size: 14px;
}
.links a {
  color: #667eea;
  text-decoration: none;
}
.links a:hover {
  text-decoration: underline;
}
</style>
