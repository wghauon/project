<template>
  <div class="ai-chat-container">
    <!-- 聊天头部 -->
    <div class="chat-header">
      <div class="chat-title">
        <span class="ai-icon">🤖</span>
        <span>AI学习助手</span>
      </div>
      <div class="chat-actions">
        <button class="action-btn" @click="clearHistory" title="清空对话">
          <span>🗑️</span>
        </button>
        <button class="action-btn" @click="$emit('close')" title="关闭">
          <span>✕</span>
        </button>
      </div>
    </div>

    <!-- 消息列表 -->
    <div class="messages-container" ref="messagesContainer">
      <div v-if="messages.length === 0" class="welcome-message">
        <div class="welcome-icon">👋</div>
        <div class="welcome-text">
          <h3>你好！我是AI学习助手</h3>
          <p>我可以帮你解答学习中的各种问题，包括：</p>
          <ul>
            <li>📚 课程知识讲解</li>
            <li>💻 编程问题解答</li>
            <li>📝 学习方法建议</li>
            <li>🔍 概念定义查询</li>
          </ul>
        </div>
      </div>

      <div
        v-for="(msg, index) in messages"
        :key="index"
        :class="['message', msg.role === 'user' ? 'user-message' : 'ai-message']"
      >
        <div class="message-avatar">
          {{ msg.role === 'user' ? '👤' : '🤖' }}
        </div>
        <div class="message-content">
          <div class="message-text" v-html="formatMessage(msg.content)"></div>
          <div class="message-time">{{ formatTime(msg.time) }}</div>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="message ai-message">
        <div class="message-avatar">🤖</div>
        <div class="message-content">
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="input-container">
      <div class="input-wrapper">
        <textarea
          v-model="inputMessage"
          placeholder="输入你的问题，按Enter发送..."
          @keydown.enter.prevent="sendMessage"
          :disabled="isLoading"
          rows="1"
          ref="inputRef"
        ></textarea>
        <button
          class="send-btn"
          @click="sendMessage"
          :disabled="!inputMessage.trim() || isLoading"
        >
          <span v-if="!isLoading">发送</span>
          <span v-else>...</span>
        </button>
      </div>
      <div class="input-tip">AI生成的内容仅供参考，请核实重要信息</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import { chatWithAI, getChatHistory, clearChatHistory } from '@/api/ai-chat'
import { useUserStore } from '@/stores/user'

