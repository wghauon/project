<template>
  <div class="ai-chat-page">
    <div class="chat-layout">
      <!-- 左侧对话历史导航栏 -->
      <div class="sidebar">
        <div class="sidebar-header">
          <h3>💬 对话历史</h3>
          <button class="new-chat-btn" @click="createNewChat" title="新建对话">
            <span>+</span>
            新对话
          </button>
        </div>

        <!-- 知识库入口 -->
        <div class="kb-entry" @click="goToKnowledgeBase">
          <span class="kb-entry-icon">📚</span>
          <span class="kb-entry-text">我的知识库</span>
          <span class="kb-entry-arrow">→</span>
        </div>

        <div class="conversation-list" v-if="conversations.length > 0">
          <div
            v-for="conv in conversations"
            :key="conv.conversationId"
            :class="['conversation-item', { active: currentConversationId === conv.conversationId }]"
            @click="selectConversation(conv)"
          >
            <div class="conversation-icon">
              {{ conv.mode === 'rag' ? '📚' : '💬' }}
            </div>
            <div class="conversation-info">
              <div class="conversation-title">{{ conv.lastMessage || '新对话' }}</div>
              <div class="conversation-meta">
                <span v-if="conv.mode === 'rag'" class="rag-badge">知识库</span>
                <span class="conversation-time">{{ formatTime(conv.lastTime) }}</span>
              </div>
            </div>
            <button
              class="delete-btn"
              @click.stop="deleteConv(conv.conversationId)"
              title="删除对话"
            >
              🗑️
            </button>
          </div>
        </div>

        <div class="empty-conversations" v-else>
          <div class="empty-icon">📝</div>
          <p>暂无对话记录</p>
          <p class="empty-tip">点击"新对话"开始提问</p>
        </div>
      </div>

      <!-- 右侧聊天区域 -->
      <div class="chat-wrapper">
        <AIChatComponent
          :conversationId="currentConversationId"
          :kbId="selectedKbId"
          :mode="chatMode"
          @update:conversationId="currentConversationId = $event"
          @conversation-updated="loadConversations"
          @changeKb="showKbSelector = true"
          @clearKb="clearKnowledgeBase"
        />
      </div>
    </div>

    <!-- 知识库选择弹窗 -->
    <Teleport to="body">
      <div v-if="showKbSelector" class="modal-overlay" @click="showKbSelector = false">
        <div class="modal kb-selector-modal" @click.stop>
          <div class="modal-header">
            <h3>选择知识库</h3>
            <button class="close-btn" @click="showKbSelector = false">×</button>
          </div>
          <div class="modal-body">
            <div class="kb-options">
              <div
                class="kb-option general"
                :class="{ active: chatMode === 'general' }"
                @click="selectMode('general')"
              >
                <div class="kb-option-icon">🤖</div>
                <div class="kb-option-info">
                  <div class="kb-option-name">通用模式</div>
                  <div class="kb-option-desc">使用AI的通用知识回答问题</div>
                </div>
              </div>

              <div class="kb-section-title">我的知识库</div>
              
              <div v-if="knowledgeBases.length === 0" class="empty-kb">
                <p>暂无可用知识库</p>
                <button class="create-kb-btn" @click="goToKnowledgeBase">
                  去创建知识库
                </button>
              </div>

              <div
                v-for="kb in knowledgeBases"
                :key="kb.kb_id"
                class="kb-option"
                :class="{ active: selectedKbId === kb.kb_id }"
                @click="selectKnowledgeBase(kb.kb_id)"
              >
                <div class="kb-option-icon" :style="{ backgroundColor: kb.color + '20' }">
                  {{ kb.icon }}
                </div>
                <div class="kb-option-info">
                  <div class="kb-option-name">{{ kb.name }}</div>
                  <div class="kb-option-desc">
                    {{ kb.doc_count }} 个文档 · {{ kb.total_chunks }} 个片段
                  </div>
                </div>
                <div v-if="selectedKbId === kb.kb_id" class="check-icon">✓</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AIChatComponent from '@/components/AIChat.vue'
import { getConversationList, deleteConversation } from '@/api/ai-chat'
import { getAvailableKnowledgeBases } from '@/api/knowledge-base'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const currentConversationId = ref(null)
const conversations = ref([])
const knowledgeBases = ref([])
const showKbSelector = ref(false)
const selectedKbId = ref(null)
const chatMode = ref('general') // 'general' | 'rag'

