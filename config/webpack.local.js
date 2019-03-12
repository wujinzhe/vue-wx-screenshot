const WebpackBaseConfig = require('./webpack.base')
const merge = require('webpack-merge')
const path = require('path')
const portfinder = require('portfinder')
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin')
// const ip = require('ip').address()

const WebpackLocalConfig = merge(WebpackBaseConfig, {
  mode: 'development',
  entry: './example/index.js',
  output: {
    path: path.resolve(__dirname, '../dist')
  },
  devServer: {
    host: '0.0.0.0',
    port: 8080,
    quiet: true,
    hot: true,
    clientLogLevel: 'warning',
    useLocalIp: true, // 使用本地IP
    // open: true, // 默认打开浏览器
  }
})

portfinder.basePort = WebpackLocalConfig.devServer.port // 给portfinder设置默认端口

// 如果devServer 开启的端口已经被占用，需要重新开启新的端口
module.exports = portfinder.getPortPromise().then(port => {
  WebpackLocalConfig.devServer.port = port
  WebpackLocalConfig.plugins.push(new FriendlyErrorsWebpackPlugin({
    messages: [`程序已经启动：http://localhost:${port}`],
    clearConsole: true
  }))
  return WebpackLocalConfig
}).catch(err => {
  throw new Error('无法获取自由端口，请手动关闭一些无效端口')
})
