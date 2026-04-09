<script setup>
import { ref, computed, onMounted } from 'vue'
import { getUserList, createUser as createUserAPI, updateUser as updateUserAPI, deleteUser as deleteUserAPI, resetPassword as resetPasswordAPI, toggleUserStatus as toggleUserStatusAPI } from '@/api/admin'

// 用户列表
const users = ref([])
const total = ref(0)
const loading = ref(false)

// 搜索关键词
const searchKeyword = ref('')

// 角色筛选
const roleFilter = ref('')

// 当前页
const currentPage = ref(1)
const pageSize = 10

// 创建用户弹窗
const showCreateModal = ref(false)
const newUser = ref({
  username: '',
  real_name: '',
  role: 1,
  email: '',
  phone: '',
  department: '',
  password: ''
})

// 编辑用户
const editingUser = ref(null)
const showEditModal = ref(false)

// 获取用户列表
const fetchUsers = async () => {
  loading.value = true
  try {
    const res = await getUserList({
      keyword: searchKeyword.value,
      role: roleFilter.value,
      page: currentPage.value,
      pageSize: pageSize
    })
    if (res.data.status === 0) {
      users.value = res.data.data.list || []
      total.value = res.data.data.total || 0
    } else {
      console.error('获取用户列表失败:', res.data.message)
    }
  } catch (error) {
    console.error('获取用户列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 过滤后的用户
const filteredUsers = computed(() => {
  return users.value
})

// 总页数
const totalPages = computed(() => {
  return Math.ceil(total.value / pageSize)
})

// 当前页用户
const currentUsers = computed(() => {
  return users.value
})

// 搜索
const searchUsers = () => {
  currentPage.value = 1
  fetchUsers()
}

// 切换页码
const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    fetchUsers()
  }
}

// 创建用户
const handleCreateUser = async () => {
  if (!newUser.value.username || !newUser.value.real_name || !newUser.value.password) {
    alert('请填写完整信息')
    return
  }
  
  try {
    const res = await createUserAPI(newUser.value)
    if (res.data.status === 0) {
      alert('用户创建成功！')
      showCreateModal.value = false
      newUser.value = {
        username: '',
        real_name: '',
        role: 1,
        email: '',
        phone: '',
        department: '',
        password: ''
      }
      fetchUsers()
    } else {
      alert(res.data.message || '创建失败')
    }
  } catch (error) {
    console.error('创建用户失败:', error)
    alert('创建失败，请稍后重试')
  }
}

// 编辑用户
const editUser = (user) => {
  editingUser.value = { ...user }
  showEditModal.value = true
}

// 保存编辑
const saveEdit = async () => {
  try {
    const res = await updateUserAPI(editingUser.value.user_id, editingUser.value)
    if (res.data.status === 0) {
      alert('保存成功！')
      showEditModal.value = false
      editingUser.value = null
      fetchUsers()
    } else {
      alert(res.data.message || '保存失败')
    }
  } catch (error) {
    console.error('保存失败:', error)
    alert('保存失败，请稍后重试')
  }
}

// 切换用户状态
const handleToggleStatus = async (user) => {
  try {
    const res = await toggleUserStatusAPI(user.user_id)
    if (res.data.status === 0) {
      user.status = user.status === 1 ? 0 : 1
      alert(res.data.message)
    } else {
      alert(res.data.message || '操作失败')
    }
  } catch (error) {
    console.error('操作失败:', error)
    alert('操作失败，请稍后重试')
  }
}

// 重置密码
const handleResetPassword = async (user) => {
  if (confirm(`确定要重置用户 "${user.real_name}" 的密码吗？`)) {
    try {
      const res = await resetPasswordAPI(user.user_id)
      if (res.data.status === 0) {
        alert(res.data.message)
      } else {
        alert(res.data.message || '重置失败')
      }
    } catch (error) {
      console.error('重置失败:', error)
      alert('重置失败，请稍后重试')
    }
  }
}

// 删除用户
const handleDeleteUser = async (user) => {
  if (confirm(`确定要删除用户 "${user.real_name}" 吗？此操作不可恢复！`)) {
    try {
      const res = await deleteUserAPI(user.user_id)
      if (res.data.status === 0) {
        alert('删除成功')
        fetchUsers()
      } else {
        alert(res.data.message || '删除失败')
      }
    } catch (error) {
      console.error('删除失败:', error)
      alert('删除失败，请稍后重试')
    }
  }
}

// 获取角色名称
const getRoleName = (role) => {
  const map = { 1: '学生', 2: '教师', 3: '管理员' }
  return map[role] || '未知'
}

onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <div class="user-manage-page">
    <h1 class="page-title">👥 用户管理</h1>

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="search-box">
        <input 
          v-model="searchKeyword" 
          placeholder="搜索用户名、姓名、邮箱..."
          @keyup.enter="searchUsers"
        />
        <button @click="searchUsers">搜索</button>
      </div>
      <select v-model="roleFilter" @change="searchUsers">
        <option value="">全部角色</option>
        <option value="1">学生</option>
        <option value="2">教师</option>
        <option value="3">管理员</option>
      </select>
      <button class="btn-create" @click="showCreateModal = true">+ 创建用户</button>
    </div>

    <!-- 创建用户弹窗 -->
    <div v-if="showCreateModal" class="modal-overlay" @click="showCreateModal = false">
      <div class="modal-content" @click.stop>
        <h3>创建新用户</h3>
        <div class="form-row">
          <div class="form-group">
            <label>用户名 <span class="required">*</span></label>
            <input v-model="newUser.username" placeholder="请输入用户名" />
          </div>
          <div class="form-group">
            <label>真实姓名 <span class="required">*</span></label>
            <input v-model="newUser.real_name" placeholder="请输入真实姓名" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>角色 <span class="required">*</span></label>
            <select v-model="newUser.role">
              <option :value="1">学生</option>
              <option :value="2">教师</option>
              <option :value="3">管理员</option>
            </select>
          </div>
          <div class="form-group">
            <label>密码 <span class="required">*</span></label>
            <input v-model="newUser.password" type="password" placeholder="请输入密码" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>邮箱</label>
            <input v-model="newUser.email" placeholder="请输入邮箱" />
          </div>
          <div class="form-group">
            <label>手机号</label>
            <input v-model="newUser.phone" placeholder="请输入手机号" />
          </div>
        </div>
        <div class="form-group">
          <label>院系</label>
          <input v-model="newUser.department" placeholder="请输入院系" />
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showCreateModal = false">取消</button>
          <button class="btn-save" @click="handleCreateUser">创建</button>
        </div>
      </div>
    </div>

    <!-- 编辑用户弹窗 -->
    <div v-if="showEditModal" class="modal-overlay" @click="showEditModal = false">
      <div class="modal-content" @click.stop>
        <h3>编辑用户</h3>
        <div class="form-row">
          <div class="form-group">
            <label>用户名</label>
            <input v-model="editingUser.username" disabled />
          </div>
          <div class="form-group">
            <label>真实姓名</label>
            <input v-model="editingUser.real_name" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>角色</label>
            <select v-model="editingUser.role">
              <option :value="1">学生</option>
              <option :value="2">教师</option>
              <option :value="3">管理员</option>
            </select>
          </div>
          <div class="form-group">
            <label>状态</label>
            <select v-model="editingUser.status">
              <option :value="1">启用</option>
              <option :value="0">禁用</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>邮箱</label>
            <input v-model="editingUser.email" />
          </div>
          <div class="form-group">
            <label>手机号</label>
            <input v-model="editingUser.phone" />
          </div>
        </div>
        <div class="form-group">
          <label>院系</label>
          <input v-model="editingUser.department" />
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showEditModal = false">取消</button>
          <button class="btn-save" @click="saveEdit">保存</button>
        </div>
      </div>
    </div>

    <!-- 用户列表 -->
    <div class="user-table">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>用户名</th>
            <th>真实姓名</th>
            <th>角色</th>
            <th>邮箱</th>
            <th>院系</th>
            <th>状态</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in currentUsers" :key="user.user_id">
            <td>{{ user.user_id }}</td>
            <td>{{ user.username }}</td>
            <td>{{ user.real_name }}</td>
            <td>
              <span class="role-badge" :class="'role-' + user.role">
                {{ getRoleName(user.role) }}
              </span>
            </td>
            <td>{{ user.email }}</td>
            <td>{{ user.department }}</td>
            <td>
              <span class="status-badge" :class="user.status === 1 ? 'active' : 'inactive'">
                {{ user.status === 1 ? '启用' : '禁用' }}
              </span>
            </td>
            <td>{{ user.created_at }}</td>
            <td>
              <div class="action-btns">
                <button class="btn-edit" @click="editUser(user)">编辑</button>
                <button class="btn-reset" @click="handleResetPassword(user)">重置密码</button>
                <button
                  :class="user.status === 1 ? 'btn-disable' : 'btn-enable'"
                  @click="handleToggleStatus(user)"
                >
                  {{ user.status === 1 ? '禁用' : '启用' }}
                </button>
                <button class="btn-delete" @click="handleDeleteUser(user)">删除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页 -->
    <div class="pagination" v-if="totalPages > 1">
      <button :disabled="currentPage === 1" @click="changePage(currentPage - 1)">上一页</button>
      <span v-for="page in totalPages" :key="page">
        <button 
          :class="{ active: currentPage === page }" 
          @click="changePage(page)"
        >
          {{ page }}
        </button>
      </span>
      <button :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">下一页</button>
    </div>

    <!-- 空状态 -->
    <div v-if="currentUsers.length === 0" class="empty-state">
      <div class="empty-icon">👥</div>
      <p>暂无用户</p>
    </div>
  </div>
</template>

<style scoped>
.user-manage-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px 20px;
}

