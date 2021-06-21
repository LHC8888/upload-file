export default {
  input: 'src/index.js',
  output: {
    file: 'dist/upload.esm.js',
    format: 'esm'
  },
  watch: {
    include: 'src/**'
  }
}