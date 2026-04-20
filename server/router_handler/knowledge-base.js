const db = require('../db/index')
const path = require('path')
const fs = require('fs')
const documentParser = require('../utils/document-parser')
const embedding = require('../utils/embedding')
const vectorStore = require('../utils/vector-store')

// 上传文件存储路径
const UPLOAD_PATH = path.join(__dirname, '../uploads/kb-documents')

// 确保上传目录存在
if (!fs.existsSync(UPLOAD_PATH)) {
  fs.mkdirSync(UPLOAD_PATH, { recursive: true })
}

/**
 * 创建知识库
 */
exports.createKnowledgeBase = async (req, res) => {
  try {
    const { name, description, icon, color } = req.body
    const userId = req.auth.user_id

    if (!name) {
      return res.status(400).json({ status: 1, message: '知识库名称不能为空' })
    }

    const sql = `
      INSERT INTO knowledge_bases (user_id, name, description, icon, color)
      VALUES (?, ?, ?, ?, ?)
    `
    const [result] = await db.execute(sql, [
      userId, name, description || '', icon || '📚', color || '#667eea'
    ])

    res.json({
      status: 0,
      message: '创建成功',
      data: { kb_id: result.insertId }
    })
  } catch (error) {
    console.error('创建知识库失败:', error)
    res.status(500).json({ status: 1, message: '创建失败', error: error.message })
  }
}

/**
 * 获取用户的知识库列表
 */
exports.getKnowledgeBases = async (req, res) => {
  try {
    const userId = req.auth.user_id

    const sql = `
      SELECT kb_id, name, description, icon, color, doc_count, total_chunks, created_at, updated_at
      FROM knowledge_bases
      WHERE user_id = ? AND status = 1
      ORDER BY updated_at DESC
    `
    const [rows] = await db.execute(sql, [userId])

    res.json({
      status: 0,
      message: '获取成功',
      data: rows
    })
  } catch (error) {
    console.error('获取知识库列表失败:', error)
    res.status(500).json({ status: 1, message: '获取失败', error: error.message })
  }
}

/**
 * 获取知识库详情
 */
exports.getKnowledgeBaseDetail = async (req, res) => {
  try {
    const { kbId } = req.params
    const userId = req.auth.user_id

    const sql = `
      SELECT kb_id, user_id, name, description, icon, color, doc_count, total_chunks, created_at, updated_at
      FROM knowledge_bases
      WHERE kb_id = ? AND user_id = ? AND status = 1
    `
    const [rows] = await db.execute(sql, [kbId, userId])

    if (rows.length === 0) {
      return res.status(404).json({ status: 1, message: '知识库不存在' })
    }

    res.json({
      status: 0,
      message: '获取成功',
      data: rows[0]
    })
  } catch (error) {
    console.error('获取知识库详情失败:', error)
    res.status(500).json({ status: 1, message: '获取失败', error: error.message })
  }
}

/**
 * 更新知识库
 */
exports.updateKnowledgeBase = async (req, res) => {
  try {
    const { kbId } = req.params
    const { name, description, icon, color } = req.body
    const userId = req.auth.user_id

    const sql = `
      UPDATE knowledge_bases
      SET name = ?, description = ?, icon = ?, color = ?
      WHERE kb_id = ? AND user_id = ?
    `
    const [result] = await db.execute(sql, [
      name, description, icon, color, kbId, userId
    ])

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 1, message: '知识库不存在' })
    }

    res.json({ status: 0, message: '更新成功' })
  } catch (error) {
    console.error('更新知识库失败:', error)
    res.status(500).json({ status: 1, message: '更新失败', error: error.message })
  }
}

/**
 * 删除知识库
 */
