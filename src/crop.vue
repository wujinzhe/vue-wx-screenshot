<template>
  <div class="crop" v-show="isOpen" ref="crop">
    <div class="crop__content" id="crop__content">
      <canvas
        id="canvas"
        :class="{during: isDuring}"
        v-if="canvasWidth"
        :width="canvasWidth"
        :height="canvasHeight"
        :style="canvasStyle">
      </canvas>
      <div class="crop__screenshot">
        <div class="screenshot--top" />
        <div class="screenshot--center"
          :style="{height: height + 'px'}">
          <div class="screenshot--center--left" />
          <div class="screenshot--center--center"
            id="screenshot"
            :style="{width: width + 'px'}">
              <span class="angle--top--left"></span>
              <span class="angle--bottom--left"></span>
              <span class="angle--top--right"></span>
              <span class="angle--bottom--right"></span>
              <svg :width="width" :height="height">
                <!-- 竖线 -->
                <!-- <line :x1="0" y1="0" :x2="0" :y2="height" class="border"/> -->
                <line :x1="width / 3" y1="0" :x2="width / 3" :y2="height - 0.5"/>
                <line :x1="width / 3 * 2" y1="0" :x2="width / 3 * 2" :y2="height - 0.5"/>
                <!-- <line :x1="width" y1="0" :x2="width" :y2="height" class="border"/> -->

                <!-- 横线 -->
                <!-- <line :x1="0" :y1="0" :x2="width" :y2="0" class="border"/> -->
                <line :x1="0" :y1="height / 3" :x2="width - 0.5" :y2="height / 3"/>
                <line :x1="0" :y1="height / 3 * 2" :x2="width - 0.5" :y2="height / 3 * 2"/>
                <!-- <line :x1="0" :y1="height" :x2="width" :y2="height" class="border"/> -->

              </svg>
          </div>
          <div class="screenshot--center--right" />
        </div>
        <div class="screenshot--bottom" />
      </div>
      <div class="crop__content__rotate" @click="rotate">
        <img src="./rotate.png">
      </div>
      <p style="color: white;position: fixed; top:0;left: 0;z-index: 1000;">{{ T }}</p>
    </div>
    <div class="crop__footer">
      <a @click="cancel">取消</a>
      <a @click="reset">还原</a>
      <a @click="finish">完成</a>
    </div>
  </div>
</template>

