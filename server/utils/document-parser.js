const fs = require('fs')
const path = require('path')
const mammoth = require('mammoth')
const pdfParse = require('pdf-parse')
const { marked } = require('marked')

/**
 * 文档解析工具类
 * 支持PDF、Word(doc/docx)、TXT、Markdown格式
 */
class DocumentParser {
  /**
   * 根据文件类型解析文档
   * @param {string} filePath - 文件路径
   * @param {string} fileType - 文件类型
   * @returns {Promise<string>} 提取的文本内容
   */
  async parse(filePath, fileType) {
    const ext = fileType.toLowerCase()
    
    switch (ext) {
      case 'pdf':
        return await this.parsePDF(filePath)
      case 'doc':
      case 'docx':
        return await this.parseWord(filePath)
      case 'md':
      case 'markdown':
        return await this.parseMarkdown(filePath)
      case 'txt':
      case 'text':
        return await this.parseText(filePath)
      default:
        throw new Error(`不支持的文件类型: ${fileType}`)
    }
  }

  /**
   * 解析PDF文件
   */
  async parsePDF(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath)
      const result = await pdfParse(dataBuffer)
      return this.cleanText(result.text)
    } catch (error) {
      throw new Error(`PDF解析失败: ${error.message}`)
    }
  }

  /**
   * 解析Word文件(doc/docx)
   */
  async parseWord(filePath) {
    try {
      const result = await mammoth.extractRawText({ path: filePath })
      return this.cleanText(result.value)
    } catch (error) {
      throw new Error(`Word文档解析失败: ${error.message}`)
    }
  }

  /**
   * 解析Markdown文件
   */
  async parseMarkdown(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      // 将Markdown转换为纯文本
      const html = marked(content)
      // 简单的HTML标签去除
      const text = html.replace(/<[^>]*>/g, ' ')
      return this.cleanText(text)
    } catch (error) {
      throw new Error(`Markdown解析失败: ${error.message}`)
    }
  }

  /**
   * 解析纯文本文件
   */
  async parseText(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      return this.cleanText(content)
    } catch (error) {
      throw new Error(`文本文件解析失败: ${error.message}`)
    }
  }

  /**
   * 清理文本内容
   */
  cleanText(text) {
    return text
      .replace(/\r\n/g, '\n')  // 统一换行符
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')  // 去除多余空行
      .replace(/\t/g, ' ')  // Tab转空格
      .replace(/[ ]{2,}/g, ' ')  // 去除多余空格
      .trim()
  }

  /**
   * 将文本分块
   * @param {string} text - 原始文本
   * @param {number} chunkSize - 每块大小(字符数)
   * @param {number} overlap - 重叠大小
   * @returns {string[]} 文本块数组
   */
  chunkText(text, chunkSize = 800, overlap = 100) {
    const chunks = []
    const paragraphs = text.split('\n').filter(p => p.trim())
    
    let currentChunk = ''
    
    for (const paragraph of paragraphs) {
      // 如果当前段落加入后超过块大小，先保存当前块
      if (currentChunk.length + paragraph.length > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim())
        // 保留重叠部分
        const words = currentChunk.split('')
        currentChunk = words.slice(-overlap).join('') + '\n' + paragraph
      } else {
        currentChunk += (currentChunk ? '\n' : '') + paragraph
      }
    }
    
    // 保存最后一个块
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim())
    }
    
    return chunks
  }
}

module.exports = new DocumentParser()
