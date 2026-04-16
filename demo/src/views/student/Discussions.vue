<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getDiscussionList, addDiscussion, replyDiscussion, likeDiscussion as likeDiscussionAPI } from '@/api/student'
import VirtualList from '@/components/VirtualList.vue'

const router = useRouter()
const userStore = useUserStore()

// 当前课程
const currentCourse = ref('all')

// 讨论列表
const discussions = ref([])
const loading = ref(false)

// 新讨论
const showNewDiscussion = ref(false)
const newDiscussion = ref({
  title: '',
  content: '',
  course_id: ''
})

// 回复
const replyContent = ref('')
const replyingTo = ref(null)

// 讨论列表虚拟列表引用
const discussionsListRef = ref(null)

// 获取讨论列表
const fetchDiscussions = async () => {
  loading.value = true
  try {
    const res = await getDiscussionList()
    if (res.data.status === 0) {
      discussions.value = res.data.data || []
    } else {
      console.error('获取讨论列表失败:', res.data.message)
    }
  } catch (error) {
    console.error('获取讨论列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 切换课程
const switchCourse = (course) => {
  currentCourse.value = course
}

// 过滤后的讨论
const filteredDiscussions = computed(() => {
  if (currentCourse.value === 'all') {
    return discussions.value
  }
  return discussions.value.filter(d => d.course_name === currentCourse.value)
})

// 发布讨论
const publishDiscussion = async () => {
  if (!newDiscussion.value.title || !newDiscussion.value.content) {
    alert('请填写完整的标题和内容')
    return
  }
  
  try {
    const res = await addDiscussion({
      course_id: newDiscussion.value.course_id || 1,
      title: newDiscussion.value.title,
      content: newDiscussion.value.content
    })
    if (res.data.status === 0) {
      alert('讨论发布成功！')
      showNewDiscussion.value = false
      newDiscussion.value = { title: '', content: '', course_id: '' }
      fetchDiscussions()
    } else {
      alert(res.data.message || '发布失败')
    }
  } catch (error) {
    console.error('发布失败:', error)
    alert('发布失败，请稍后重试')
  }
}

// 点赞讨论
const handleLikeDiscussion = async (discussion) => {
  try {
    const res = await likeDiscussionAPI({ discussion_id: discussion.discussion_id })
    if (res.data.status === 0) {
      discussion.likes++
    }
  } catch (error) {
    console.error('点赞失败:', error)
  }
}

// 开始回复
const startReply = (discussion) => {
  replyingTo.value = discussion
  replyContent.value = ''
}

// 提交回复
const submitReply = async (discussion) => {
  if (!replyContent.value.trim()) {
    alert('请输入回复内容')
    return
  }
  
  try {
    const res = await replyDiscussion({
      course_id: discussion.course_id,
      parent_id: discussion.discussion_id,
      content: replyContent.value
    })
    if (res.data.status === 0) {
      alert('回复成功')
      replyContent.value = ''
      replyingTo.value = null
      fetchDiscussions()
    } else {
      alert(res.data.message || '回复失败')
    }
  } catch (error) {
    console.error('回复失败:', error)
    alert('回复失败，请稍后重试')
  }
}

// 取消回复
const cancelReply = () => {
  replyingTo.value = null
  replyContent.value = ''
}

onMounted(() => {
  fetchDiscussions()
})
</script>

<template>
  <div class="discussions-page">
    <!-- 页面头部 -->
    <header class="page-header">
      <h1 class="page-title">💬 讨论区</h1>
      <button class="btn-new" @click="showNewDiscussion = true">+ 发起讨论</button>
    </header>

    <!-- 课程筛选 -->
    <div class="course-filter">
      <button :class="{ active: currentCourse === 'all' }" @click="switchCourse('all')">全部课程</button>
      <button :class="{ active: currentCourse === 'Python程序设计基础' }" @click="switchCourse('Python程序设计基础')">Python程序设计基础</button>
      <button :class="{ active: currentCourse === '数据结构与算法' }" @click="switchCourse('数据结构与算法')">数据结构与算法</button>
      <button :class="{ active: currentCourse === 'Web前端开发技术' }" @click="switchCourse('Web前端开发技术')">Web前端开发技术</button>
    </div>

    <!-- 发布讨论弹窗 -->
    <div v-if="showNewDiscussion" class="modal-overlay" @click="showNewDiscussion = false">
      <div class="modal-content" @click.stop>
        <h3>发起新讨论</h3>
        <input 
          v-model="newDiscussion.title" 
          placeholder="请输入讨论标题..."
          class="input-title"
        />
        <textarea 
          v-model="newDiscussion.content" 
          placeholder="请输入讨论内容..."
          rows="6"
          class="input-content"
        ></textarea>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showNewDiscussion = false">取消</button>
          <button class="btn-publish" @click="publishDiscussion">发布</button>
        </div>
      </div>
    </div>

    <!-- 讨论列表 - 使用虚拟列表 -->
    <VirtualList
      v-if="filteredDiscussions.length > 0"
      ref="discussionsListRef"
      :items="filteredDiscussions"
      :item-height="200"
      :buffer-size="2"
      :container-height="600"
      class="discussions-virtual-list"
    >
      <template #default="{ item: discussion }">
        <div
          class="discussion-card"
          :class="{ top: discussion.is_top }"
        >
          <div class="discussion-header">
            <div class="author-info">
              <span class="author-avatar">{{ discussion.avatar }}</span>
              <div class="author-meta">
                <span class="author-name">{{ discussion.author }}</span>
                <span class="discussion-course">{{ discussion.course_name }}</span>
              </div>
            </div>
            <span v-if="discussion.is_top" class="top-badge">置顶</span>
            <span class="discussion-time">{{ discussion.created_at }}</span>
          </div>

          <h3 class="discussion-title">{{ discussion.title }}</h3>
          <p class="discussion-content">{{ discussion.content }}</p>

          <div class="discussion-actions">
            <button class="btn-like" @click="handleLikeDiscussion(discussion)">
              👍 {{ discussion.likes }}
            </button>
            <button class="btn-reply" @click="startReply(discussion)">
              💬 {{ discussion.replies }} 回复
            </button>
          </div>

          <!-- 回复列表 -->
          <div v-if="discussion.replies_list && discussion.replies_list.length > 0" class="replies-section">
            <div
              v-for="reply in discussion.replies_list"
              :key="reply.reply_id"
              class="reply-item"
            >
              <span class="reply-avatar">{{ reply.avatar }}</span>
              <div class="reply-content">
                <div class="reply-header">
                  <span class="reply-author">{{ reply.author }}</span>
                  <span class="reply-time">{{ reply.created_at }}</span>
                </div>
                <p class="reply-text">{{ reply.content }}</p>
              </div>
            </div>
          </div>

          <!-- 回复输入框 -->
          <div v-if="replyingTo === discussion" class="reply-input-section">
            <textarea
              v-model="replyContent"
              placeholder="写下你的回复..."
              rows="3"
            ></textarea>
            <div class="reply-actions">
              <button class="btn-cancel" @click="cancelReply">取消</button>
              <button class="btn-submit" @click="submitReply(discussion)">发送</button>
            </div>
          </div>
        </div>
      </template>
    </VirtualList>

    <!-- 空状态 -->
    <div v-if="filteredDiscussions.length === 0" class="empty-state">
      <div class="empty-icon">💬</div>
      <p>暂无讨论</p>
      <button class="btn-new-empty" @click="showNewDiscussion = true">发起第一个讨论</button>
    </div>
  </div>
</template>

<style scoped>
.discussions-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px 20px;
}

/* 页面头部 */
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
.btn-new {
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: transform 0.2s;
}
.btn-new:hover {
  transform: translateY(-2px);
}

/* 课程筛选 */
.course-filter {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.course-filter button {
  padding: 8px 16px;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.3s;
}
.course-filter button.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
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
}
.modal-content h3 {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 16px;
}
.input-title {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 12px;
}
.input-content {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  margin-bottom: 16px;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
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
.btn-publish {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

/* 讨论列表 */
.discussions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 虚拟列表讨论区域样式 */
.discussions-virtual-list {
  margin-top: 16px;
}

.discussions-virtual-list :deep(.virtual-list-item) {
  margin-bottom: 16px;
}

.discussion-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.discussion-card.top {
  border-left: 4px solid #667eea;
}
.discussion-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.author-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}
.author-avatar {
  width: 40px;
  height: 40px;
  background: #f0f4ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}
.author-meta {
  display: flex;
  flex-direction: column;
}
.author-name {
  font-weight: bold;
  color: #333;
  font-size: 14px;
}
.discussion-course {
  color: #667eea;
  font-size: 12px;
}
.top-badge {
  padding: 2px 8px;
  background: #f0f4ff;
  color: #667eea;
  border-radius: 4px;
  font-size: 12px;
}
.discussion-time {
  color: #999;
  font-size: 12px;
}
.discussion-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}
.discussion-content {
  color: #666;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 16px;
}
.discussion-actions {
  display: flex;
  gap: 16px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}
.discussion-actions button {
  background: none;
  border: none;
  color: #999;
  font-size: 14px;
  cursor: pointer;
  transition: color 0.3s;
}
.discussion-actions button:hover {
  color: #667eea;
}

/* 回复列表 */
.replies-section {
  margin-top: 16px;
  padding: 16px;
  background: #f9faff;
  border-radius: 8px;
}
.reply-item {
  display: flex;
  gap: 10px;
  padding: 12px 0;
  border-bottom: 1px solid #e0e0e0;
}
.reply-item:last-child {
  border-bottom: none;
}
.reply-avatar {
  width: 32px;
  height: 32px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}
.reply-content {
  flex: 1;
}
.reply-header {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
}
.reply-author {
  font-weight: bold;
  color: #333;
  font-size: 13px;
}
.reply-time {
  color: #999;
  font-size: 12px;
}
.reply-text {
  color: #666;
  font-size: 13px;
  line-height: 1.5;
}

/* 回复输入 */
.reply-input-section {
  margin-top: 16px;
  padding: 16px;
  background: #f9faff;
  border-radius: 8px;
}
.reply-input-section textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  margin-bottom: 12px;
}
.reply-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
.reply-actions button {
  padding: 8px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}
.btn-submit {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
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
.btn-new-empty {
  margin-top: 20px;
  padding: 12px 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

/* 响应式 */
@media (max-width: 600px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  .course-filter {
    overflow-x: auto;
    flex-wrap: nowrap;
    padding-bottom: 8px;
  }
}
</style>
