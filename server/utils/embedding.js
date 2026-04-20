const OpenAI = require('openai')

// 初始化阿里云百炼客户端
const openai = new OpenAI({
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  apiKey: 'sk-539f3b21871a497194f9c5548efb7574'
})

/**
 * Embedding服务类
 * 使用阿里云百炼text-embedding-v3模型
 */
class EmbeddingService {
  constructor() {
    this.model = 'text-embedding-v3'
    this.dimensions = 1024  // text-embedding-v3输出1024维向量
  }

  /**
   * 生成文本向量
   * @param {string|string[]} texts - 文本或文本数组
   * @param {string} type - 文本类型: 'document' | 'query'
   * @returns {Promise<number[][]>} 向量数组
   */
  async embed(texts, type = 'document') {
    const textArray = Array.isArray(texts) ? texts : [texts]
    
    // 批量处理，每次最多10条
    const batchSize = 10
    const allEmbeddings = []
    
    for (let i = 0; i < textArray.length; i += batchSize) {
      const batch = textArray.slice(i, i + batchSize)
      
      try {
        const response = await openai.embeddings.create({
          model: this.model,
          input: batch,
          dimensions: this.dimensions,
          encoding_format: 'float'
        })
        
        const embeddings = response.data.map(item => item.embedding)
        allEmbeddings.push(...embeddings)
      } catch (error) {
        console.error('Embedding生成失败:', error)
        throw new Error(`Embedding生成失败: ${error.message}`)
      }
    }
    
    return allEmbeddings
  }

  /**
   * 计算余弦相似度
   * @param {number[]} vecA - 向量A
   * @param {number[]} vecB - 向量B
   * @returns {number} 相似度分数(0-1)
   */
  cosineSimilarity(vecA, vecB) {
    let dotProduct = 0
    let normA = 0
    let normB = 0
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i]
      normA += vecA[i] * vecA[i]
      normB += vecB[i] * vecB[i]
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }
}

module.exports = new EmbeddingService()
