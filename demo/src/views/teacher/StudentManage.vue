<script setup>
import { ref, onMounted, computed } from 'vue'
import SearchBox from '@/components/SearchBox.vue'
import { getCourseStudents, removeStudent, restoreStudent as restoreStudentAPI, getStudentProgress, getTeacherCourses } from '@/api/teacher'

// 学生列表
const students = ref([])
const loading = ref(false)
const total = ref(0)

// 课程列表
const courses = ref([])

// 筛选条件
const courseFilter = ref('')
const statusFilter = ref('')
const searchKeyword = ref('')

// 当前页
const currentPage = ref(1)
const pageSize = 10

// 获取课程列表
const fetchCourses = async () => {
  try {
    const res = await getTeacherCourses()
    if (res.data.status === 0) {
      courses.value = res.data.data || []
      // 默认选择第一个课程
      if (courses.value.length > 0 && !courseFilter.value) {
        courseFilter.value = courses.value[0].course_id
        fetchStudents()
      }
    }
  } catch (error) {
    console.error('获取课程列表失败:', error)
  }
}

// 获取学生列表
const fetchStudents = async () => {
  if (!courseFilter.value) {
    students.value = []
    total.value = 0
    return
  }
  
  loading.value = true
  try {
    const res = await getCourseStudents(courseFilter.value)
    if (res.data.status === 0) {
      let data = res.data.data || []
      
      // 状态筛选
      if (statusFilter.value) {
        const status = statusFilter.value === 'active' ? 1 : 0
        data = data.filter(s => s.status === status)
      }
      
      // 关键词搜索
      if (searchKeyword.value) {
        const keyword = searchKeyword.value.toLowerCase()
        data = data.filter(s => 
          s.real_name?.toLowerCase().includes(keyword) ||
          s.username?.toLowerCase().includes(keyword) ||
          s.student_no?.toLowerCase().includes(keyword)
        )
      }
      
      students.value = data
      total.value = data.length
    }
  } catch (error) {
    console.error('获取学生列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 搜索学生
const searchStudents = () => {
  currentPage.value = 1
  fetchStudents()
}

// 导出学生名单
const exportStudents = () => {
  if (students.value.length === 0) {
    alert('暂无学生数据可导出')
    return
  }
  // 简单的CSV导出
  let csv = '姓名,学号,院系,学习进度,平均成绩,状态,加入时间\n'
  students.value.forEach(s => {
    csv += `${s.real_name || s.username},${s.student_no || '-'},${s.department || '-'},${s.progress || 0}%,${s.avg_score?.toFixed(1) || '-'},${getStatusText(s.status)},${s.join_time?.split(' ')[0] || '-'}\n`
  })
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `学生名单_${new Date().toLocaleDateString()}.csv`
  link.click()
}

// 切换页码
const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

// 移除学生
const removeStudentFromCourse = async (student) => {
  if (confirm(`确定要将"${student.real_name}"从课程中移除吗？`)) {
    try {
      const res = await removeStudent(courseFilter.value, student.user_id)
      if (res.data.status === 0) {
        alert('移除成功')
        fetchStudents()
      } else {
        alert(res.data.message || '移除失败')
      }
    } catch (error) {
      console.error('移除失败:', error)
      alert('移除失败，请稍后重试')
    }
  }
}

// 恢复学生
const handleRestoreStudent = async (student) => {
  if (confirm(`确定要恢复"${student.real_name}"的学习资格吗？`)) {
    try {
      const res = await restoreStudentAPI(courseFilter.value, student.user_id)
      if (res.data.status === 0) {
        alert('恢复成功')
        fetchStudents()
      } else {
        alert(res.data.message || '恢复失败')
      }
    } catch (error) {
      console.error('恢复失败:', error)
      alert('恢复失败，请稍后重试')
    }
  }
}

// 查看学生详情
const viewStudentDetail = async (student) => {
  try {
    const res = await getStudentProgress(courseFilter.value, student.user_id)
    if (res.data.status === 0) {
      const data = res.data.data
      alert(`学生学习详情：\n学习进度：${data.progress}%\n平均成绩：${data.avg_score?.toFixed(1) || '-'}\n完成视频：${data.completed_videos}/${data.total_videos}\n考试次数：${data.exam_count}`)
    }
  } catch (error) {
    console.error('获取学生进度失败:', error)
    alert('获取学生进度失败')
  }
}

// 过滤后的学生列表
const filteredStudents = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return students.value.slice(start, start + pageSize)
})

// 总页数
const totalPages = computed(() => {
  return Math.ceil(total.value / pageSize)
})

// 获取状态文本
const getStatusText = (status) => {
  return status === 1 ? '学习中' : '已退出'
}

// 获取状态样式类
const getStatusClass = (status) => {
  return status === 1 ? 'active' : 'inactive'
}

onMounted(() => {
  fetchCourses()
})
</script>
<template>
  <!-- 主内容 -->
  <main class="main-container">
    <div class="page-header">
      <h1 class="page-title">👨‍🎓 学生管理</h1>
    </div>

    <div class="filter-bar">
      <div class="filter-group">
        <label>课程</label>
        <select v-model="courseFilter" @change="fetchStudents">
          <option value="">请选择课程</option>
          <option v-for="course in courses" :key="course.course_id" :value="course.course_id">
            {{ course.course_name }}
          </option>
        </select>
      </div>
      <div class="filter-group">
        <label>状态</label>
        <select v-model="statusFilter" @change="fetchStudents">
          <option value="">全部状态</option>
          <option value="active">学习中</option>
          <option value="inactive">已退出</option>
        </select>
      </div>
      <div class="filter-group">
        <input v-model="searchKeyword" placeholder="搜索学生姓名/学号" @keyup.enter="searchStudents" />
      </div>
      <button class="btn-primary" @click="searchStudents">搜索</button>
    </div>

    <div class="student-table-container">
      <div class="table-header">
        <span class="table-info">共 {{ total }} 名学生</span>
        <div class="table-actions">
          <button class="btn-secondary" @click="exportStudents">📤 导出名单</button>
        </div>
      </div>
      
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>正在加载学生列表...</p>
      </div>
      
      <!-- 空状态 -->
      <div v-else-if="students.length === 0" class="empty-state">
        <div class="empty-icon">👨‍🎓</div>
        <p>{{ courseFilter ? '该课程暂无学生' : '请选择课程查看学生' }}</p>
      </div>
      
      <table v-else>
        <thead>
          <tr>
            <th>学生信息</th>
            <th>学号</th>
            <th>院系</th>
            <th>学习进度</th>
            <th>平均成绩</th>
            <th>状态</th>
            <th>加入时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="student in filteredStudents" :key="student.user_id">
            <td>
              <div class="student-info">
                <div class="student-avatar">{{ student.real_name?.charAt(0) || '?' }}</div>
                <span>{{ student.real_name || student.username }}</span>
              </div>
            </td>
            <td>{{ student.student_no || '-' }}</td>
            <td>{{ student.department || '-' }}</td>
            <td>
              <div style="display: flex; align-items: center; gap: 8px">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: (student.progress || 0) + '%' }"></div>
                </div>
                <span>{{ student.progress || 0 }}%</span>
              </div>
            </td>
            <td>{{ student.avg_score?.toFixed(1) || '-' }}</td>
            <td><span class="status-badge" :class="getStatusClass(student.status)">{{ getStatusText(student.status) }}</span></td>
            <td>{{ student.join_time?.split(' ')[0] || '-' }}</td>
            <td>
              <div class="action-btns">
                <button class="btn-icon" @click="viewStudentDetail(student)">查看</button>
                <button v-if="student.status === 1" class="btn-icon" @click="removeStudentFromCourse(student)">移除</button>
                <button v-else class="btn-icon" @click="handleRestoreStudent(student)">恢复</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      
      <!-- 分页 -->
      <div class="pagination" v-if="totalPages > 1">
        <button :disabled="currentPage === 1" @click="changePage(currentPage - 1)">上一页</button>
        <button 
          v-for="page in totalPages" 
          :key="page"
          :class="{ active: currentPage === page }"
          @click="changePage(page)"
        >
          {{ page }}
        </button>
        <button :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">下一页</button>
      </div>
    </div>
  </main>
