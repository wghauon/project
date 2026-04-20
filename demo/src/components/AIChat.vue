<template>
  <div class="ai-chat-container">
    <!-- 聊天头部 -->
    <div class="chat-header">
      <div class="chat-title">
        <span class="ai-icon">🤖</span>
        <span>AI学习助手</span>
        <span v-if="isRagMode" class="mode-badge">📚 知识库模式</span>
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

    <!-- 知识库信息栏 -->
    <div v-if="isRagMode && kbInfo.name" class="kb-info-bar">
      <span class="kb-icon">{{ kbInfo.icon }}</span>
      <span class="kb-name">{{ kbInfo.name }}</span>
      <button class="kb-change-btn" @click="$emit('changeKb')">更换</button>
      <button class="kb-clear-btn" @click="clearKb">清除</button>
    </div>

    <!-- 消息列表 -->
    <div class="messages-container" ref="messagesContainer">
      <div v-if="messages.length === 0" class="welcome-message">
        <div class="welcome-icon">👋</div>
        <div class="welcome-text">
          <h3>你好！我是AI学习助手</h3>
          <p v-if="isRagMode">
            我已连接到您的知识库「{{ kbInfo.name || '...' }}」，可以基于您的资料回答问题。
          </p>
          <p v-else>我可以帮你解答学习中的各种问题，包括：</p>
          <ul v-if="!isRagMode">
            <li>📚 课程知识讲解</li>
            <li>💻 编程问题解答</li>
            <li>📝 学习方法建议</li>
            <li>🔍 概念定义查询</li>
          </ul>
          <div v-else class="rag-tips">
            <p>💡 小贴士：</p>
            <ul>
              <li>我会优先基于您的资料回答</li>
              <li>回答会标注信息来源</li>
              <li>资料不足时会明确告知</li>
            </ul>
          </div>
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
          <!-- 引用来源 -->
          <div v-if="msg.sources && msg.sources.length > 0" class="message-sources">
            <div class="sources-title">📚 参考来源：</div>
            <div v-for="(source, i) in msg.sources" :key="i" class="source-item">
              <span class="source-num">[{{ i + 1 }}]</span>
              <span class="source-name">{{ source.file_name }}</span>
              <span class="source-score">({{ (source.score * 100).toFixed(1) }}% 相关)</span>
            </div>
          </div>
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
          :placeholder="isRagMode ? '基于您的知识库提问...' : '输入你的问题，按Enter发送...'"
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
      <div class="input-tip">
        {{ isRagMode ? 'AI基于您的知识库生成回答，仅供参考' : 'AI生成的内容仅供参考，请核实重要信息' }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch, computed } from 'vue'
import { chatWithAI, getChatHistory, clearChatHistory } from '@/api/ai-chat'
import { ragChatStream, getAvailableKnowledgeBases } from '@/api/knowledge-base'
import { useUserStore } from '@/stores/user'

const props = defineProps({
  conversationId: {
    type: [String, null],
    default: null
  },
  kbId: {
    type: [Number, null],
    default: null
  },
  mode: {
    type: String,
    default: 'general' // 'general' | 'rag'
  }
})

const emit = defineEmits(['close', 'update:conversationId', 'conversationUpdated', 'changeKb', 'clearKb'])

const userStore = useUserStore()
const messages = ref([])
const inputMessage = ref('')
const isLoading = ref(false)
const messagesContainer = ref(null)
const inputRef = ref(null)
const currentConversationId = ref(props.conversationId)
const kbInfo = ref({})

const isRagMode = computed(() => props.mode === 'rag' && props.kbId)

// 加载知识库信息
const loadKbInfo = async () => {
  if (!props.kbId) return
  
  try {
    const res = await getAvailableKnowledgeBases()
    if (res.data.status === 0) {
      const kb = res.data.data.find(k => k.kb_id === props.kbId)
      if (kb) {
        kbInfo.value = kb
      }
    }
  } catch (error) {
    console.error('获取知识库信息失败:', error)
  }
}

// 清除知识库
const clearKb = () => {
  emit('clearKb')
}

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
    sources: [],
    time: new Date().toISOString()
  })

  try {
    if (isRagMode.value) {
      // RAG模式对话
      await sendRagMessage(message, aiMessageIndex)
    } else {
      // 通用模式对话
      await sendGeneralMessage(message, aiMessageIndex)
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    messages.value[aiMessageIndex].content = '抱歉，发送失败，请稍后重试。'
    isLoading.value = false
  }
}