.page-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 24px;
}

/* 工具栏 */
.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.search-box {
  display: flex;
  gap: 8px;
  flex: 1;
  min-width: 300px;
}

.search-box input {
  flex: 1;
  padding: 10px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
}

.search-box button {
  padding: 10px 20px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.toolbar select {
  padding: 10px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  min-width: 120px;
}

.btn-create {
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content h3 {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #666;
}

.form-group label .required {
  color: #f44336;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.modal-actions button {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}

.btn-cancel {
  background: #f5f7fa;
  color: #666;
}

.btn-save {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

/* 用户表格 */
.user-table {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  margin-bottom: 24px;
}

.user-table table {
  width: 100%;
  border-collapse: collapse;
}

.user-table th,
.user-table td {
  padding: 16px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.user-table th {
  background: #f9faff;
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.user-table td {
  font-size: 14px;
  color: #666;
}

.user-table tr:hover {
  background: #f9faff;
}

/* 角色标签 */
.role-badge {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.role-badge.role-1 {
  background: #e3f2fd;
  color: #2196f3;
}

.role-badge.role-2 {
  background: #f3e5f5;
  color: #9c27b0;
}

.role-badge.role-3 {
  background: #fff3e0;
  color: #ff9800;
}

/* 状态标签 */
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

/* 操作按钮 */
.action-btns {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-btns button {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.btn-edit {
  background: #f0f4ff;
  color: #667eea;
}

.btn-reset {
  background: #fff3e0;
  color: #ff9800;
}

.btn-toggle.disable {
  background: #ffebee;
  color: #f44336;
}

.btn-toggle.enable {
  background: #e8f5e9;
  color: #4caf50;
}

.btn-delete {
  background: #ffebee;
  color: #f44336;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.pagination button {
  padding: 8px 16px;
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

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: #999;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

/* 响应式 */
@media (max-width: 1200px) {
  .user-table {
    overflow-x: auto;
  }
  
  .user-table table {
    min-width: 1000px;
  }
}

@media (max-width: 600px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .toolbar {
    flex-direction: column;
  }
  
  .search-box {
    min-width: auto;
  }
}
</style>
