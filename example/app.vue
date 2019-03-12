<template>
  <div>
    <h1>请上传你要裁剪的图片</h1>
    <a class="btn" @click="upload">上传</a>
    <input type="file" @change="fileChange" ref="file" style="display: none;">
    <!-- <textarea name="" id="" cols="30" rows="10" v-model="url"></textarea> -->
    <Crop
      :height="340"
      :width="340"
      ref="crop"
      @cancel="cancel"
      @finish="finish" />

    <img v-if="base64" :src="base64" alt="">
  </div>
</template>

<script>
  import { crop } from '@/index.js'
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
</script>

<style>
  * {
    margin: 0;
    padding: 0;
  }

  html, body {
    height: 100%;
  }

  
</style>

<style scoped>
  h1 {
    text-align: center;
    font-size: 18px;
    padding: 10px 0;
  }

  textarea {
    border: 1px solid #cccccc;
    width: 80%;
    margin: auto;
    display: block;
    -webkit-appearance: none;
    border-radius: 0;
    padding: 10px;
    box-sizing: border-box;
    font-size: 13px;
  }

  .btn {
    padding: 6px 30px;
    color: #ffffff;
    background-color: #ff9800;
    font-size: 14px;
    margin: 20px auto;
    display: block;
    text-align: center;
    width: 100px;
  }
  
  img {
    width: 50%;
    display: block;
    margin: 40px auto;
  }
</style>


