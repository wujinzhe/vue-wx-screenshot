const WebpackBaseConfig = require('./webpack.base')
const merge = require('webpack-merge')
const path = require('path')
const CleanWebpackPlugin = require('clean-webpack-plugin')

const webpackProdConfig = merge(WebpackBaseConfig, {
  mode: 'production',
  entry: './src/index.js',
  output: {
    library: 'vue-screenshot',
    libraryTarget: 'umd',
    path: path.resolve(__dirname, '../dist'),
    filename: 'vue-screenshot.js'
  },
  plugins: [
    new CleanWebpackPlugin({
      verbose: true,
      cleanOnceBeforeBuildPatterns: ['dist/*']
    })
  ]
})

module.exports = webpackProdConfig