import { defineStore } from 'pinia'
import { ref } from 'vue'
export const useUserStore = defineStore(
  'user',
  () => {
    const token = ref('')
    const setToken = (t) => {
      token.value = t
    }
    const role = ref('')
    const setRole = (r) => {
      role.value = r
    }
    const user_id = ref('')
    const setUserID = (i) => {
      user_id.value = i
    }
    const username = ref('')
    const setUsername = (u) => {
      username.value = u
    }
    return {
      token,
      setToken,
      role,
      setRole,
      user_id,
      setUserID,
      username,
      setUsername,
    }
  },
  {
    persist: true, // 持久化
  },
)