<script>
  import Hammer from 'hammerjs'
  import algebra from 'algebra.js'

  const Fraction = algebra.Fraction
  const Expression = algebra.Expression
  const Equation = algebra.Equation

  function calcEquation (point1, point2, point3, point4) {
    let x, y, k1, k2, cp1, cp2

    // 求出第一条直线的斜率
    k1 = (point1.y - point2.y) / (point1.x - point2.x)
    k2 = (point3.y - point4.y) / (point3.x - point4.x)

    // 求直线1的中点
    cp1 = {
      y: (point1.y + point2.y) / 2,
      x: (point1.x + point2.x) / 2
    }

    // 求直线2的中点
    cp2 = {
      y: (point4.y + point3.y) / 2,
      x: (point4.x + point3.x) / 2
    }

    // 两条直线方程
    let equation1 = algebra.parse(`${k1}x - ${k1} * ${cp1.x} + ${cp1.y}`)
    let equation2 = algebra.parse(`${k2}x - ${k2} * ${cp2.x} + ${cp2.y}`)

    let eq = new Equation(equation1, equation2)

    x = eq.solveFor('x')
    y = k1 * x - k1 * cp1.x + cp1.y

    return { x, y }
  }

  export default {
    name: 'Crop',
    data () {
      return {
        image: null, // 需要裁剪的图
        canvasContext: null, // canvas绘画上下文
        canvasWidth: 0,      // canvas的宽度
        canvasHeight: 0,     // canvas的高度
        canvasCssWidth: 0,   // canvas的CSS的宽度
        canvasCssHeight: 0,   // canvas的CSS的高度
        hammer: null, // 手势操作
        text: null,
        canvasOriginX: 0,  // 原始的坐标
        canvasOriginY: 0,  // 原始的坐标
        // transformOriginX: 0,  // canvas的旋转中心X坐标
        // transformOriginY: 0,  // canvas的旋转中心Y坐标
        X: 0, // canvas移动后的X坐标
        Y: 0,  // canvas移动后的Y坐标
        canvasScale: 1, // canvas的放大倍数
        canvasRotate: 0, // canvas的旋转角度
        screenshotX: 0,  // 截图框的左上角的X坐标
        screenshotY: 0,  // 截图框的左上角的Y坐标
        isDuring: false,  // 图片是否是在回弹时间
        newCanvasWidth: 0, // 截图的存放的canvas的宽度
        newCanvasHeight: 0, // 截图的存放的canvas的高度
        type: 'none', // 操作类型  none 无  pan 手指移动  pinch 放大缩小
        isOpen: false,  // 是否显示截图界面
        transformOrigin: {
          X: 0,
          Y: 0
        },
        minX: 0,  // 图片的范围限制
        maxX: 0,
        minY: 0,
        maxY: 0
        
      }
    },
    props: {
      // 截图框的宽度
      width: {
        type: Number,
        default: 100
      },
      // 截图框的高度
      height: {
        type: Number,
        default: 100
      }
    },
    computed: {
      /** canvas的css宽高 */
      canvasStyle () {
        return {
          marginTop: this.screenshotY + 'px',
          marginLeft: this.screenshotX + 'px',
          height: this.canvasCssHeight + 'px',
          width: this.canvasCssWidth + 'px',
          transform: `translate3d(${this.X}px, ${this.Y}px, 0)
          scale(${this.canvasScale})
          rotate(${this.canvasRotate}deg)`,
          transformOrigin: `${this.transformOrigin.X}px ${this.transformOrigin.Y}px`
        }
      },
      T () {
        // return JSON.stringify(this.text)
        return this.type
      },
      // vertical 竖图   horizontal  横图
      direction () {
        if (this.canvasCssWidth > this.canvasCssHeight) {
          return 'horizontal'
        }
        return 'vertical'
      },
      longWidth () {
        if (this.canvasCssWidth > this.canvasCssHeight) {
          return this.canvasCssWidth
      }
        return this.canvasCssHeight
      }
      // canvasTopRight () {
      //   return {
      //     X: this.X + this.canvasCssWidth,
      //     Y: this.Y
      //   }
      // },
      // canvasBottomRight () {
      //   return {
      //     X: this.X + this.canvasCssWidth,
      //     Y: this.Y + this.canvasCssHeight
      //   }
      // },
      // canvasBottomLeft () {
      //   return {
      //     X: this.X,
      //     Y: this.Y + this.canvasCssHeight
      //   }
      // },
      // screenshotTopRight () {
      //   return {
      //     X: this.screenshotX + this.width,
      //     Y: this.screenshotY
      //   }
      // },
      // screenshotBottomRight () {
      //   return {
      //     X: this.screenshotX + this.width,
      //     Y: this.screenshotY + this.height
      //   }
      // },
      // screenshotBottomLeft () {
      //   return {
      //     X: this.screenshotX,
      //     Y: this.screenshotY + this.height
      //   }
      // }
    },
    // watch: {
    //   /** 旋转触发事件 */
    //   canvasRotate (val) {
    //     console.log()
    //   }
    // },
    mounted () {
      this.$refs.crop.style.height = document.getElementsByTagName('html')[0].clientHeight + 'px'
    },
    methods: {
      /** 初始化手势库 */
      initHammer () {
        this.hammer = new Hammer(document.querySelector('#crop__content'))
        // 启用缩放和旋转
        this.hammer.get('pinch').set({ enable: true })
        this.hammer.get('pan').set({ direction: Hammer.DIRECTION_ALL }) // 开启全部方向 默认只有水平方向

        let startX = 0
        let startY = 0
        let scale = this.canvasScale
        let rotate = this.canvasRotate

        // 图片移动
        this.hammer.on('panstart', e => {
          // if (this.type !== 'none') return

          this.type = 'pan'

          startX = this.X
          startY = this.Y
        })

        this.hammer.on('panmove', e => {
          // if (this.type !== 'pan') return

          // console.log('this.X', startX + e.deltaX, 'this.Y', startY + e.deltaY)
          this.X = startX + e.deltaX
          this.Y = startY + e.deltaY
          switch (this.canvasRotate) {
            case 0: 
              this.X = startX + e.deltaX
              this.Y = startY + e.deltaY
              break
            case 90: 
              this.Y = startY + e.deltaY
              this.X = (startX + e.deltaX)
          }
        })

        this.hammer.on('panend', e => {
          // if (this.type !== 'pan') return

          this.limitCoordinate()
          this.type = 'panend'
        })

        // 图片放大缩小
        this.hammer.on('pinchstart', e => {
          // if (this.type !== 'none') return

          scale = this.canvasScale
          this.type = 'pinch'
        })

        this.hammer.on('pinchmove', e => {
          if (this.type !== 'pinch') return

          this.canvasScale = e.scale * scale
        })

        this.hammer.on('pinchend', e => {
          if (this.type !== 'pinch') return

          if (this.canvasScale > 3) this.canvasScale = 3

          if (this.canvasScale < 1) this.canvasScale = 1

          this.addAnimate()

          this.type = 'none'
        })
      },
      /** 初始化canvas（大小，位置）
       * 目前截图出来的形状是正方形，所以只需要判断图片的宽高，用最小的边长 x 比例  求出较长的那个边长
       * 如果截图的框是长方形的话，还先需要判断长方形的长和宽的长短
       */
      initCanvas (originWidth, originHeight) {
        // 需要保证高度先铺满截图框
        // 图片的宽度大于高度的情况
        if (originWidth > originHeight) {
          this.canvasCssHeight = this.height
          this.canvasCssWidth = this.height * originWidth / originHeight

        } else {
          // 图片的高度大于宽度的情况 
          this.canvasCssWidth = this.width
          this.canvasCssHeight = this.width * originHeight / originWidth
        }

        // canvas的实际像素的宽高
        this.canvasWidth = originWidth
        this.canvasHeight = originHeight

        // 截图框的坐标
        this.screenshotY = document.querySelector('#screenshot').offsetTop
        this.screenshotX = document.querySelector('#screenshot').offsetLeft

        this.minX = this.width - this.canvasCssWidth
        this.maxX = 0
        this.minY = this.width - this.canvasCssHeight
        this.maxY = 0

        // 初始的旋转角度
        this.transformOrigin.X = this.width / 2
        this.transformOrigin.Y = this.height / 2
      },
      /** 限制坐标的范围，使图片始终保持在截图框内 */
      limitCoordinate () {
        // 让图片保持在可控范围内
        if (this.Y > this.maxY) this.Y = this.maxY
        if (this.Y < this.minY) this.Y = this.minY
        if (this.X > this.maxX) this.X = this.maxX
        if (this.X < this.minX) this.X = this.minX

        this.addAnimate()
      },
      /* 给动作添加延时 添加动画*/
      addAnimate () {
        this.isDuring = true
        setTimeout(() => {
          this.isDuring = false
        }, 400)
      },
      /** 还原 */
      reset () {
        this.X = 0
        this.Y = 0
        this.canvasScale = 1
        this.canvasRotate = 0
      },
      /** 设置旋转中心 */
      setRotateCenter () {
        switch(this.canvasRotate) {
          case 0:
            break
          case 90:
            break
          case 180:
            break
          case 270:
            break 
        }
        if (this.X === 0) {
          this.minX = this.maxX = 0
          this.maxY = 0
          this.minY = this.width - this.longWidth

          // if (this.canvasRotate % 180 === 0 && this.canvasRotate % 360 !== 0) {
          //   this.minX = 0
          //   this.maxX = this.longWidth - this.width
          // }

          if (this.canvasRotate % 270 === 0) {
            this.minY = 0
            this.maxY = this.longWidth - this.width
        }
            } else {
          this.minY = this.maxY = 0
          this.maxX = 0
          this.minX = this.width - this.longWidth

          if (this.canvasRotate && this.canvasRotate % 180 === 0) {
            this.minX = 0
            this.maxX = this.longWidth - this.width
            }
        }
      },
      /** 图片旋转 */
      rotate () {
        // 旋转的时候需要确认旋转角度，旋转中心，图片可以拖动的限制范围 maxX minX maxY minY
        this.canvasRotate = (this.canvasRotate + 90) % 360

        // this.setRotateCenter() // 重新设置旋转中心
        let t = this.X
        this.X = this.Y
        this.Y = t

        if (this.direction === 'vertical') { // 竖图
          if (this.canvasRotate % 90 === 0) this.X = -this.X
        } else {
          if (this.canvasRotate % 180 === 0) this.X = -this.X
        }



        this.setLimit()        // 重新设置图片拖拽的范围
        this.canvasOriginX = this.X  // 原始的坐标
        this.canvasOriginY = this.Y  // 原始的坐标

        // this.addAnimate()
      },
      /** 画图 */
      drawImage (picPath) {
        let image = new Image()
        image.crossOrigin = 'Anonymous'
        image.src = picPath

        image.onload = () => {

          this.initCanvas(image.width, image.height) // 计算canvas的高宽属性

          // 再下一次UI渲染后，进行画图
          this.$nextTick(() => {
            this.canvasContext = document.querySelector('#canvas').getContext('2d')
            this.image = image
            // 判断是否可以显示图片
            try {
              this.canvasContext.drawImage(image, 0, 0)
            } catch (e) {
              alert(e)
            }
          })
        }
      },
      /** 根据原图生成新的canvas */
      createNewCanvas () {
        let newCanvas = document.createElement('canvas')

        // 将截图后的canvas的高宽设置为小的边长
        this.newCanvasHeight = this.canvasHeight > this.canvasWidth ? this.canvasWidth : this.canvasHeight
        this.newCanvasWidth = this.newCanvasHeight

        newCanvas.setAttribute('width', this.newCanvasWidth)
        newCanvas.setAttribute('height', this.newCanvasHeight)
        newCanvas.setAttribute('id', 'newCanvas')
        newCanvas.style.height = this.height + 'px'
        newCanvas.style.width = this.width + 'px'
        
        return newCanvas
      },
      /** 完成截图 */
      finish () {
        let baseSrc = '',
            newCanvas = this.createNewCanvas(),
            newCanvasCtx = newCanvas.getContext('2d'),      // 存放截图的canvas的上下文
            imageData = null // 截图的imageData

        try {
          // alert(document.querySelector('#canvas').toDataURL('image/jpeg', 0.5))
          // 提取出截图的数据  如果是图片的像素有大于canvas的css宽高的，需要乘以 this.canvasWidth / this.canvasCssWidth 这个比例
          imageData = this.canvasContext.getImageData(
            Math.abs(this.X) * this.canvasWidth / this.canvasCssWidth,
            Math.abs(this.Y) * this.canvasHeight / this.canvasCssHeight,
            (Math.abs(this.X) + this.width) * this.canvasWidth / this.canvasCssWidth,
            (Math.abs(this.Y) + this.height) * this.canvasHeight / this.canvasCssHeight,
          )
  
          // 将提取出的数据放到新的canvas中
          // newCanvasCtx.rotate(20 * Math.PI / 180)
          newCanvasCtx.putImageData(imageData, 0, 0)
          // this.canvasContext.drawImage(this.image, 0, 0)
          baseSrc = newCanvas.toDataURL('image/jpeg')
          let image = new Image()
          image.src = baseSrc
          image.onload = () => {
            newCanvasCtx.rotate(this.canvasRotate * Math.PI / 180)

            switch (this.canvasRotate) {
              case 0:
                newCanvasCtx.drawImage(image, 0, 0)
                break
              case 90:
                newCanvasCtx.drawImage(image, 0, -image.width)
                break 
              case 180:
                newCanvasCtx.drawImage(image, -image.width, -image.width)
                break
              case 360:
                newCanvasCtx.drawImage(image, -image.width, 0)
                break
              default: break
            }
            
            baseSrc = newCanvas.toDataURL('image/jpeg', 0.5)
            this.close()
            this.$emit('finish', baseSrc)
          }
          
        } catch (e) {
          console.log('截图错误', e)
          alert(e)
          baseSrc = ''
        }
      },
      /** 手动调用 打开裁剪器 */
      open (url) {
        this.isOpen = true
        this.drawImage(url)
        this.initHammer()
      },
      /** 关闭裁剪器 */
      close () {
        this.isOpen = false
        this.reset()
        this.canvasWidth = 0 // 让canvas销毁掉
      },
      /** 取消事件 */
      cancel () {
        this.close()
        this.$emit('cancel')
      }
    }
  }
