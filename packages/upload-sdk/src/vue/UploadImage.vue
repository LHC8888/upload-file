<script>
// import { checkFileFormat } from "../checkFileFormat";
import { compressImage } from "../compress";
import * as sdk from "../index";
import { ref } from "vue";
import { isImageType } from "../utils";
import request from "../request";
import createFileChunk from "../createFileChunk";

export default {
  props: {
    multiple: {
      type: Boolean,
      default: false,
    },
    size: {
      type: [String, Number], // Btye
      default: Number.MAX_SAFE_INTEGER,
    },
    beforeUpload: {
      type: Function,
      default() {
        return function (files) {
          return Promise.resolve(files);
        };
      },
    },
    action: {
      // Object{ url: 服务器路径, keyName：文件字段名 }
      type: Object,
      required: true,
    },
    compress: {
      // 是否进行压缩
      type: Boolean,
      default: true,
    },
  },
  setup(props, ctx) {
    // 单文件也统一当作数组进行处理
    const fileList = ref([]);
    const inputFile = ref(null);
    const { beforeUpload, compress, action } = props;
    const { emit } = ctx;

    const uploadFiles = () => {
      // 请求池控制上传数量
      // verifyUpload()
      fileList.value.forEach((file) => {
        const filename = file.name
        const suffix = filename.substr(filename.lastIndexOf("."));
        const { hash, chunkList } = createFileChunk(file);
        console.log("chunks", hash, chunkList);

        verifyUpload({ hash, suffix })
          .then((res) => {
            res = JSON.parse(res);
            if (!res.isFinished) {
              const chunkSaved = res.chunk || [];
              chunkList.forEach((chunk) => {
                if (chunkSaved.includes(chunk.index)) return;

                const formData = new FormData();
                formData.set("suffix", suffix);
                formData.set("hash", hash);
                formData.set("filename", filename);
                formData.set("data", chunk.data);
                formData.set("index", chunk.index);
                formData.set("length", chunkList.length); // 每次都把chunk的个数传给接口 用于判断

                request({
                  method: 'POST',
                  url: `${action.url}/upload`,
                  data: formData,
                  onprogress(e) {
                    // TODO 上传进度  分片进度、总进度
                    console.log(e.loaded, e.total, e.loaded / e.total);
                    console.log('progress ', e);
                  }
                })
              });
            }
          })
          .catch((err) => {
            console.log(err);
          });
      });
    };
    function verifyUpload(data) {
      let query = Object.entries(data)
        .map(([k, v]) => `${k}=${v}`)
        .join("&");
      return request({
        method: "GET",
        url: `${action.url}/upload/verify?${query}`,
      });
    }

    const processFiles = (files) => {
      const task = Array.from(files).map((file) => {
        // 如果是图片则需要压缩
        if (compress && isImageType(file.type)) {
          return Promise.resolve(compressImage(file));
        } else {
          return Promise.resolve(file2Blob(file));
        }
      });

      return Promise.all(task).then((blobs) => {
        console.log("blobs", blobs);
        fileList.value = blobs.map((blob, index) => {
          const imgUrl = URL.createObjectURL(blob.compressed);
          return {
            ...blob,
            imgUrl,
          };
        });
        // 上传接口的调用必须耦合在组件里面，因为组件需要上传进度，否则，如果请求逻辑写在外头，那么后面会有许多重复的请求逻辑
        uploadFiles();
      });
    };

    // ⚠️多选时只会触发一次
    const handleChange = (e) => {
      const files = e.target.files;

      fileList.value = Array.from(files).map((file, idx) => ({
        index: idx,
        origin: file,
        type: file.type,
        lastModified: file.lastModified,
        size: file.size,
        name: file.name,
      }));

      let p;
      const before = beforeUpload(files);
      if (!before) {
        p = Promise.resolve([]);
      } else if (before && before.then) {
        p = before;
      } else {
        p = Promise.resolve(fileList.value);
      }
      p.then(
        (fileList) => {
          processFiles(fileList);
        },
        (err) => {
          console.log("handleChange ", err);
        }
      );
    };

    const toggleUpload = () => {
      inputFile.value.click();
    };

    return {
      fileList,
      inputFile,
      handleChange,
      toggleUpload,
    };
  },
};
</script>

<template>
  <div @click="toggleUpload" style="cursor: pointer; background: coral">
    上传文件
  </div>
  <input
    ref="inputFile"
    style="display: none"
    type="file"
    :multiple="multiple"
    @change="handleChange"
  />
  <div v-for="item in fileList">
    <img :src="item.imgUrl" alt="" width="140" height="140" />
  </div>
</template>
