<script>
import { checkFileFormat } from "../checkFileFormat";

export default {
  props: {
    multiple: {
      type: Boolean,
      default: false,
    },
    suffix: {
      type: Array,
      default: [],
    },
    size: {
      type: [String, Number], // Btye
      default: Number.MAX_SAFE_INTEGER,
    },
    beforeUpload: {
      type: Function,
      default: undefined,
    },
  },
  setup(props) {
    const handleChange = (e) => {
      const files = e.target.files;
      const { beforeUpload, suffix } = props;
      let p;

      // 如果传递了 beforeUpload 就使用 beforeUpload 来进行校验
      if (beforeUpload && typeof beforeUpload === "function") {
        p = Promise.then(() => beforeUpload(files));
      } else {
        p = new Promise((res, rej) => {
          const reader = new FileReader();
          reader.onload = () => {
            const flag = checkFileFormat(reader.result, suffix);
            flag ? res() : rej();
          };
          reader.readAsArrayBuffer(files[0]);
        });
      }
    };

    return {
      handleChange,
    };
  },
};
</script>

<template>
  <input type="file" :multiple="multiple" @change="handleChange" />
</template>
