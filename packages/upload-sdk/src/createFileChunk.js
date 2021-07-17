// @flow

//$FlowFixMe[cannot-resolve-module]
import 'spark-md5'
import { readFile } from './utils'

type ChunkData = {
  index: number,
  data: Blob
}
type ChunkType = {
  hash: string,
  chunkList: Array<ChunkData>
}
type FileToSeparate = {
  name: string, 
  blobCompressed: Blob, 
  arrayBuffer: ArrayBuffer
}

// chunkSize 单位是MB   1MB = 1024KB = 1024B
export default function createFileChunk(file: FileToSeparate, chunkSize: number): ChunkType {
  chunkSize = chunkSize || 2

  // spark 是文件名跟文件内容的hash
  // 因为文件名可能相同但是文件内容不同，也可能是文件名不同但文件内容相同
  // 这两种情况都应该当作是一个新的文件
  const { name, blobCompressed, arrayBuffer } = file
  const chunkList = []
  const ret: ChunkType = {
    hash: '',
    chunkList: []
  }

  const byteLength = blobCompressed.size
  const step = chunkSize * 1024 * 1024
  for (let i: number = 0, idx = 0; i < byteLength; i += step, ++idx) {
    const curBlob = blobCompressed.slice(i, i + step)
    chunkList.push({
      index: idx,
      data: curBlob // ajax可以传输Blob
    })
  }

  //$FlowFixMe[cannot-resolve-name]
  const spark = new SparkMD5.ArrayBuffer()
  spark.append(arrayBuffer)
  
  ret.hash = spark.end()
  ret.chunkList = chunkList

  return ret
}
