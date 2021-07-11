<template>
  <!-- <img alt="Vue logo" src="./assets/logo.png" /> -->
  <!-- <HelloWorld msg="Hello Vue 3.0 + Vite" /> -->
  <UploadImage v-model="files" :action="action" multiple></UploadImage>
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
    const files = ref([])

    return {
      action,
      files
    };
  },
};
</script>