</template>
<style scoped>
/* 主内容 */
.main-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px 20px;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.page-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}
/* 筛选栏 */
.filter-bar {
  background: white;
  padding: 16px 20px;
  border-radius: 12px;
  margin-bottom: 24px;
  display: flex;
  gap: 16px;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}
.filter-group label {
  font-size: 14px;
  color: #666;
}
.filter-group select,
.filter-group input {
  padding: 8px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
}
/* 学生表格 */
.student-table-container {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.table-info {
  color: #666;
  font-size: 14px;
}
.table-actions {
  display: flex;
  gap: 12px;
}
.btn-primary {
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}
.btn-secondary {
  padding: 10px 20px;
  background: #f5f7fa;
  color: #667eea;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th,
td {
  padding: 16px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}
th {
  font-weight: 600;
  color: #666;
  font-size: 14px;
  background: #f5f7fa;
}
td {
  color: #333;
  font-size: 14px;
}
tr:hover {
  background: #f5f7fa;
}
.student-info {
  display: flex;
  align-items: center;
  gap: 12px;
}
.student-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
}
.progress-bar {
  width: 100px;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
}
.status-badge {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}
.status-badge.active {
  background: #e8f5e9;
  color: #4caf50;
}
.status-badge.inactive {
  background: #ffebee;
  color: #f44336;
}
.action-btns {
  display: flex;
  gap: 8px;
}
.btn-icon {
  padding: 6px 12px;
  background: #f5f7fa;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}
/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 24px;
}
.pagination button {
  padding: 10px 16px;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}
.pagination button.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}
</style>
