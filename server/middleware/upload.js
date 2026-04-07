// 导入multer中间件
const multer = require('multer')
// 导入path
const path = require('path')
// 存储路径
const imgPath = path.join(__dirname,'..','uploads','img')
const videoPath = path.join(__dirname,'..','uploads','video')
// 存储配置
const imgStorage = multer({
  storage: multer.diskStorage({
    destination: imgPath,
    filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.random() + '.png')
  })
})
const videoStorage = multer({dest: videoPath})
module.exports = {
  imgStorage,
  videoStorage
}