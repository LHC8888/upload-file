// @flow

/**
 * 压缩方式
 * 1. HTMLCanvasElement.toBlob(callback, type, encoderOptions)
 *    callback 执行成功后的回调函数，形参为Blob对象
 *    type 图片的MIME类型
 *    encoderOptions 取值[0, 1]，用于指定图片格式为 image/jpeg 或者 image/webp 的展示质量，也就是压缩质量。
 * 
 * 2. Worker + OffscreenCanvas + window.createImageBitmap
 * 
 *    ImageBitmap 接口表示能够被绘制到 <canvas> 上的位图图像，具有低延迟的特性。
 *  
 *    window.createImageBitmap(image, sx, sy, sw, sh): Promise<ImageBitmap>  将图像解码成位图，也就是读取图像，这个方法可以减少解码时间，可以在worker中使用(self.createImageBitmap)
 * 
 *    OffscreenCanvas.convertToBlob(options): Promise<Blob> 将canvas中的图像数据转为Blob
 *      options:
 *        type 图像的MIME类型
 *        quality 取值[0, 1]，用于指定图片格式为 image/jpeg 或者 image/webp 的展示质量，也就是压缩质量。
 * 
 *    OffscreenCanvas.prototype.transferToImageBitmap(): ImageBitmap  将canvas中的图像转为ImageBitmap
 */

import { readFile } from './utils'
import compressWorker from './compressWorker'

type FileToCompress = {
  origin: File,
  mimeType: string,
  type: string
}
type FileCompressed = {
  blobCompressed: Blob,
  arrayBuffer: ArrayBuffer | null | string,
  ratio: number
}
type MessageData = {
  ...MessageEvent,
  data: {
    type: string,
    blob: Blob
  }
}

const supportWorker = !!(window.Worker && window.createImageBitmap && window.OffscreenCanvas)

export function compressImage(file: FileToCompress, useWorker: Boolean): Promise<FileCompressed> {

  if (useWorker && supportWorker) {
    return workerCompressTask(file)
  }

  return compressTask(file)
}

export function workerCompressTask(file: FileToCompress): Promise<FileCompressed> {
  return readFile(file.origin).then(fileBlob => {
    return new Promise(res => {
      const workerBlob = new Blob([`(${compressWorker})()`], { type: 'application/javascript' })
      const url = URL.createObjectURL(workerBlob)
      const worker = new Worker(url)
      URL.revokeObjectURL(url)

      worker.addEventListener('message', (msg: MessageData) => {
        // console.log('msg ', msg);
        const { data } = msg
        if (data) {
          const { type, blob } = data
          if (typeof type === 'string') {
            if (type === 'compress') {
              const ratio = blob.size / fileBlob.blob.size
              const imageResolved = {
                ...file,
                blobCompressed: blob,
                ratio,
                arrayBuffer: fileBlob.arrayBuffer
              }
              res(imageResolved)
            }
          }
        }
      })

      // worker 不能向worker中传递File，会报错 Uncaught DOMException: Failed to execute 'postMessage' on 'Worker': #<Object> could not be cloned.
      worker.postMessage({
        type: 'compress',
        blob: fileBlob.blob,
        mimeType: file.type
      })
    })
  })
}

export function compressTask(file: FileToCompress): Promise<FileCompressed> {
  return readFile(file.origin).then(fileBlob => {
    return window.createImageBitmap(fileBlob.blob).then(imageBitmap => {
      const { width, height } = imageBitmap
      const canvas = document.createElement('canvas')
      canvas.setAttribute('width', width)
      canvas.setAttribute('height', height)
      const ctx = canvas.getContext('2d')
      ctx.drawImage(imageBitmap, 0, 0, width, height)

      return new Promise(res => {
        const quality = Math.max(0.92, 0.1)
        canvas.toBlob(function (blob) {
          const ratio = blob.size / fileBlob.blob.size
          const imageResolved = {
            ...file,
            blobCompressed: blob,
            ratio,
            arrayBuffer: fileBlob.arrayBuffer
          }
          res(imageResolved)
        }, file.mimeType, quality)
      })
    })
  })
}

// export function canvasCompress() {

// }

// export function lubanCompress() { }
