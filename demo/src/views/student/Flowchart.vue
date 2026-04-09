<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// 画布
const canvasRef = ref(null)
const ctx = ref(null)

// 节点列表
const nodes = ref([])

// 连接线列表
const connections = ref([])

// 当前选中的节点
const selectedNode = ref(null)

// 拖拽状态
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })

// 连接状态
const isConnecting = ref(false)
const connectStartNode = ref(null)

// 节点类型
const nodeTypes = [
  { type: 'start', label: '开始', color: '#4caf50' },
  { type: 'process', label: '处理', color: '#2196f3' },
  { type: 'decision', label: '判断', color: '#ff9800' },
  { type: 'input', label: '输入', color: '#9c27b0' },
  { type: 'output', label: '输出', color: '#00bcd4' },
  { type: 'end', label: '结束', color: '#f44336' }
]

// 初始化画布
onMounted(() => {
  const canvas = canvasRef.value
  ctx.value = canvas.getContext('2d')
  
  // 设置画布大小
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
  
  // 绘制
  draw()
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas)
})

// 调整画布大小
const resizeCanvas = () => {
  const canvas = canvasRef.value
  const container = canvas.parentElement
  canvas.width = container.clientWidth
  canvas.height = container.clientHeight
  draw()
}

// 绘制
const draw = () => {
  const canvas = canvasRef.value
  const context = ctx.value
  
  // 清空画布
  context.clearRect(0, 0, canvas.width, canvas.height)
  
  // 绘制网格
  drawGrid()
  
  // 绘制连接线
  connections.value.forEach(conn => {
    drawConnection(conn)
  })
  
  // 绘制节点
  nodes.value.forEach(node => {
    drawNode(node)
  })
}

// 绘制网格
const drawGrid = () => {
  const canvas = canvasRef.value
  const context = ctx.value
  const gridSize = 20
  
  context.strokeStyle = '#e0e0e0'
  context.lineWidth = 1
  
  for (let x = 0; x < canvas.width; x += gridSize) {
    context.beginPath()
    context.moveTo(x, 0)
    context.lineTo(x, canvas.height)
    context.stroke()
  }
  
  for (let y = 0; y < canvas.height; y += gridSize) {
    context.beginPath()
    context.moveTo(0, y)
    context.lineTo(canvas.width, y)
    context.stroke()
  }
}

// 绘制节点
const drawNode = (node) => {
  const context = ctx.value
  const isSelected = selectedNode.value === node
  
  context.save()
  
  // 绘制阴影
  context.shadowColor = 'rgba(0, 0, 0, 0.2)'
  context.shadowBlur = 10
  context.shadowOffsetX = 2
  context.shadowOffsetY = 2
  
  // 绘制节点形状
  context.fillStyle = node.color
  context.strokeStyle = isSelected ? '#667eea' : '#333'
  context.lineWidth = isSelected ? 3 : 2
  
  if (node.type === 'decision') {
    // 菱形
    context.beginPath()
    context.moveTo(node.x, node.y - node.height / 2)
    context.lineTo(node.x + node.width / 2, node.y)
    context.lineTo(node.x, node.y + node.height / 2)
    context.lineTo(node.x - node.width / 2, node.y)
    context.closePath()
  } else if (node.type === 'start' || node.type === 'end') {
    // 圆角矩形
    roundRect(context, node.x - node.width / 2, node.y - node.height / 2, node.width, node.height, 20)
  } else {
    // 矩形
    context.fillRect(node.x - node.width / 2, node.y - node.height / 2, node.width, node.height)
    context.strokeRect(node.x - node.width / 2, node.y - node.height / 2, node.width, node.height)
  }
  
  if (node.type === 'decision' || node.type === 'start' || node.type === 'end') {
    context.fill()
    context.stroke()
  }
  
  // 绘制文字
  context.shadowColor = 'transparent'
  context.fillStyle = '#fff'
  context.font = 'bold 14px Arial'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(node.text, node.x, node.y)
  
  // 绘制连接点
  if (isSelected) {
    context.fillStyle = '#667eea'
    const connectPoints = getConnectPoints(node)
    connectPoints.forEach(point => {
      context.beginPath()
      context.arc(point.x, point.y, 6, 0, Math.PI * 2)
      context.fill()
    })
  }
  
  context.restore()
}

