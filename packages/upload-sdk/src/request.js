export default function request({ method, data, url, onprogress }) {
  return new Promise((res, rej) => {
    const xhr = new XMLHttpRequest()
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4 && xhr.status === 200) {
        res(xhr.response)
      }
    }
    xhr.onerror = (e) => {
      rej(e)
    }
    xhr.upload.onprogress = onprogress
    xhr.open(method, url, true)
    xhr.send(data)
  })
}

export function verifyUpload({ url, data }) {
  let query = Object.entries(data)
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  return request({
    method: "GET",
    url: `${url}?${query}`
  });
}