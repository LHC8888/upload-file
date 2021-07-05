- upload-sdk 放置处理文件的逻辑
- example 一个例子
- vue-upload Vue框架封装的组件


vite 中 import 语句会被当作请求进行发送，因此在项目中引入的文件需要在项目的根目录下才能被找到：
在 packages/upload-sdk 中执行 npm link
在 vue-client 中执行 npm link upload-sdk