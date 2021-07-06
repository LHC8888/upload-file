<template>
  <!-- <img alt="Vue logo" src="./assets/logo.png" /> -->
  <!-- <HelloWorld msg="Hello Vue 3.0 + Vite" /> -->
  <UploadImage  :suffix='["jpg", "jpeg",  "gif"]'></UploadImage>
</template>

<script>
import HelloWorld from "./components/HelloWorld.vue";
import UploadImage from "../node_modules/upload-sdk/dist/UploadImage";
import { checkFileFormat } from "../node_modules/upload-sdk/dist/upload.esm.js";

export default {
  name: "App",
  components: {
    HelloWorld,
    UploadImage,
  },
  setup() {},
};
</script>