</script>

<style scoped>
  .during {
    transition: all 0.4s ease 0s;
  }

  .crop {
    background-color: #000000;
    height: 100vh;
    width: 100vw;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 9999;
  }

  .crop__content {
    height: calc(100% - 60px);
    position: relative;
    overflow: hidden;
  }

  canvas {
    /* transform-origin: 150px 150px; */
  }

  /* 截图框的样式 */
  .crop__screenshot {
    width: 100%;
    height: 100%;
    position: absolute;
    left: 0;
    top: 0;
    display: flex;
    justify-content: space-around;
    flex-direction: column;
  }

  .crop__screenshot > div {
    width: 100%;
    flex-grow: 1;
    background-color: rgba(0, 0, 0, 0.85);
  }

  /* 中间部分需要做特殊处理 */
  div.screenshot--center {
    flex-shrink: 0;
    flex-grow: 0;
    display: flex;
    background-color: transparent;
  }

  div.screenshot--center > div {
    height: 100%;
    justify-content: space-around;
    flex-grow: 1;
    background-color: rgba(0, 0, 0, 0.85);
  }

  /* 中间部分需要做特殊处理 */
  /* 截图框 */
  div.screenshot--center > div.screenshot--center--center {
    flex-grow: 0;
    border: 1px solid #ffffff;
    box-sizing: border-box;
    background-color: transparent;
    box-shadow: inset 0 0 5px 0 rgba(0, 0, 0, 0.5);
    position: relative;
  }

  .screenshot--center--center  span {
    height: 20px;
    width: 20px;
    position: absolute;
  }

  .angle--top--left {
    border-top: 3px solid #ffffff;
    border-left: 3px solid #ffffff;
    top: -3px;
    left: -3px;
  }

  .angle--bottom--left {
    border-bottom: 3px solid #ffffff;
    border-left: 3px solid #ffffff;
    left: -3px;
    bottom: -3px;
  }

  .angle--top--right {
    border-top: 3px solid #ffffff;
    border-right: 3px solid #ffffff;
    top: -3px;
    right: -3px;
  }

  .angle--bottom--right {
    position: absolute;
    border-bottom: 3px solid #ffffff;
    border-right: 3px solid #ffffff;
    bottom: -3px;
    right: -3px;
  }

  /* 截图框里面的横线 使用了svg进行绘制 */
  svg {
    position: relative;
    top: -1px;
    left: -1px;
  }
  line {
    stroke: #ffffff;
    stroke-width: 1px;
  }

  line.border {
    stroke-width: 2px;
  }

  .screenshot {
    width: 80%;
    height: 80vw;
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    margin: auto;
    background-color: transparent;
  }

  /* .screenshot__border {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: inherit;
  } */

  .crop__content__rotate {
    position: absolute;
    bottom: 10px;
    left: 10px;
    padding: 10px;
    width: 20px;
  }

  .crop__content__rotate img {
    width: 100%;
  }

  .crop__footer {
    padding: 0 20px;
    font-size: 15px;
    display: flex;
    justify-content: space-between;
    height: 60px;
    align-items: center;
    box-sizing: border-box;
    border-top: 1px solid rgba(255, 255, 255, 0.276);
  }

  .crop__footer a {
    color: #ffffff;
    text-decoration: none;
  }
</style>
<style>
  canvas#newCanvas {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    margin: auto;
  }
</style>