// 从URL参数初始化
const initFromQuery = () => {
  const { kbId, mode } = route.query
  if (kbId) {
    selectedKbId.value = parseInt(kbId)
    chatMode.value = 'rag'
  } else if (mode === 'rag') {
    chatMode.value = 'rag'
  }
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now - date

  if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  if (diff < 48 * 60 * 60 * 1000 && date.getDate() === now.getDate() - 1) {
    return '昨天'
  }
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

// 加载对话列表
const loadConversations = async () => {
  if (!userStore.user_id) return

  try {
    const res = await getConversationList(userStore.user_id)
    if (res.data.status === 0) {
      conversations.value = res.data.data || []
    }
  } catch (error) {
    console.error('加载对话列表失败:', error)
  }
}

// 加载知识库列表
const loadKnowledgeBases = async () => {
  try {
    const res = await getAvailableKnowledgeBases()
    if (res.data.status === 0) {
      knowledgeBases.value = res.data.data || []
    }
  } catch (error) {
    console.error('加载知识库列表失败:', error)
  }
}

// 选择对话
const selectConversation = (conv) => {
  currentConversationId.value = conv.conversationId
  if (conv.mode === 'rag' && conv.kbId) {
    selectedKbId.value = conv.kbId
    chatMode.value = 'rag'
  } else {
    selectedKbId.value = null
    chatMode.value = 'general'
  }
}

// 创建新对话
const createNewChat = () => {
  currentConversationId.value = null
  showKbSelector.value = true
}

// 选择模式
const selectMode = (mode) => {
  chatMode.value = mode
  selectedKbId.value = null
  showKbSelector.value = false
}

// 选择知识库
const selectKnowledgeBase = (kbId) => {
  selectedKbId.value = kbId
  chatMode.value = 'rag'
  showKbSelector.value = false
  currentConversationId.value = null
}

// 清除知识库
const clearKnowledgeBase = () => {
  selectedKbId.value = null
  chatMode.value = 'general'
  currentConversationId.value = null
}

// 删除对话
const deleteConv = async (conversationId) => {
  if (!confirm('确定要删除这个对话吗？')) return

  try {
    await deleteConversation(userStore.user_id, conversationId)
    if (currentConversationId.value === conversationId) {
      currentConversationId.value = null
    }
    loadConversations()
  } catch (error) {
    console.error('删除对话失败:', error)
    alert('删除失败')
  }
}

// 跳转到知识库管理
const goToKnowledgeBase = () => {
  router.push('/student/knowledge-base')
}

onMounted(() => {
  initFromQuery()
  loadConversations()
  loadKnowledgeBases()
})

// 监听路由参数变化
watch(() => route.query, initFromQuery)
</script>

<style scoped>
.ai-chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f0f2f5;
}

.chat-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* 左侧导航栏 */
.sidebar {
  width: 280px;
  background: white;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}

.new-chat-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
}

.new-chat-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.new-chat-btn span {
  font-size: 18px;
  line-height: 1;
}

/* 知识库入口 */
.kb-entry {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  margin: 8px;
  background: linear-gradient(135deg, #667eea10 0%, #764ba210 100%);
  border: 1px solid #667eea30;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.kb-entry:hover {
  background: linear-gradient(135deg, #667eea20 0%, #764ba220 100%);
  transform: translateX(4px);
}

.kb-entry-icon {
  font-size: 24px;
}

.kb-entry-text {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.kb-entry-arrow {
  font-size: 14px;
  color: #667eea;
}

/* 对话列表 */
.conversation-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.conversation-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 4px;
}

.conversation-item:hover {
  background: #f5f5f5;
}

.conversation-item.active {
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
  border-left: 3px solid #667eea;
}

.conversation-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.conversation-info {
  flex: 1;
  min-width: 0;
}

.conversation-title {
  font-size: 14px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.conversation-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rag-badge {
  font-size: 10px;
  padding: 2px 6px;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 4px;
}

.conversation-time {
  font-size: 12px;
  color: #999;
}

.delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  opacity: 0;
  transition: all 0.2s;
  font-size: 14px;
}

.conversation-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: #ff4d4f20;
}

/* 空状态 */
.empty-conversations {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-conversations p {
  margin: 0;
  font-size: 14px;
}

.empty-tip {
  font-size: 12px;
  margin-top: 8px;
}

/* 右侧聊天区域 */
.chat-wrapper {
  flex: 1;
  padding: 20px;
  overflow: hidden;
}

.chat-wrapper > :deep(*) {
  height: 100%;
}

/* 滚动条样式 */
.conversation-list::-webkit-scrollbar {
  width: 4px;
}

.conversation-list::-webkit-scrollbar-track {
  background: transparent;
}

.conversation-list::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 2px;
}

.conversation-list::-webkit-scrollbar-thumb:hover {
  background: #ccc;
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
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
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
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
}

/* 知识库选择器 */
.kb-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.kb-option {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8f9fa;
  border: 2px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.kb-option:hover {
  background: #f0f0f0;
}

.kb-option.active {
  border-color: #667eea;
  background: #667eea10;
}

.kb-option.general {
  background: linear-gradient(135deg, #667eea10 0%, #764ba210 100%);
}

.kb-option-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  background: white;
  flex-shrink: 0;
}

.kb-option-info {
  flex: 1;
}

.kb-option-name {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.kb-option-desc {
  font-size: 12px;
  color: #888;
}

.check-icon {
  width: 24px;
  height: 24px;
  background: #667eea;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.kb-section-title {
  font-size: 12px;
  font-weight: 500;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-top: 8px;
}

.empty-kb {
  text-align: center;
  padding: 32px;
  color: #888;
}

.empty-kb p {
  margin: 0 0 16px 0;
}

.create-kb-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.create-kb-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}
</style>