// RAG模式发送消息
const sendRagMessage = async (message, aiMessageIndex) => {
  const response = await ragChatStream({
    message,
    userId: userStore.user_id,
    conversationId: currentConversationId.value,
    kbId: props.kbId,
    mode: 'rag'
  })

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6))
          
          if (data.content) {
            messages.value[aiMessageIndex].content += data.content
            scrollToBottom()
          }
          
          if (data.done) {
            isLoading.value = false
            if (data.sources) {
              messages.value[aiMessageIndex].sources = data.sources
            }
            if (data.conversationId && !currentConversationId.value) {
              currentConversationId.value = data.conversationId
              emit('update:conversationId', data.conversationId)
              emit('conversationUpdated')
            }
            scrollToBottom()
          }
          
          if (data.error) {
            messages.value[aiMessageIndex].content += '\n\n[错误: ' + data.error + ']'
            isLoading.value = false
          }
        } catch (e) {
          console.error('解析SSE数据失败:', e)
        }
      }
    }
  }
}

// 通用模式发送消息
const sendGeneralMessage = async (message, aiMessageIndex) => {
  await chatWithAI(
    {
      message,
      userId: userStore.user_id,
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
        emit('conversationUpdated')
      }
      scrollToBottom()
    }
  )
}

// 清空历史记录
const clearHistory = async () => {
  if (!confirm('确定要清空对话历史吗？')) return

  try {
    await clearChatHistory(userStore.user_id, currentConversationId.value)
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
  if (!userStore.user_id || !currentConversationId.value) return

  try {
    const res = await getChatHistory(userStore.user_id, currentConversationId.value)
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
watch(() => props.conversationId, async (newVal, oldVal) => {
  if (newVal !== oldVal) {
    currentConversationId.value = newVal
    messages.value = []
    if (newVal) {
      await nextTick()
      await loadHistory()
    }
  }
}, { immediate: true })

// 监听kbId变化
watch(() => props.kbId, (newVal) => {
  if (newVal) {
    loadKbInfo()
  } else {
    kbInfo.value = {}
  }
}, { immediate: true })

onMounted(() => {
  nextTick(() => {
    inputRef.value?.focus()
  })
  if (props.kbId) {
    loadKbInfo()
  }
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

.mode-badge {
  font-size: 12px;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  font-weight: 500;
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

/* 知识库信息栏 */
.kb-info-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: #e3f2fd;
  border-bottom: 1px solid #bbdefb;
}

.kb-icon {
  font-size: 20px;
}

.kb-name {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.kb-change-btn,
.kb-clear-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.kb-change-btn {
  background: #667eea;
  color: white;
}

.kb-change-btn:hover {
  background: #5a6fd6;
}

.kb-clear-btn {
  background: #f5f5f5;
  color: #666;
}

.kb-clear-btn:hover {
  background: #e0e0e0;
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

.rag-tips {
  margin-top: 20px;
  padding: 16px;
  background: #e8f5e9;
  border-radius: 12px;
  text-align: left;
}

.rag-tips p {
  margin: 0 0 8px 0;
  font-weight: 500;
  color: #2e7d32;
}

.rag-tips ul {
  margin: 0;
  padding-left: 20px;
}

.rag-tips li {
  padding: 4px 0;
  color: #666;
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

/* 引用来源 */
.message-sources {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #e0e0e0;
}

.user-message .message-sources {
  border-top-color: rgba(255, 255, 255, 0.3);
}

.sources-title {
  font-size: 12px;
  font-weight: 500;
  color: #667eea;
  margin-bottom: 6px;
}

.user-message .sources-title {
  color: rgba(255, 255, 255, 0.9);
}

.source-item {
  font-size: 11px;
  color: #888;
  margin: 4px 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.user-message .source-item {
  color: rgba(255, 255, 255, 0.7);
}

.source-num {
  color: #667eea;
  font-weight: 500;
}

.user-message .source-num {
  color: rgba(255, 255, 255, 0.9);
}

.source-name {
  font-weight: 500;
}

.source-score {
  font-size: 10px;
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
