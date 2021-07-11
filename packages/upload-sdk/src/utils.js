// @flow

/**
 * 判断是不是图像文件
 * @param {String} mimeType File对象里的type属性
 * @returns 
 */
export function isImageType(mimeType: string): boolean {
  const types = /(.*)\/(.*)/.exec(mimeType)
  return types[1] === 'image'
}

/**
 * File -> Blob
 * @param {File} file 文件对象
 */
export function file2Blob(file: File): Promise {
  return new Promise(res => {
    const reader = new FileReader()
    reader.onload = function () {
      res(new Blob(reader.result))
    }
    reader.readAsArrayBuffer(file)
  })
}

export function readFile(file: File): Promise<ArrayBuffer> {
  return new Promise(res => {
    const reader = new FileReader()
    reader.onload = () => {
      const blob = new Blob([reader.result])
      res(blob)
    }
    reader.readAsArrayBuffer(file)
  })
}