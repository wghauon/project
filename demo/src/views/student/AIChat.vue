<template>
  <div class="ai-chat-page">
    <div class="chat-wrapper">
      <AIChatComponent
        :conversationId="conversationId"
        @update:conversationId="conversationId = $event"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import StudentNavigator from '@/components/StudentNavigator.vue'
import AIChatComponent from '@/components/AIChat.vue'

const conversationId = ref(null)
</script>

<style scoped>
.ai-chat-page {
  display: flex;
  height: 100vh;
  background: #f0f2f5;
}

.chat-wrapper {
  flex: 1;
  padding: 20px;
  overflow: hidden;
}

.chat-wrapper > :deep(*) {
  height: 100%;
}
</style>
