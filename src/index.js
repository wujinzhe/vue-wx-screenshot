import crop from './crop'

export default function install (Vue, options) {
  Vue.component('crop', crop)
}

export { crop }