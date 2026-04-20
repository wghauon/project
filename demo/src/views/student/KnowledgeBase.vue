<template>
  <div class="knowledge-base-page">
    <div class="page-header">
      <div class="header-content">
        <h1>📚 我的知识库</h1>
        <p class="subtitle">创建个人知识库，上传学习资料，让AI基于您的资料回答问题</p>
      </div>
      <button class="create-btn" @click="showCreateModal = true">
        <span class="icon">+</span>
        新建知识库
      </button>
    </div>

    <!-- 知识库列表 -->
    <div v-if="knowledgeBases.length > 0" class="kb-grid">
      <div
        v-for="kb in knowledgeBases"
        :key="kb.kb_id"
        class="kb-card"
        :style="{ borderColor: kb.color }"
        @click="goToDetail(kb.kb_id)"
      >
        <div class="kb-icon" :style="{ backgroundColor: kb.color + '20' }">
          <span>{{ kb.icon }}</span>
        </div>
        <div class="kb-info">
          <h3 class="kb-name">{{ kb.name }}</h3>
          <p class="kb-desc">{{ kb.description || '暂无描述' }}</p>
          <div class="kb-stats">
            <span class="stat">
              <i class="icon-doc">📄</i>
              {{ kb.doc_count }} 个文档
            </span>
            <span class="stat">
              <i class="icon-chunk">🧩</i>
              {{ kb.total_chunks }} 个片段
            </span>
          </div>
        </div>
        <div class="kb-actions" @click.stop>
          <button class="action-btn edit" @click="editKb(kb)" title="编辑">
            ✏️
          </button>
          <button class="action-btn delete" @click="deleteKb(kb)" title="删除">
            🗑️
          </button>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-icon">📚</div>
      <h3>还没有知识库</h3>
      <p>创建一个知识库，开始上传您的学习资料吧</p>
      <button class="create-btn-large" @click="showCreateModal = true">
        创建第一个知识库
      </button>
    </div>

    <!-- 创建/编辑弹窗 -->
    <Teleport to="body">
      <div v-if="showCreateModal" class="modal-overlay" @click="showCreateModal = false">
        <div class="modal" @click.stop>
          <div class="modal-header">
            <h3>{{ isEditing ? '编辑知识库' : '新建知识库' }}</h3>
            <button class="close-btn" @click="showCreateModal = false">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>知识库名称 <span class="required">*</span></label>
              <input
                v-model="form.name"
                type="text"
                placeholder="例如：高等数学笔记"
                maxlength="50"
              />
            </div>
            <div class="form-group">
              <label>描述</label>
              <textarea
                v-model="form.description"
                placeholder="简要描述这个知识库的内容..."
                rows="3"
                maxlength="200"
              ></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>图标</label>
                <div class="icon-selector">
                  <button
                    v-for="icon in iconOptions"
                    :key="icon"
                    :class="['icon-btn', { active: form.icon === icon }]"
                    @click="form.icon = icon"
                  >
                    {{ icon }}
                  </button>
                </div>
              </div>
              <div class="form-group">
                <label>主题色</label>
                <div class="color-selector">
                  <button
                    v-for="color in colorOptions"
                    :key="color"
                    :class="['color-btn', { active: form.color === color }]"
                    :style="{ backgroundColor: color }"
                    @click="form.color = color"
                  ></button>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="showCreateModal = false">取消</button>
            <button
              class="btn-primary"
              :disabled="!form.name || submitting"
              @click="submitForm"
            >
              {{ submitting ? '保存中...' : (isEditing ? '保存' : '创建') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  getKnowledgeBases,
  createKnowledgeBase,
  updateKnowledgeBase,
  deleteKnowledgeBase
} from '@/api/knowledge-base'

const router = useRouter()

// 数据
const knowledgeBases = ref([])
const loading = ref(false)
const showCreateModal = ref(false)
const isEditing = ref(false)
const submitting = ref(false)
const editingId = ref(null)

// 表单
const form = reactive({
  name: '',
  description: '',
  icon: '📚',
  color: '#667eea'
})

// 选项
const iconOptions = ['📚', '📖', '📝', '💡', '🔬', '📐', '💻', '🎨', '🌍', '🔢']
const colorOptions = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#fa709a', '#feca57', '#48dbfb']

// 获取知识库列表
const loadKnowledgeBases = async () => {
  loading.value = true
  try {
    const res = await getKnowledgeBases()
    if (res.data.status === 0) {
      knowledgeBases.value = res.data.data
    }
  } catch (error) {
    console.error('获取知识库列表失败:', error)
    alert('获取知识库列表失败')
  } finally {
    loading.value = false
  }
}

// 跳转到详情
const goToDetail = (kbId) => {
  router.push(`/student/knowledge-base/${kbId}`)
}

// 编辑知识库
const editKb = (kb) => {
  isEditing.value = true
  editingId.value = kb.kb_id
  form.name = kb.name
  form.description = kb.description
  form.icon = kb.icon
  form.color = kb.color
  showCreateModal.value = true
}

// 删除知识库
const deleteKb = async (kb) => {
  if (!confirm(`确定要删除知识库「${kb.name}」吗？\n这将删除该知识库下的所有文档！`)) {
    return
  }
  
  try {
    const res = await deleteKnowledgeBase(kb.kb_id)
    if (res.data.status === 0) {
      loadKnowledgeBases()
    }
  } catch (error) {
    console.error('删除失败:', error)
    alert('删除失败')
  }
}

// 提交表单
const submitForm = async () => {
  if (!form.name) return
  
  submitting.value = true
  try {
    if (isEditing.value) {
      await updateKnowledgeBase(editingId.value, form)
    } else {
      await createKnowledgeBase(form)
    }
    showCreateModal.value = false
    resetForm()
    loadKnowledgeBases()
  } catch (error) {
    console.error('保存失败:', error)
    alert('保存失败')
  } finally {
    submitting.value = false
  }
}

// 重置表单
const resetForm = () => {
  form.name = ''
  form.description = ''
  form.icon = '📚'
  form.color = '#667eea'
  isEditing.value = false
  editingId.value = null
}

// 关闭弹窗时重置
watch(showCreateModal, (val) => {
  if (!val) resetForm()
})

onMounted(() => {
  loadKnowledgeBases()
})
</script>

<style scoped>
.knowledge-base-page {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.header-content h1 {
  margin: 0 0 8px 0;
  font-size: 28px;
  color: #333;
}

.subtitle {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.create-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.create-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.create-btn .icon {
  font-size: 18px;
  font-weight: bold;
}

/* 知识库网格 */
.kb-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.kb-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  border: 2px solid transparent;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  gap: 16px;
  position: relative;
}

.kb-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.kb-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.kb-icon span {
  font-size: 28px;
}

.kb-info {
  flex: 1;
  min-width: 0;
}

.kb-name {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kb-desc {
  margin: 0 0 12px 0;
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.kb-stats {
  display: flex;
  gap: 16px;
}

.stat {
  font-size: 12px;
  color: #888;
  display: flex;
  align-items: center;
  gap: 4px;
}

.kb-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.kb-card:hover .kb-actions {
  opacity: 1;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: #f5f5f5;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #e8e8e8;
}

.action-btn.delete:hover {
  background: #ff4d4f20;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 24px;
}

.empty-state h3 {
  margin: 0 0 12px 0;
  font-size: 20px;
  color: #333;
}

.empty-state p {
  margin: 0 0 24px 0;
  color: #888;
  font-size: 14px;
}

.create-btn-large {
  padding: 14px 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.create-btn-large:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
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

.modal {
  background: white;
  border-radius: 16px;
  width: 480px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f5f5f5;
  border-radius: 8px;
  font-size: 20px;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #e8e8e8;
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.form-group label .required {
  color: #ff4d4f;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.icon-selector,
.color-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.icon-btn {
  width: 40px;
  height: 40px;
  border: 2px solid #eee;
  background: white;
  border-radius: 8px;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-btn:hover,
.icon-btn.active {
  border-color: #667eea;
  background: #667eea10;
}

.color-btn {
  width: 32px;
  height: 32px;
  border: 3px solid transparent;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
}

.color-btn:hover,
.color-btn.active {
  border-color: #333;
  transform: scale(1.1);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #eee;
  background: #fafafa;
}

.btn-secondary,
.btn-primary {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background: white;
  border: 1px solid #ddd;
  color: #666;
}

.btn-secondary:hover {
  background: #f5f5f5;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