exports.deleteKnowledgeBase = async (req, res) => {
  try {
    const { kbId } = req.params
    const userId = req.auth.user_id

    // 获取知识库下的所有文档
    const [docs] = await db.execute(
      'SELECT doc_id, file_url FROM kb_documents WHERE kb_id = ? AND user_id = ?',
      [kbId, userId]
    )

    // 删除物理文件
    for (const doc of docs) {
      const filePath = path.join(__dirname, '..', doc.file_url)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    }

    // 删除向量数据
    await vectorStore.deleteByKbId(parseInt(kbId))

    // 删除数据库记录
    await db.execute('DELETE FROM kb_documents WHERE kb_id = ?', [kbId])
    const [result] = await db.execute(
      'DELETE FROM knowledge_bases WHERE kb_id = ? AND user_id = ?',
      [kbId, userId]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 1, message: '知识库不存在' })
    }

    res.json({ status: 0, message: '删除成功' })
  } catch (error) {
    console.error('删除知识库失败:', error)
    res.status(500).json({ status: 1, message: '删除失败', error: error.message })
  }
}

/**
 * 上传文档到知识库
 */
exports.uploadDocument = async (req, res) => {
  try {
    const { kbId } = req.params
    const userId = req.auth.user_id
    const file = req.file

    if (!file) {
      return res.status(400).json({ status: 1, message: '请选择要上传的文件' })
    }

    // 检查知识库归属
    const [kbRows] = await db.execute(
      'SELECT kb_id FROM knowledge_bases WHERE kb_id = ? AND user_id = ?',
      [kbId, userId]
    )
    if (kbRows.length === 0) {
      return res.status(403).json({ status: 1, message: '无权访问该知识库' })
    }

    // 获取文件扩展名
    const ext = path.extname(file.originalname).toLowerCase().slice(1)
    const allowedExts = ['pdf', 'doc', 'docx', 'txt', 'md', 'markdown']
    
    if (!allowedExts.includes(ext)) {
      // 删除上传的文件
      fs.unlinkSync(file.path)
      return res.status(400).json({ 
        status: 1, 
        message: `不支持的文件格式: ${ext}，请上传 PDF、Word、TXT 或 Markdown 文件` 
      })
    }

    // 保存文件到知识库目录
    const kbPath = path.join(UPLOAD_PATH, kbId.toString())
    if (!fs.existsSync(kbPath)) {
      fs.mkdirSync(kbPath, { recursive: true })
    }

    const newFileName = `${Date.now()}_${file.originalname}`
    const newPath = path.join(kbPath, newFileName)
    fs.renameSync(file.path, newPath)

    // 保存记录到数据库
    const relativePath = `/uploads/kb-documents/${kbId}/${newFileName}`
    const sql = `
      INSERT INTO kb_documents (kb_id, user_id, file_name, file_type, file_size, file_url, status)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `
    const [result] = await db.execute(sql, [
      kbId, userId, file.originalname, ext, file.size, relativePath
    ])

    const docId = result.insertId

    // 异步处理文档解析和向量化
    processDocumentAsync(docId, newPath, ext, kbId, userId, file.originalname)

    res.json({
      status: 0,
      message: '上传成功，正在解析文档...',
      data: { doc_id: docId }
    })
  } catch (error) {
    console.error('上传文档失败:', error)
    res.status(500).json({ status: 1, message: '上传失败', error: error.message })
  }
}

/**
 * 异步处理文档（解析+向量化）
 */
async function processDocumentAsync(docId, filePath, fileType, kbId, userId, fileName) {
  try {
    // 更新状态为解析中
    await db.execute('UPDATE kb_documents SET status = 1 WHERE doc_id = ?', [docId])

    // 1. 解析文档
    const text = await documentParser.parse(filePath, fileType)
    
    // 保存前10000字符作为预览
    const previewText = text.slice(0, 10000)
    
    // 2. 文本分块
    const chunks = documentParser.chunkText(text, 800, 100)
    
    if (chunks.length === 0) {
      throw new Error('文档内容为空或无法解析')
    }

    // 3. 生成向量
    const vectors = await embedding.embed(chunks, 'document')

    // 4. 保存到向量库
    const chunkData = chunks.map((content, index) => ({
      user_id: userId,
      kb_id: parseInt(kbId),
      doc_id: docId,
      chunk_index: index,
      content: content,
      vector: vectors[index],
      file_name: fileName
    }))

    await vectorStore.addChunks(chunkData)

    // 5. 更新数据库状态
    await db.execute(
      'UPDATE kb_documents SET content_text = ?, chunk_count = ?, status = 2, parsed_at = NOW() WHERE doc_id = ?',
      [previewText, chunks.length, docId]
    )

    // 6. 更新知识库统计
    await updateKbStats(kbId)

    console.log(`文档 ${fileName} 处理完成，共 ${chunks.length} 个块`)
  } catch (error) {
    console.error('文档处理失败:', error)
    await db.execute(
      'UPDATE kb_documents SET status = 3, error_msg = ? WHERE doc_id = ?',
      [error.message, docId]
    )
  }
}

