// import SparkMD5 from 'spark-md5'/

// chunkSize 单位是MB   1MB = 1024KB = 1024B
export function createFileChunk(file, chunkSize = 2) {
  const reader = new FileReader()

  // spark 是文件名跟文件内容的hash
  // 因为文件名可能相同但是文件内容不同，也可能是文件名不同但文件内容相同
  // 这两种情况都应该当作是一个新的文件
  const spark = new SparkMD5.ArrayBuffer()
  spark.append(file.name)
  const ret = {
    filename: file.name,
    chunkList: [],
    hash: ''
  }
  return new Promise(res => {
    reader.onload = () => {
      console.log(`读取成功: ${file.name}`);

      const aryBuffer = reader.result
      const byteLength = aryBuffer.byteLength
      const step = chunkSize * 1024 * 1024
      for (let i = 0, idx = 0; i < byteLength; i += step, ++idx) {
        spark.append(aryBuffer.slice(i, i + step))
        ret.chunkList.push({
          index: idx,
          data: new Blob([aryBuffer.slice(i, i + step)], { type: 'text/plain,charset=UTF-8' }) // ajax可以传输Blob
        })
        // console.log('new Uint8Array ', new Uint8Array(aryBuffer.slice(i, i + step)));
      }
      // console.log('aryBuffer = ', aryBuffer);
      // console.log('aryBuffer.byteLength = ', aryBuffer.byteLength);
      ret.hash = spark.end()
      console.log('ret ', ret);
      res(ret)
    }
    reader.readAsArrayBuffer(file)
  })
}
