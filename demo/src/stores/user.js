import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

export const useUserStore = defineStore(
  'user',
  () => {
    const accessToken = ref('')
    const refreshToken = ref('')
    const role = ref('')
    const user_id = ref('')
    const username = ref('')
    const real_name = ref('')
    
    // 是否正在刷新token的标志
    const isRefreshing = ref(false)
    // 等待token刷新的请求队列
    const pendingRequests = ref([])

    const setAccessToken = (t) => {
      accessToken.value = t
    }
    
    const setRefreshToken = (t) => {
      refreshToken.value = t
    }
    
    const setRole = (r) => {
      role.value = r
    }
    
    const setUserID = (i) => {
      user_id.value = i
    }
    
    const setUsername = (u) => {
      username.value = u
    }
    
    const setRealName = (n) => {
      real_name.value = n
    }

    // 设置登录信息（双token）
    const setLoginInfo = (data) => {
      accessToken.value = data.accessToken || ''
      refreshToken.value = data.refreshToken || ''
      user_id.value = data.user_id || ''
      role.value = data.role || ''
      username.value = data.username || ''
      real_name.value = data.real_name || ''
    }

    // 刷新access token
    const refreshAccessToken = async () => {
      // 如果正在刷新，返回一个Promise，等待刷新完成
      if (isRefreshing.value) {
        return new Promise((resolve) => {
          pendingRequests.value.push(resolve)
        })
      }

      isRefreshing.value = true

      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000'
        const res = await axios.post(`${apiBaseUrl}/api/refresh`, {
          refreshToken: refreshToken.value
        })

        if (res.data.status === 0) {
          // 更新token
          accessToken.value = res.data.accessToken
          refreshToken.value = res.data.refreshToken

          // 执行等待中的请求
          pendingRequests.value.forEach(resolve => resolve(accessToken.value))
          pendingRequests.value = []

          return accessToken.value
        } else {
          throw new Error(res.data.message)
        }
      } catch (error) {
        // 刷新失败，清除登录信息
        logout()
        pendingRequests.value = []
        throw error
      } finally {
        isRefreshing.value = false
      }
    }

    // 退出登录
    const logout = () => {
      accessToken.value = ''
      refreshToken.value = ''
      role.value = ''
      user_id.value = ''
      username.value = ''
      real_name.value = ''
      isRefreshing.value = false
      pendingRequests.value = []
    }

    return {
      accessToken,
      refreshToken,
      role,
      user_id,
      username,
      real_name,
      isRefreshing,
      pendingRequests,
      setAccessToken,
      setRefreshToken,
      setRole,
      setUserID,
      setUsername,
      setRealName,
      setLoginInfo,
      refreshAccessToken,
      logout,
    }
  },
  {
    persist: true, // 持久化
  },
)
