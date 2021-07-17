// @flow
const FILE_FORMAT = {
  JPEG: 'JPEG',
  JPG: 'JPG',
  PNG: 'PNG',
  GIF: 'GIF'
}

const CheckFileStrategy = {
  [FILE_FORMAT.JPEG](fileArrayBuffer: ArrayBuffer): boolean {
    return checkFileFormatSingle(fileArrayBuffer, FILE_FORMAT.JPEG)
  },
  [FILE_FORMAT.JPG](fileArrayBuffer: ArrayBuffer): boolean {
    return this[[FILE_FORMAT.JPEG]](fileArrayBuffer)
  },
  [FILE_FORMAT.PNG](fileArrayBuffer: ArrayBuffer): boolean {
    return checkFileFormatSingle(fileArrayBuffer, FILE_FORMAT.PNG)
  },
  [FILE_FORMAT.GIF](fileArrayBuffer: ArrayBuffer): boolean {
    return checkFileFormatSingle(fileArrayBuffer, FILE_FORMAT.GIF)
  }
}

// https://blog.csdn.net/shendeguang/article/details/18449627
const formatMagicNumberMap = {
  [FILE_FORMAT.JPEG]: ['FF', 'D8', 'FF'],
  [FILE_FORMAT.PNG]: ['89', '50', '4E', '47'],
  [FILE_FORMAT.GIF]: ['47', '49', '46', '38']
}

export function checkFileFormatSingle(fileArrayBuffer: ArrayBuffer, format: string): boolean {
  // https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/DataView
  // DataView 不需要考虑不同平台的字节序
  const dv = new DataView(fileArrayBuffer)
  const magicNumber = formatMagicNumberMap[format.toUpperCase()]
  for (let i = 0; i < magicNumber.length; i++) {
    const curMagicNumber = magicNumber[i]
    const curData = dv.getUint8(i).toString(16).toUpperCase()
    if (curMagicNumber !== curData) {
      return false
    }
  }
  return true
}

/**
 * 用于检查file是否为formatArr里面的类型之一
 * @param {*} fileArrayBuffer 文件 ArrayBuffer
 * @param {*} formatArr 文件需要匹配的格式数组
 */
export function checkFileFormat(fileArrayBuffer: ArrayBuffer, formatArr: string[]): boolean {
  if (!formatArr || !formatArr.length) {
    return true
  }

  const success = formatArr.some((item, idx) => {
    const format = item.toUpperCase()
    return CheckFileStrategy[format](fileArrayBuffer)
  })

  return success
}
