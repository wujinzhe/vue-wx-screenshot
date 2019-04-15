# vue-wx-screenshot
模仿IOS微信的一个vue的截图插件，该插件只要提供一个图片地址，可以完成图片的旋转，平移，缩放（暂未实现），压缩，点击完成按钮后直接将改动后的图片以base64的形式返回，使用简单，轻量，无其他业务的绑定

<div align="center">
  <img src="./1.gif" width="200">
</div>

## 安装

执行```npm i vue-wx-screenshot -S```

## 引入
```HTML
<Crop
  :height="340"
  :width="340"
  ref="crop"
  @cancel="cancel"
  @finish="finish" />
```
```JS
import { crop } from 'vue-wx-screenshot'
export default {
  name: 'App',
  components: {
    Crop: crop
  }
}
```

## 事件
<table>
  <tr>
    <th>事件名</th>
    <th>参数名</th>
    <th>含义</th>
  </tr>
  <tr>
    <td>finish</td>
    <td>base64(String)</td>
    <td>点击完成后的完成事件，base64为事件的参数，表示截图完成后的返回图片的base64字符串</td>
  </tr>
  <tr>
    <td>cancel</td>
    <td>无</td>
    <td>点击取消的事件</td>
  </tr>
</table>

## 方法
该组件提供一个方法来打开截图组件
```JS
this.$refs.crop.open(imgUrl)
// 需要将该组件绑到父组件的ref中，将图片的url作为参数，
// 最好为本地图片转换成的base64地址，否则会出现跨域问题（canvas.toDataURL导致的）
```

## 使用案例

模板部分
```HTML
<template>
  <div>
    <h1>请上传你要裁剪的图片</h1>
    <a class="btn" @click="upload">上传</a>
    <input type="file" @change="fileChange" ref="file" style="display: none;">

    <Crop
      :height="340"
      :width="340"
      ref="crop"
      @cancel="cancel"
      @finish="finish" />

    <img v-if="base64" :src="base64" alt="">
  </div>
</template>
```

js部分
```JS
  import { crop } from 'vue-wx-screenshot'
  export default {
    name: 'App',
    components: {
      Crop: crop
    },
    data () {
      return  {
        url: '',
        base64: ''
      }
    },
    methods: {
      /** 点击开始裁剪按钮，调出裁剪器 */
      upload () {
        this.$refs.file.click()
      },
      fileChange () {
        let file = this.$refs.file.files[0]
        let reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => {
          this.$refs.file.value = ''
          this.$refs.crop.open(reader.result)
        }
      },
      /** 裁剪器取消事件 */
      cancel () {
        console.log('你取消了裁剪器')
      },
      /** 裁剪器的完成事件 返回了base64图片 */
      finish (base64) {
        this.base64 = base64
      }
    }
  }
```
