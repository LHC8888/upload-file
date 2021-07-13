<script>
// import { checkFileFormat } from "../checkFileFormat";
import { compressImage } from "../compress";
import { ref } from "vue";
import { isImageType, file2Blob, FILE_STATUS } from "../utils";
import request, { verifyUpload } from "../request";
import createFileChunk from "../createFileChunk";

export default {
  props: {
    value: {
      type: Array,
      default() {
        return [];
      },
    },
    multiple: {
      type: Boolean,
      default: false,
    },
    beforeUpload: {
      type: Function,
      default() {
        return function (files) {
          return Promise.resolve(files);
        };
      },
    },
    onProgress: {
      type: Function,
      default() {
        return () => {};
      },
    },
    onSuccess: {
      type: Function,
      default() {
        return () => {};
      },
    },
    onError: {
      type: Function,
      default() {
        return () => {};
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
    const { beforeUpload, compress, action, onProgress, onSuccess, onError } =
      props;
    const { emit } = ctx;

    const uploadFiles = () => {
      // 请求池控制上传数量
      // verifyUpload()
      fileList.value.forEach((file) => {
        const filename = file.name;
        const suffix = filename.substr(filename.lastIndexOf("."));
        const { hash, chunkList } = createFileChunk(file);
        // console.log("chunks", hash, chunkList);

        // const oriSize = file.blobCompressed.size;
        // const chunkSumSize = chunkList.reduce((s, i) => (s += i.data.size), 0);
        // console.log("原来的文件需要进行上传的大小: ", oriSize);
        // console.log("分块后，chunk大小之和：", chunkSumSize);
        // console.log("相等否：", oriSize === chunkSumSize);

        verifyUpload({
          url: `${action.url}/upload/verify`,
          data: { hash, suffix },
        })
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

                // TODO 限制同时请求的数量
                request({
                  method: "POST",
                  url: `${action.url}/upload`,
                  data: formData,
                  onprogress(e) {
                    // TODO 所有文件的总进度（这个应该没啥必要，而且不好算）
                    // 这里是单个文件的上传进度
                    const progress = e.loaded / e.total;
                    onProgress(file, progress);
                  },
                })
                  .then((res) => onSuccess(file, res))
                  .catch((err) => onError(file, err));
              });
            } else {
              // 妙传进度直接置为1
              onProgress(file, 1);
              onSuccess(file, res);
            }
          })
          .catch((err) => {
            onError(err);
          });
      });
    };

    const processFiles = (files) => {
      const length = files.length;
      const useWorker = length > 1; // 同时上传多个文件时再用worker
      const task = Array.from(files).map((file) => {
        const { type } = file;
        // 如果是图片则需要压缩
        if (compress && type && isImageType(type)) {
          return Promise.resolve(compressImage(file, useWorker));
        } else {
          return file2Blob(file.origin).then(({blob, arrayBuffer}) => ({
            ...file,
            blobCompressed: blob,
            arrayBuffer
          }));
        }
      });

      return Promise.all(task).then((files) => {
        console.log("files to Upload", files);
        fileList.value = files.map((file, index) => {
          // TODO 非图片的使用其他方式显示文件
          const previewUrl = URL.createObjectURL(file.blobCompressed);
          return {
            ...file,
            previewUrl,
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
        status: FILE_STATUS.UPLOADING,
      }));

      let p;
      const before = beforeUpload(files);
      // TODO 完善 before 判断
      // 暂时只有 thenable 才可以进入校验失败的逻辑
      if (before && before.then) {
        p = before;
      } else {
        p = Promise.resolve(fileList.value);
      }
      p.then(
        (fileList) => {
          processFiles(fileList);
        },
        (err) => {
          // console.log("handleChange ", err);
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
    <img :src="item.previewUrl" alt="" width="140" height="140" />
  </div>
</template>
