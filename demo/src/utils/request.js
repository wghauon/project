import axios from 'axios'
import { useUserStore } from '@/stores/user'
import router from '@/router'

const instance = axios.create({
  baseURL: 'http://127.0.0.1:3000',
  timeout: 10000,
})

// 添加请求拦截器
instance.interceptors.request.use(
  function (config) {
    // 在发送请求之前做些什么
    const userStore = useUserStore()
    if (userStore.accessToken) {
      config.headers.Authorization = userStore.accessToken
    }
    // 如果数据是 FormData，删除 Content-Type 让浏览器自动设置（包含 boundary）
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    return config
  },
  function (error) {
    // 对请求错误做些什么
    return Promise.reject(error)
  },
)

// 用于标记是否正在刷新token
let isRefreshing = false
// 等待token刷新的请求队列
let pendingRequests = []

// 执行等待中的请求
function executePendingRequests(newToken) {
  pendingRequests.forEach(callback => callback(newToken))
  pendingRequests = []
}

// 添加响应拦截器
instance.interceptors.response.use(
  function (response) {
    // 2xx 范围内的状态码都会触发该函数。
    // 对响应数据做点什么
    return response
  },
  async function (error) {
    // 超出 2xx 范围的状态码都会触发该函数。
    const { response, config } = error
    const userStore = useUserStore()

    // 如果是401错误且不是刷新token的请求
    if (response?.status === 401 && !config.url.includes('/api/refresh')) {
      // 如果没有refreshToken，直接跳转到登录页
      if (!userStore.refreshToken) {
        userStore.logout()
        router.push('/')
        return Promise.reject(error)
      }

      // 如果正在刷新token，将请求加入队列等待
      if (isRefreshing) {
        return new Promise((resolve) => {
          pendingRequests.push((newToken) => {
            config.headers.Authorization = newToken
            resolve(instance(config))
          })
        })
      }

      isRefreshing = true

      try {
        // 尝试刷新token
        const newAccessToken = await userStore.refreshAccessToken()

        // 执行等待中的请求
        executePendingRequests(newAccessToken)

        // 用新token重发原请求
        config.headers.Authorization = newAccessToken
        return instance(config)
      } catch (refreshError) {
        // 刷新失败，执行等待中的请求（会失败）
        executePendingRequests(null)
        // 跳转到登录页
        router.push('/')
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

export default instance