// 绘制连接线
const drawConnection = (conn) => {
  const context = ctx.value
  const fromNode = nodes.value.find(n => n.id === conn.from)
  const toNode = nodes.value.find(n => n.id === conn.to)
  
  if (!fromNode || !toNode) return
  
  const fromPoint = getConnectPoints(fromNode)[conn.fromPoint]
  const toPoint = getConnectPoints(toNode)[conn.toPoint]
  
  context.save()
  context.strokeStyle = '#666'
  context.lineWidth = 2
  context.beginPath()
  context.moveTo(fromPoint.x, fromPoint.y)
  context.lineTo(toPoint.x, toPoint.y)
  context.stroke()
  
  // 绘制箭头
  drawArrow(context, fromPoint.x, fromPoint.y, toPoint.x, toPoint.y)
  
  context.restore()
}

// 绘制箭头
const drawArrow = (context, fromX, fromY, toX, toY) => {
  const headLength = 10
  const angle = Math.atan2(toY - fromY, toX - fromX)
  
  context.beginPath()
  context.moveTo(toX, toY)
  context.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6))
  context.moveTo(toX, toY)
  context.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6))
  context.stroke()
}

// 获取连接点
const getConnectPoints = (node) => {
  return [
    { x: node.x, y: node.y - node.height / 2 }, // 上
    { x: node.x + node.width / 2, y: node.y }, // 右
    { x: node.x, y: node.y + node.height / 2 }, // 下
    { x: node.x - node.width / 2, y: node.y } // 左
  ]
}

// 圆角矩形
const roundRect = (context, x, y, width, height, radius) => {
  context.beginPath()
  context.moveTo(x + radius, y)
  context.lineTo(x + width - radius, y)
  context.quadraticCurveTo(x + width, y, x + width, y + radius)
  context.lineTo(x + width, y + height - radius)
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  context.lineTo(x + radius, y + height)
  context.quadraticCurveTo(x, y + height, x, y + height - radius)
  context.lineTo(x, y + radius)
  context.quadraticCurveTo(x, y, x + radius, y)
  context.closePath()
}

// 添加节点
const addNode = (type) => {
  const nodeType = nodeTypes.find(t => t.type === type)
  const node = {
    id: Date.now(),
    type: type,
    text: nodeType.label,
    color: nodeType.color,
    x: 200 + Math.random() * 200,
    y: 150 + Math.random() * 150,
    width: 100,
    height: 50
  }
  nodes.value.push(node)
  draw()
}

// 鼠标按下
const onMouseDown = (e) => {
  const rect = canvasRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  
  // 查找点击的节点
  const clickedNode = nodes.value.find(node => {
    return x >= node.x - node.width / 2 &&
           x <= node.x + node.width / 2 &&
           y >= node.y - node.height / 2 &&
           y <= node.y + node.height / 2
  })
  
  if (clickedNode) {
    if (isConnecting.value) {
      // 完成连接
      if (connectStartNode.value && connectStartNode.value !== clickedNode) {
        connections.value.push({
          from: connectStartNode.value.id,
          to: clickedNode.id,
          fromPoint: 2, // 从下方连接
          toPoint: 0 // 连接到上方
        })
      }
      isConnecting.value = false
      connectStartNode.value = null
    } else {
      // 选中节点
      selectedNode.value = clickedNode
      isDragging.value = true
      dragOffset.value = {
        x: x - clickedNode.x,
        y: y - clickedNode.y
      }
    }
  } else {
    selectedNode.value = null
    isConnecting.value = false
    connectStartNode.value = null
  }
  
  draw()
}

// 鼠标移动
const onMouseMove = (e) => {
  if (isDragging.value && selectedNode.value) {
    const rect = canvasRef.value.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    selectedNode.value.x = x - dragOffset.value.x
    selectedNode.value.y = y - dragOffset.value.y
    
    draw()
  }
}

// 鼠标抬起
const onMouseUp = () => {
  isDragging.value = false
}

// 开始连接
const startConnect = () => {
  if (selectedNode.value) {
    isConnecting.value = true
    connectStartNode.value = selectedNode.value
    alert('请点击另一个节点完成连接')
  } else {
    alert('请先选择一个节点')
  }
}

