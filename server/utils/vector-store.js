const lancedb = require('@lancedb/lancedb')
const path = require('path')
const fs = require('fs')
const { v4: uuidv4 } = require('uuid')

// 向量数据库路径
const DB_PATH = path.join(__dirname, '../data/vector-db')

/**
 * 向量存储服务类
 * 基于LanceDB实现
 */
class VectorStore {
  constructor() {
    this.db = null
    this.tableName = 'knowledge_chunks'
    this.initialized = false
  }

  /**
   * 初始化数据库
   */
  async init() {
    if (this.initialized) return
    
    try {
      // 确保目录存在
      if (!fs.existsSync(DB_PATH)) {
        fs.mkdirSync(DB_PATH, { recursive: true })
      }
      
      // 连接数据库
      this.db = await lancedb.connect(DB_PATH)
      
      // 检查表是否存在
      const tables = await this.db.tableNames()
      
      if (!tables.includes(this.tableName)) {
        // 创建新表
        await this.createTable()
      }
      
      this.initialized = true
      console.log('向量数据库初始化成功')
    } catch (error) {
      console.error('向量数据库初始化失败:', error)
      throw error
    }
  }

  /**
   * 创建向量表
   */
  async createTable() {
    // 定义初始数据
    const sampleData = [{
      id: uuidv4(),
      user_id: 0,
      kb_id: 0,
      doc_id: 0,
      chunk_index: 0,
      content: 'sample',
      vector: new Array(1024).fill(0),
      file_name: 'sample.txt',
      created_at: new Date().toISOString()
    }]

    await this.db.createTable(this.tableName, sampleData)
    console.log('向量表创建成功')
  }

  /**
   * 添加文本块向量
   * @param {Object} data - 数据对象
   * @returns {Promise<boolean>}
   */
  async addChunk(data) {
    await this.init()
    
    const table = await this.db.openTable(this.tableName)
    
    const record = {
      id: uuidv4(),
      user_id: data.user_id,
      kb_id: data.kb_id,
      doc_id: data.doc_id,
      chunk_index: data.chunk_index,
      content: data.content,
      vector: data.vector,
      file_name: data.file_name,
      created_at: new Date().toISOString()
    }
    
    await table.add([record])
    return true
  }

  /**
   * 批量添加文本块向量
   * @param {Array} chunks - 文本块数组
   * @returns {Promise<boolean>}
   */
  async addChunks(chunks) {
    await this.init()
    
    if (chunks.length === 0) return true
    
    const table = await this.db.openTable(this.tableName)
    
    const records = chunks.map((chunk, index) => ({
      id: uuidv4(),
      user_id: chunk.user_id,
      kb_id: chunk.kb_id,
      doc_id: chunk.doc_id,
      chunk_index: chunk.chunk_index ?? index,
      content: chunk.content,
      vector: chunk.vector,
      file_name: chunk.file_name,
      created_at: new Date().toISOString()
    }))
    
    await table.add(records)
    return true
  }

  /**
   * 相似度搜索
   * @param {number[]} queryVector - 查询向量
   * @param {number} userId - 用户ID(数据隔离)
   * @param {number} kbId - 知识库ID(可选)
   * @param {number} topK - 返回结果数量
   * @returns {Promise<Array>} 相似文本块
   */
  async search(queryVector, userId, kbId = null, topK = 5) {
    await this.init()
    
    const table = await this.db.openTable(this.tableName)
    
    // 构建过滤条件
    let whereClause = `user_id = ${userId}`
    if (kbId) {
      whereClause += ` AND kb_id = ${kbId}`
    }
    
    // 执行搜索
    const results = await table
      .search(queryVector)
      .where(whereClause)
      .limit(topK)
      .toArray()
    
    return results.map(r => ({
      id: r.id,
      content: r.content,
      file_name: r.file_name,
      score: r._distance ? 1 - r._distance : 0,  // 距离转相似度
      doc_id: r.doc_id,
      chunk_index: r.chunk_index
    }))
  }

  /**
   * 删除知识库的所有向量
   * @param {number} kbId - 知识库ID
   */
  async deleteByKbId(kbId) {
    await this.init()
    
    const table = await this.db.openTable(this.tableName)
    await table.delete(`kb_id = ${kbId}`)
  }

  /**
   * 删除文档的所有向量
   * @param {number} docId - 文档ID
   */
  async deleteByDocId(docId) {
    await this.init()
    
    const table = await this.db.openTable(this.tableName)
    await table.delete(`doc_id = ${docId}`)
  }

  /**
   * 获取知识库的向量数量
   * @param {number} kbId - 知识库ID
   */
  async getChunkCount(kbId) {
    await this.init()
    
    const table = await this.db.openTable(this.tableName)
    const results = await table.search().where(`kb_id = ${kbId}`).limit(10000).execute()
    
    return results.length
  }
}

// 导出单例
module.exports = new VectorStore()