/**
 * 更新知识库统计信息
 */
async function updateKbStats(kbId) {
  const [docResult] = await db.execute(
    'SELECT COUNT(*) as count, SUM(chunk_count) as total_chunks FROM kb_documents WHERE kb_id = ? AND status = 2',
    [kbId]
  )
  
  await db.execute(
    'UPDATE knowledge_bases SET doc_count = ?, total_chunks = ? WHERE kb_id = ?',
    [docResult[0].count || 0, docResult[0].total_chunks || 0, kbId]
  )
}

/**
 * 获取知识库文档列表
 */
exports.getDocuments = async (req, res) => {
  try {
    const { kbId } = req.params
    const userId = req.auth.user_id

    const sql = `
      SELECT doc_id, file_name, file_type, file_size, chunk_count, status, error_msg, parsed_at, created_at
      FROM kb_documents
      WHERE kb_id = ? AND user_id = ?
      ORDER BY created_at DESC
    `
    const [rows] = await db.execute(sql, [kbId, userId])

    res.json({
      status: 0,
      message: '获取成功',
      data: rows
    })
  } catch (error) {
    console.error('获取文档列表失败:', error)
    res.status(500).json({ status: 1, message: '获取失败', error: error.message })
  }
}

/**
 * 删除文档
 */
exports.deleteDocument = async (req, res) => {
  try {
    const { kbId, docId } = req.params
    const userId = req.auth.user_id

    // 获取文档信息
    const [docs] = await db.execute(
      'SELECT file_url FROM kb_documents WHERE doc_id = ? AND kb_id = ? AND user_id = ?',
      [docId, kbId, userId]
    )

    if (docs.length === 0) {
      return res.status(404).json({ status: 1, message: '文档不存在' })
    }

    // 删除物理文件
    const filePath = path.join(__dirname, '..', docs[0].file_url)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    // 删除向量数据
    await vectorStore.deleteByDocId(parseInt(docId))

    // 删除数据库记录
    await db.execute('DELETE FROM kb_documents WHERE doc_id = ?', [docId])

    // 更新知识库统计
    await updateKbStats(kbId)

    res.json({ status: 0, message: '删除成功' })
  } catch (error) {
    console.error('删除文档失败:', error)
    res.status(500).json({ status: 1, message: '删除失败', error: error.message })
  }
}

/**
 * 搜索知识库内容（测试用）
 */
exports.searchKnowledgeBase = async (req, res) => {
  try {
    const { kbId } = req.params
    const { query } = req.body
    const userId = req.auth.user_id

    if (!query) {
      return res.status(400).json({ status: 1, message: '查询内容不能为空' })
    }

    // 验证知识库权限
    const [kbRows] = await db.execute(
      'SELECT kb_id FROM knowledge_bases WHERE kb_id = ? AND user_id = ?',
      [kbId, userId]
    )
    if (kbRows.length === 0) {
      return res.status(403).json({ status: 1, message: '无权访问该知识库' })
    }

    // 生成查询向量
    const [queryVector] = await embedding.embed([query], 'query')

    // 向量搜索
    const results = await vectorStore.search(queryVector, userId, parseInt(kbId), 5)

    res.json({
      status: 0,
      message: '搜索成功',
      data: results
    })
  } catch (error) {
    console.error('搜索知识库失败:', error)
    res.status(500).json({ status: 1, message: '搜索失败', error: error.message })
  }
}