// 删除选中节点
const deleteSelected = () => {
  if (selectedNode.value) {
    // 删除相关连接
    connections.value = connections.value.filter(
      conn => conn.from !== selectedNode.value.id && conn.to !== selectedNode.value.id
    )
    // 删除节点
    nodes.value = nodes.value.filter(n => n !== selectedNode.value)
    selectedNode.value = null
    draw()
  }
}

// 清空画布
const clearCanvas = () => {
  if (confirm('确定要清空画布吗？')) {
    nodes.value = []
    connections.value = []
    selectedNode.value = null
    draw()
  }
}

// 导出图片
const exportImage = () => {
  const canvas = canvasRef.value
  const link = document.createElement('a')
  link.download = 'flowchart.png'
  link.href = canvas.toDataURL()
  link.click()
}

// 编辑节点文字
const editNodeText = () => {
  if (selectedNode.value) {
    const newText = prompt('请输入节点文字：', selectedNode.value.text)
    if (newText) {
      selectedNode.value.text = newText
      draw()
    }
  }
}
</script>

<template>
  <div class="flowchart-page">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-section">
        <h3>节点类型</h3>
        <div class="node-types">
          <button 
            v-for="type in nodeTypes" 
            :key="type.type"
            class="node-btn"
            :style="{ background: type.color }"
            @click="addNode(type.type)"
          >
            {{ type.label }}
          </button>
        </div>
      </div>
      
      <div class="toolbar-section">
        <h3>操作</h3>
        <div class="actions">
          <button class="action-btn" @click="startConnect" :disabled="!selectedNode">
            🔗 连接节点
          </button>
          <button class="action-btn" @click="editNodeText" :disabled="!selectedNode">
            ✏️ 编辑文字
          </button>
          <button class="action-btn delete" @click="deleteSelected" :disabled="!selectedNode">
            🗑️ 删除节点
          </button>
          <button class="action-btn" @click="clearCanvas">
            🧹 清空画布
          </button>
          <button class="action-btn export" @click="exportImage">
            💾 导出图片
          </button>
        </div>
      </div>
      
      <div class="toolbar-section">
        <h3>说明</h3>
        <ul class="instructions">
          <li>点击节点类型添加节点</li>
          <li>拖拽节点移动位置</li>
          <li>选中节点后点击"连接节点"，再点击另一个节点完成连接</li>
          <li>选中节点后可编辑或删除</li>
        </ul>
      </div>
    </div>
    
    <!-- 画布 -->
    <div class="canvas-container">
      <canvas
        ref="canvasRef"
        @mousedown="onMouseDown"
        @mousemove="onMouseMove"
        @mouseup="onMouseUp"
        @mouseleave="onMouseUp"
      ></canvas>
    </div>
  </div>
</template>

<style scoped>
.flowchart-page {
  display: flex;
  height: calc(100vh - 60px);
  background: #f5f7fa;
}

/* 工具栏 */
.toolbar {
  width: 240px;
  background: white;
  padding: 20px;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.08);
  overflow-y: auto;
}

.toolbar-section {
  margin-bottom: 24px;
}

.toolbar-section h3 {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e0e0e0;
}

.node-types {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.node-btn {
  padding: 10px;
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 13px;
  cursor: pointer;
  transition: transform 0.2s;
}

.node-btn:hover {
  transform: translateY(-2px);
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-btn {
  padding: 10px 12px;
  background: #f5f7fa;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  text-align: left;
  transition: all 0.3s;
}

.action-btn:hover:not(:disabled) {
  background: #e0e0e0;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn.delete:hover:not(:disabled) {
  background: #ffebee;
  color: #f44336;
}

.action-btn.export {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.action-btn.export:hover {
  opacity: 0.9;
}

.instructions {
  font-size: 12px;
  color: #666;
  line-height: 1.8;
  padding-left: 16px;
}

.instructions li {
  margin-bottom: 4px;
}

/* 画布容器 */
.canvas-container {
  flex: 1;
  padding: 20px;
  overflow: hidden;
}

.canvas-container canvas {
  width: 100%;
  height: 100%;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  cursor: crosshair;
}

/* 响应式 */
@media (max-width: 768px) {
  .flowchart-page {
    flex-direction: column;
  }
  
  .toolbar {
    width: 100%;
    height: auto;
    max-height: 200px;
  }
  
  .node-types {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .actions {
    flex-direction: row;
    flex-wrap: wrap;
  }
  
  .action-btn {
    flex: 1;
    min-width: 100px;
  }
}
</style>
