// https://github.com/vuejs/rollup-plugin-vue
import VuePlugin from 'rollup-plugin-vue'

export default [
  {
    input: 'src/index.js',
    output: {
      file: 'dist/upload.esm.js',
      format: 'esm'
    },
    watch: {
      include: 'src/**'
    }
  },
  {
    input: 'src/vue/UploadImage.vue',
    output: {
      file: 'dist/UploadImage.js', // js文件
      format: 'esm',
      sourcemap: 'inline'
    },
    plugins: [VuePlugin()],
    external: ['vue']
  }
]