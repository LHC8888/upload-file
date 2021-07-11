// @flow

export default function compressWorker(file: File) {

  onmessage = msg => {
    const { data } = msg
    const { type, blob, mimeType, qualityCompress = 0.98 } = data
    console.log('compressWorker onmessage ', data);

    if (type === 'compress') {
      self.createImageBitmap(blob).then(imageBitmap => {

        const { width, height } = imageBitmap

        const oc = new OffscreenCanvas(width, height)
        const ctx = oc.getContext('2d')

        ctx.drawImage(imageBitmap, 0, 0, width, height)

        // 释放资源
        imageBitmap.close()

        const quality = Math.max(Math.min(0.98, qualityCompress), 0.5) // 0.5 <= quality <= 0.98
        // console.log('quality ', quality);
        oc.convertToBlob({
          type: mimeType,
          quality
        }).then(blob => {
          self.postMessage({
            type,
            blob
          })
        })

      })

    }

  }

}