const props = defineProps({
  conversationId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['close', 'update:conversationId'])

const userStore = useUserStore()
const messages = ref([])
const inputMessage = ref('')
const isLoading = ref(false)
const messagesContainer = ref(null)
const inputRef = ref(null)
const currentConversationId = ref(props.conversationId)

// 格式化消息内容（支持代码高亮和Markdown）
const formatMessage = (content) => {
  if (!content) return ''
  
  // 转义HTML
  let formatted = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  
  // 代码块处理
  formatted = formatted.replace(
    /```(\w+)?\n([\s\S]*?)```/g,
    (match, lang, code) => `<pre class="code-block"><code class="language-${lang || 'text'}">${code.trim()}</code></pre>`
  )
  
  // 行内代码
  formatted = formatted.replace(
    /`([^`]+)`/g,
    '<code class="inline-code">$1</code>'
  )
  
  // 粗体
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  
  // 斜体
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>')
  
  // 换行
  formatted = formatted.replace(/\n/g, '<br>')
  
  return formatted
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// 发送消息
const sendMessage = async () => {
  const message = inputMessage.value.trim()
  if (!message || isLoading.value) return
  
  // 添加用户消息
  messages.value.push({
    role: 'user',
    content: message,
    time: new Date().toISOString()
  })
  
  inputMessage.value = ''
  isLoading.value = true
  scrollToBottom()
  
  // 准备接收AI回复
  const aiMessageIndex = messages.value.length
  messages.value.push({
    role: 'assistant',
    content: '',
    time: new Date().toISOString()
  })
  
  try {
    await chatWithAI(
      {
        message,
        userId: userStore.userInfo?.id,
        conversationId: currentConversationId.value
      },
      // 收到消息回调
      (content) => {
        messages.value[aiMessageIndex].content += content
        scrollToBottom()
      },
      // 错误回调
      (error) => {
        console.error('AI聊天错误:', error)
        messages.value[aiMessageIndex].content += '\n\n[发送错误，请重试]'
      },
      // 完成回调
      (data) => {
        isLoading.value = false
        if (data.conversationId && !currentConversationId.value) {
          currentConversationId.value = data.conversationId
          emit('update:conversationId', data.conversationId)
        }
        scrollToBottom()
      }
    )
  } catch (error) {
    console.error('发送消息失败:', error)
    messages.value[aiMessageIndex].content = '抱歉，发送失败，请稍后重试。'
    isLoading.value = false
  }
}

// 清空历史记录
const clearHistory = async () => {
  if (!confirm('确定要清空对话历史吗？')) return
  
  try {
    await clearChatHistory(userStore.userInfo?.id, currentConversationId.value)
    messages.value = []
    currentConversationId.value = null
    emit('update:conversationId', null)
  } catch (error) {
    console.error('清空历史失败:', error)
    alert('清空历史失败')
  }
}

// 加载历史记录
const loadHistory = async () => {
  if (!userStore.userInfo?.id || !currentConversationId.value) return
  
  try {
    const res = await getChatHistory(userStore.userInfo.id, currentConversationId.value)
    if (res.data.status === 0 && res.data.data) {
      messages.value = res.data.data.map(msg => ({
        role: msg.role,
        content: msg.content,
        time: msg.created_at
      }))
      scrollToBottom()
    }
  } catch (error) {
    console.error('加载历史记录失败:', error)
  }
}

// 监听conversationId变化
watch(() => props.conversationId, (newVal) => {
  if (newVal !== currentConversationId.value) {
    currentConversationId.value = newVal
    messages.value = []
    if (newVal) {
      loadHistory()
    }
  }
})

onMounted(() => {
  loadHistory()
  // 自动聚焦输入框
  nextTick(() => {
    inputRef.value?.focus()
  })
})
</script>

<style scoped>
.ai-chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f5f5;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

/* 头部样式 */
.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.chat-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
}

.ai-icon {
  font-size: 24px;
}

.chat-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 消息容器 */
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 欢迎消息 */
.welcome-message {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.welcome-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.welcome-text h3 {
  color: #333;
  margin-bottom: 16px;
}

.welcome-text ul {
  list-style: none;
  padding: 0;
  display: inline-block;
  text-align: left;
}

.welcome-text li {
  padding: 8px 0;
  font-size: 14px;
}

/* 消息样式 */
.message {
  display: flex;
  gap: 12px;
  max-width: 85%;
}

.user-message {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.ai-message {
  align-self: flex-start;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.user-message .message-avatar {
  background: #667eea;
}

.message-content {
  background: white;
  padding: 12px 16px;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  max-width: calc(100% - 48px);
}

.user-message .message-content {
  background: #667eea;
  color: white;
}

.message-text {
  font-size: 14px;
  line-height: 1.6;
  word-wrap: break-word;
}

.message-time {
  font-size: 11px;
  color: #999;
  margin-top: 6px;
  text-align: right;
}

.user-message .message-time {
  color: rgba(255, 255, 255, 0.7);
}

/* 代码块样式 */
:deep(.code-block) {
  background: #f4f4f4;
  border-radius: 8px;
  padding: 12px;
  margin: 8px 0;
  overflow-x: auto;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  line-height: 1.5;
}

:deep(.inline-code) {
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  color: #e83e8c;
}

.user-message :deep(.inline-code) {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

/* 打字机效果 */
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 8px 0;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #999;
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-10px);
  }
}

/* 输入区域 */
.input-container {
  padding: 16px 20px;
  background: white;
  border-top: 1px solid #e0e0e0;
}

.input-wrapper {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.input-wrapper textarea {
  flex: 1;
  border: 1px solid #ddd;
  border-radius: 20px;
  padding: 12px 16px;
  font-size: 14px;
  resize: none;
  outline: none;
  transition: border-color 0.3s;
  font-family: inherit;
  max-height: 120px;
  min-height: 44px;
}

.input-wrapper textarea:focus {
  border-color: #667eea;
}

.input-wrapper textarea:disabled {
  background: #f5f5f5;
}

.send-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
  white-space: nowrap;
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.send-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.input-tip {
  font-size: 11px;
  color: #999;
  text-align: center;
  margin-top: 8px;
}

/* 滚动条样式 */
.messages-container::-webkit-scrollbar {
  width: 6px;
}

.messages-container::-webkit-scrollbar-track {
  background: transparent;
}

.messages-container::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background: #aaa;
}
</style>
