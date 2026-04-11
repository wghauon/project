// 导入multer中间件
const multer = require('multer')
// 导入path
const path = require('path')
// 导入fs-extra
const fs = require('fs-extra')
// 存储路径
const imgPath = path.join(__dirname,'..','uploads','img')
const videoPath = path.join(__dirname,'..','uploads','video')
const filePath = path.join(__dirname,'..','uploads','file')

// 确保文件上传目录存在
fs.ensureDirSync(filePath)

// 存储配置
const imgStorage = multer({
  storage: multer.diskStorage({
    destination: imgPath,
    filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.random() + '.png')
  })
})
const videoStorage = multer({dest: videoPath})

// 资料文件存储配置
const fileStorage = multer({
  storage: multer.diskStorage({
    destination: filePath,
    filename: (req, file, cb) => {
      // 保留原始文件名，添加时间戳避免重复
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8')
      const ext = path.extname(originalName)
      const baseName = path.basename(originalName, ext)
      cb(null, `${baseName}-${uniqueSuffix}${ext}`)
    }
  })
})

module.exports = {
  imgStorage,
  videoStorage,
  fileStorage
}