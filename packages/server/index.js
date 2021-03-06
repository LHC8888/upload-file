const Koa = require('koa')
const static = require('koa-static')
const logger = require('koa-logger')
const Router = require('@koa/router');
const koaBody = require('koa-body')
const path = require('path')
const cors = require('koa2-cors');

const fs = require('fs')
const { getDate } = require('./util')

const app = new Koa()
const router = new Router();

/**
 * 更多场景：
 * 请求过多怎么处理
 * 切片上传失败怎么办
   上传过程中刷新页面怎么办
   如何进行并行上传
   切片什么时候按数量切，什么时候按大小切
   如何结合 Web Work 处理大文件上传
   如何实现秒传
 */
const host = 'http://localhost:3030'

app.use(cors());

app.use(koaBody({
  multipart: true, // Parse multipart bodies
  formidable: {
    multiples: true, // 多文件上传
    keepExtensions: true // 保存文件的拓展名
  }
}))

router.get('/sth', (ctx, next) => {
  // ctx.router available
  // ctx.body = 'aloha'
  next()
});

// 上传文件
router.post('/upload', (ctx, next) => {
  const { filename, index, length, hash, suffix } = ctx.request.body

  const datedir = path.resolve(__dirname, `./file`)
  if (!fs.existsSync(datedir)) fs.mkdirSync(datedir)

  const dir = path.resolve(datedir, `./${hash}`)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  // 单文件上传
  // console.log('ctx.request.body ', ctx.request.body)
  // console.log('ctx.request.body ', ctx.request.files.data)
  const file = ctx.request.files.data
  const filepath = path.resolve(dir, `${hash}_${index}`)
  const rs = fs.createReadStream(file.path)
  const ws = fs.createWriteStream(filepath)
  rs.pipe(ws)

  rs.on('end', () => {
    // 检查文件是否接收完毕
    const fileListInDir = fs.readdirSync(dir)
    let sum = 0
    fileListInDir.forEach(filename => {
      if (filename.indexOf(filename) > -1) {
        ++sum
      }
    })

    // 如果文件的所有chunk都接收到了 需要把chunk拼接起来
    // ⚠️ 需要处理数据的编码类型
    if (sum === Number(length)) {
      const newFilePath = path.resolve(dir, `${hash}${suffix}`)
      for (let i = 0; i < length; i++) {
        const chunkPath = path.resolve(dir, `${hash}_${i}`)
        const chunk = fs.readFileSync(chunkPath)
        fs.writeFileSync(newFilePath, chunk, { flag: 'a' })
        // 删除chunk文件
        fs.rmSync(chunkPath)
      }
    }
  })

  ctx.body = 'success!'
  next()
})

// 文件上传前的校验
// 实现文件续传和文件秒传
/**
 * return {
 *    chunk: [], // 表示服务器已经存储了的 chunk 索引
 *    isFinished: true | false // 表示是否已完成上传
 * }
 */
router.get('/upload/verify', (ctx, next) => {
  const { query } = ctx.request
  const { hash, suffix } = query
  const ret = {
    chunk: [],
    isFinished: false,
    url: ''
  }

  const relativeFilePath = `file/${hash}`
  const dirpath = path.resolve(__dirname, relativeFilePath)
  const filepath = path.resolve(dirpath, `${hash}${suffix}`)

  // 首先检查路径是否存在
  if (fs.existsSync(dirpath)) {
    // 如果已有完整的文件
    if (fs.existsSync(filepath)) {
      ret.isFinished = true
      ret.url = `${host}/${relativeFilePath}/${hash}${suffix}`
    } else {
      ret.isFinished = false
      // 如果没有完整的文件则需要返回已上传切片的索引
      const filenames = fs.readdirSync(dirpath)
      filenames.forEach(name => {
        const spl = name.split('_')
        if (spl.length === 2) {
          ret.chunk.push(Number(spl[1]))
        }
      })
    }
  }

  ctx.body = ret
})

app.use(logger())
app.use(router.routes())
// app.use(static(path.resolve(__dirname, '../client')))
app.use(static(path.resolve(__dirname)))

app.listen(3030, () => {
  console.log(`listen at ${host}`);
})