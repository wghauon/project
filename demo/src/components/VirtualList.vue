<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'

const props = defineProps({
  // 列表数据
  items: {
    type: Array,
    required: true
  },
  // 每项高度（固定高度时必填）
  itemHeight: {
    type: Number,
    default: 0
  },
  // 是否启用动态高度
  dynamicHeight: {
    type: Boolean,
    default: false
  },
  // 可视区域外额外渲染的项数（缓冲区）
  bufferSize: {
    type: Number,
    default: 5
  },
  // 容器高度
  containerHeight: {
    type: [Number, String],
    default: '100%'
  },
  // 是否启用虚拟滚动
  enabled: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['scroll', 'item-click'])

// 容器引用
const containerRef = ref(null)
const contentRef = ref(null)

// 滚动位置
const scrollTop = ref(0)
const containerClientHeight = ref(0)

// 每项高度缓存（动态高度时使用）
const itemHeightCache = ref(new Map())

// 计算容器样式
const containerStyle = computed(() => {
  const height = typeof props.containerHeight === 'number' 
    ? `${props.containerHeight}px` 
    : props.containerHeight
  return {
    height,
    overflow: 'auto',
    position: 'relative'
  }
})

// 计算总高度
const totalHeight = computed(() => {
  if (!props.enabled) return 'auto'
  
  if (props.dynamicHeight) {
    // 动态高度：累加所有项的高度
    let total = 0
    for (let i = 0; i < props.items.length; i++) {
      total += getItemHeight(i)
    }
    return `${total}px`
  } else {
    // 固定高度
    return `${props.items.length * props.itemHeight}px`
  }
})

// 获取指定索引项的高度
const getItemHeight = (index) => {
  if (props.dynamicHeight) {
    return itemHeightCache.value.get(index) || props.itemHeight || 50
  }
  return props.itemHeight
}

// 计算可见区域的起始索引
const startIndex = computed(() => {
  if (!props.enabled) return 0
  
  if (props.dynamicHeight) {
    // 动态高度：遍历累加高度
    let accumulatedHeight = 0
    for (let i = 0; i < props.items.length; i++) {
      const height = getItemHeight(i)
      if (accumulatedHeight + height >= scrollTop.value) {
        return Math.max(0, i - props.bufferSize)
      }
      accumulatedHeight += height
    }
    return 0
  } else {
    // 固定高度
    return Math.max(0, Math.floor(scrollTop.value / props.itemHeight) - props.bufferSize)
  }
})

// 计算可见区域的结束索引
const endIndex = computed(() => {
  if (!props.enabled) return props.items.length - 1
  
  const visibleCount = Math.ceil(containerClientHeight.value / (props.itemHeight || 50))
  
  if (props.dynamicHeight) {
    return Math.min(props.items.length - 1, startIndex.value + visibleCount + props.bufferSize * 2)
  } else {
    return Math.min(
      props.items.length - 1,
      Math.floor(scrollTop.value / props.itemHeight) + visibleCount + props.bufferSize
    )
  }
})

// 计算偏移量
const offsetStyle = computed(() => {
  if (!props.enabled) return {}
  
  if (props.dynamicHeight) {
    // 动态高度：累加前面所有项的高度
    let offset = 0
    for (let i = 0; i < startIndex.value; i++) {
      offset += getItemHeight(i)
    }
    return { transform: `translateY(${offset}px)` }
  } else {
    // 固定高度
    return { transform: `translateY(${startIndex.value * props.itemHeight}px)` }
  }
})

// 当前可见的列表项
const visibleItems = computed(() => {
  if (!props.enabled) return props.items.map((item, index) => ({ item, index }))
  
  const items = []
  for (let i = startIndex.value; i <= endIndex.value && i < props.items.length; i++) {
    items.push({
      item: props.items[i],
      index: i,
      key: `item-${i}`
    })
  }
  return items
})

// 处理滚动事件
const handleScroll = () => {
  if (!containerRef.value) return
  
  scrollTop.value = containerRef.value.scrollTop
  containerClientHeight.value = containerRef.value.clientHeight
  
  emit('scroll', {
    scrollTop: scrollTop.value,
    scrollHeight: containerRef.value.scrollHeight,
    clientHeight: containerClientHeight.value
  })
}

// 更新容器高度
const updateContainerHeight = () => {
  if (containerRef.value) {
    containerClientHeight.value = containerRef.value.clientHeight
  }
}

// 测量并缓存项高度（动态高度时使用）
const measureItemHeight = (index, el) => {
  if (!props.dynamicHeight || !el) return
  
  const height = el.getBoundingClientRect().height
  itemHeightCache.value.set(index, height)
}

// 滚动到指定索引
const scrollToIndex = (index, behavior = 'smooth') => {
  if (!containerRef.value || !props.enabled) return
  
  let offset = 0
  if (props.dynamicHeight) {
    for (let i = 0; i < index; i++) {
      offset += getItemHeight(i)
    }
  } else {
    offset = index * props.itemHeight
  }
  
  containerRef.value.scrollTo({
    top: offset,
    behavior
  })
}

// 滚动到顶部
const scrollToTop = (behavior = 'smooth') => {
  if (containerRef.value) {
    containerRef.value.scrollTo({ top: 0, behavior })
  }
}

// 滚动到底部
const scrollToBottom = (behavior = 'smooth') => {
  if (containerRef.value) {
    containerRef.value.scrollTo({
      top: containerRef.value.scrollHeight,
      behavior
    })
  }
}

// 监听items变化，清空高度缓存
watch(() => props.items, () => {
  itemHeightCache.value.clear()
}, { deep: true })

// 监听滚动位置变化（用于调试）
watch(() => scrollTop.value, (newVal) => {
  // 可以在这里添加滚动监听逻辑
})

onMounted(() => {
  updateContainerHeight()
  window.addEventListener('resize', updateContainerHeight)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateContainerHeight)
})

// 暴露方法
defineExpose({
  scrollToIndex,
  scrollToTop,
  scrollToBottom,
  getScrollTop: () => scrollTop.value,
  getContainer: () => containerRef.value
})
</script>

<template>
  <div
    ref="containerRef"
    class="virtual-list-container"
    :style="containerStyle"
    @scroll="handleScroll"
  >
    <!-- 占位元素，用于撑开滚动区域 -->
    <div
      ref="contentRef"
      class="virtual-list-content"
      :style="{ height: enabled ? totalHeight : 'auto' }"
    >
      <!-- 可见项容器 -->
      <div
        class="virtual-list-visible"
        :style="enabled ? offsetStyle : {}"
      >
        <div
          v-for="{ item, index, key } in visibleItems"
          :key="key"
          class="virtual-list-item"
          :data-index="index"
          @click="$emit('item-click', item, index)"
        >
          <slot
            :item="item"
            :index="index"
            :measure="(el) => measureItemHeight(index, el)"
          >
            <!-- 默认插槽内容 -->
            <div class="virtual-list-item-default">
              {{ item }}
            </div>
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.virtual-list-container {
  width: 100%;
}

.virtual-list-content {
  position: relative;
  width: 100%;
}

.virtual-list-visible {
  width: 100%;
}

.virtual-list-item {
  width: 100%;
}

.virtual-list-item-default {
  padding: 12px;
  border-bottom: 1px solid #e0e0e0;
  background: white;
}
</style>
