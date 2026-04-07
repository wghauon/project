import { defineStore } from 'pinia'
import { ref } from 'vue'
export const useTeacherStore = defineStore(
  'teacher',
  () => {
    const course_id = ref(null)
    const setCourseID = (i) => {
      course_id.value = i
    }
    return {
      course_id,
      setCourseID,
    }
  },
  {
    persist: true, // 持久化
  },
)
