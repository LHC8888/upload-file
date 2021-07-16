<script>
// import { checkFileFormat } from "../checkFileFormat";
import { compressImage } from "../compress";
import { ref } from "vue";
import { isImageType, file2Blob, FILE_STATUS } from "../utils";
import request, { verifyUpload } from "../request";
import createFileChunk from "../createFileChunk";

export default {
  props: {
    modelValue: {
      type: Array,
      default() {
        return [];
      },
    },
    multiple: {
      // 是否可以上传多张
      type: Boolean,
      default: false,
    },
    limit: {
      // 限制上传个数
      type: [String, Number],
      default: 9,
    },
    beforeUpload: {
      // 上传前触发
      type: Function,
      default() {
        return function (files) {
          return Promise.resolve(files);
        };
      },
    },
    onProgress: {
      // 上传中触发
      type: Function,
      default() {
        return () => {};
      },
    },
    onSuccess: {
      // 上传成功
      type: Function,
      default() {
        return () => {};
      },
    },
    onError: {
      // 上传失败
      type: Function,
      default() {
        return () => {};
      },
    },
    action: {
      // 上传接口的参数
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
    const { beforeUpload, compress, limit, action, onProgress, onSuccess, onError } =
      props;
    const { emit } = ctx;

    const uploadFiles = () => {
      // 请求池控制上传数量
      // verifyUpload()
      fileList.value.forEach((file) => {
        const filename = file.name;
        const suffix = filename.substr(filename.lastIndexOf("."));
        const { hash, chunkList } = createFileChunk(file);
        const totalSize = file.blobCompressed.size;

        verifyUpload({
          url: `${action.url}/upload/verify`,
          data: { hash, suffix },
        })
          .then((res) => {
            res = JSON.parse(res);
            if (!res.isFinished) {
              const chunkSaved = res.chunk || [];
              const chunkUploadTask = [];
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
                const uploadTask = request({
                  method: "POST",
                  url: `${action.url}/upload`,
                  data: formData,
                  onprogress(e) {
                    // TODO 所有文件的总进度（这个应该没啥必要，而且不好算）
                    // 这里是单个chunk的上传进度
                    const chunkSize = chunk.data.size;
                    const progress = e.loaded / e.total;
                    const chunkProgress = (chunkSize / totalSize) * progress;
                    file.uploadProgress = file.uploadProgress
                      ? file.uploadProgress + chunkProgress
                      : 0;
                    onProgress(file);
                  },
                });

                chunkUploadTask.push(uploadTask);
              });

              Promise.all(chunkUploadTask)
                .then((res) => {
                  file.status = FILE_STATUS.UPLOAD_SUCCESS;
                  onSuccess(file, res);
                })
                .catch((err) => {
                  file.status = FILE_STATUS.UPLOAD_ERROR;
                  onError(file, err);
                });
            } else {
              // 秒传进度直接置为1
              file.status = FILE_STATUS.UPLOAD_SUCCESS;
              onProgress(file, 1);
              onSuccess(file, res);
            }
          })
          .catch((err) => {
            file.status = FILE_STATUS.UPLOAD_ERROR;
            onError(file, err);
          })
          .finally(() => {
            emit("update:modelValue", fileList.value);
          });
      });
    };

    const processFiles = (filesToUpload) => {
      const length = filesToUpload.length;
      const useWorker = length > 1; // 同时上传多个文件时再用worker
      const task = Array.from(filesToUpload).map((file) => {
        const { type } = file;
        // 如果是图片则需要压缩
        if (compress && type && isImageType(type)) {
          return Promise.resolve(compressImage(file, useWorker));
        } else {
          return file2Blob(file.origin).then(({ blob, arrayBuffer }) => ({
            ...file,
            blobCompressed: blob,
            arrayBuffer,
          }));
        }
      });

      return Promise.all(task).then((filesToUpload) => {
        filesToUpload.forEach(file => {
          const idx = file.index
          // TODO 非图片的使用其他方式显示文件
          const previewUrl = URL.createObjectURL(file.blobCompressed);
          fileList.value[idx] = {
            ...file,
            previewUrl,
          }
        });
        emit("update:modelValue", fileList.value);
        // 上传接口的调用必须耦合在组件里面，因为组件需要上传进度，否则，如果请求逻辑写在外头，那么后面会有许多重复的请求逻辑
        uploadFiles();
      });
    };

    // ⚠️多选时只会触发一次
    const handleChange = (e) => {
      const files = e.target.files;

      const filesToUpload = Array.from(files).map((file, idx) => ({
        index: fileList.value.length + idx,
        origin: file,
        type: file.type,
        lastModified: file.lastModified,
        size: file.size,
        name: file.name,
        status: FILE_STATUS.UPLOADING,
      }));
      fileList.value = fileList.value.concat(filesToUpload);

      let p;
      const before = beforeUpload(filesToUpload);
      // TODO 完善 before 判断
      // 暂时只有 thenable 才可以进入校验失败的逻辑
      if (before && before.then) {
        p = before.then(() => {
          return filesToUpload
        });
      } else if(before === undefined || before === false) {
        p = Promise.reject()
      } else {
        p = Promise.resolve(filesToUpload);
      }
      p.then(
        (fileList) => {
          emit("update:modelValue", fileList.value);
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
</template>
