// @flow

/**
 * 判断是不是图像文件
 * @param {String} mimeType File对象里的type属性
 * @returns 
 */
export function isImageType(mimeType: string): boolean {
  const types = /(.*)\/(.*)/.exec(mimeType)
  return types 
          ? types[1] 
            ? types[1] === 'image' 
            : false
          : false
}

/**
 * File -> Blob
 * @param {File} file 文件对象
 */
export function file2Blob(file: File): Promise<ReadFileType> {
  return readFile(file)
}

type ReadFileType = {
  blob: Blob,
  arrayBuffer: null | string | ArrayBuffer
}
export function readFile(file: File): Promise<ReadFileType> {
  if (!file) return Promise.reject()
  return new Promise(res => {
    const reader = new FileReader()
    reader.onload = () => {
      const arrayBuffer = reader.result
      const blob = new Blob([arrayBuffer])
      const ret: ReadFileType = {
        blob: blob,
        arrayBuffer: arrayBuffer
      }
      res(ret)
    }
    reader.readAsArrayBuffer(file)
  })
}

// 文件状态
export const FILE_STATUS = {
  UPLOADING: 'uploading',
  UPLOAD_SUCCESS: 'success',
  UPLOAD_ERROR: 'error'
}