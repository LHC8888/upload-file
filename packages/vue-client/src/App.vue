<template>
  <UploadImage
    v-model="files"
    :action="action"
    multiple
    :beforeUpload="beforeUpload"
    :onProgress="onProgress"
    :onSuccess="onSuccess"
    :onError="onError"
  ></UploadImage>
  <div class="preview">
    <div class="cell" v-for="item in files" :style="{ backgroundImage: `url(${item.previewUrl || ''})` }"></div>
  </div>
</template>

<script>
import { ref } from "vue";
import HelloWorld from "./components/HelloWorld.vue";
import UploadImage from "../node_modules/upload-sdk/dist/UploadImage";

export default {
  name: "App",
  components: {
    HelloWorld,
    UploadImage,
  },
  setup() {
    const action = ref({
      url: "http://localhost:3030",
      keyName: "file",
    });
    const files = ref([]);

    const beforeUpload = (fileList) => {
      console.log(fileList.length + files.value.length);
      const max = 3
      if(fileList.length + files.value.length > max) {
        console.log(`图片不能超过${max}张`);
        return 
      }

      return Promise.resolve()
    }
    const onProgress = (file, progress) => {
      console.log("onProgress ", file, progress);
    };
    const onSuccess = (file, res) => {
      console.log("onSuccess", file, res);
      console.log("files = ", files.value);
    };
    const onError = (file, err) => {
      console.log("onError", file, err);
    };

    return {
      action,
      files,
      beforeUpload,
      onProgress,
      onSuccess,
      onError,
    };
  },
};
</script>

<style>
.preview {
  margin-top: 10px;
  display: grid;
  grid-template-columns: 80px 80px 80px;
  grid-template-rows: 80px 80px 80px;
  grid-row-gap: 20px;
  grid-column-gap: 20px;
}
.cell {
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
}

</style>