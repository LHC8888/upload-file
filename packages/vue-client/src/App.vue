<template>
  <img alt="Vue logo" src="./assets/logo.png" />
  <HelloWorld msg="Hello Vue 3.0 + Vite" />
  <UploadImage name="world"></UploadImage>
</template>

<script>
import HelloWorld from './components/HelloWorld.vue'
import UploadImage from '../node_modules/upload-sdk/dist/UploadImage'

export default {
  name: 'App',
  components: {
    HelloWorld,
    UploadImage
  }
}
</script>
