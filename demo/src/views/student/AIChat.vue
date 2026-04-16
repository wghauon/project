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

        <div class="conversation-list" v-if="conversations.length > 0">
          <div
            v-for="conv in conversations"
            :key="conv.conversationId"
            :class="['conversation-item', { active: currentConversationId === conv.conversationId }]"
            @click="selectConversation(conv.conversationId)"
          >
            <div class="conversation-icon">💬</div>
            <div class="conversation-info">
              <div class="conversation-title">{{ conv.lastMessage || '新对话' }}</div>
              <div class="conversation-time">{{ formatTime(conv.lastTime) }}</div>
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
          @update:conversationId="currentConversationId = $event"
          @conversation-updated="loadConversations"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import StudentNavigator from '@/components/StudentNavigator.vue'
import AIChatComponent from '@/components/AIChat.vue'
import { getConversationList, deleteConversation } from '@/api/ai-chat'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const currentConversationId = ref(null)
const conversations = ref([])

// 格式化时间
const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now - date

  // 今天
  if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  // 昨天
  if (diff < 48 * 60 * 60 * 1000 && date.getDate() === now.getDate() - 1) {
    return '昨天'
  }
  // 更早
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

// 加载对话列表
const loadConversations = async () => {
  if (!userStore.user_id) return

  try {
    const res = await getConversationList(userStore.user_id)
    console.log(res)
    if (res.data.status === 0) {
      conversations.value = res.data.data || []
    }
  } catch (error) {
    console.error('加载对话列表失败:', error)
  }
}

// 选择对话
const selectConversation = (conversationId) => {
  currentConversationId.value = conversationId
}

// 创建新对话
const createNewChat = () => {
  currentConversationId.value = null
}

// 删除对话
const deleteConv = async (conversationId) => {
  if (!confirm('确定要删除这个对话吗？')) return

  try {
    await deleteConversation(userStore.userInfo.id, conversationId)
    // 如果删除的是当前对话，清空当前对话ID
    if (currentConversationId.value === conversationId) {
      currentConversationId.value = null
    }
    // 重新加载列表
    loadConversations()
  } catch (error) {
    console.error('删除对话失败:', error)
    alert('删除失败')
  }
}

onMounted(() => {
  loadConversations()
})
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
</style>
