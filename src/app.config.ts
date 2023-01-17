export default {
  pages: {
    globalStyle: {
      navigationBarTextStyle: 'black',
      navigationBarBackgroundColor: '#F8F8F8',
      backgroundColor: '#F8F8F8',
    },
    easycom: {
      autoscan: true,
      custom: {
        '^sys$': '@/sys.vue',
        '^u-(.*)': 'vk-uview-ui/components/u-$1/u-$1.vue',
        '^uni-(.*)': '@dcloudio/uni-ui/lib/uni-$1/uni-$1.vue',
        '^wt-(.*)': '@/components/wt-ui/wt-$1.vue',
        '^uni-section': '@/components/wt-ui/wt-section.vue',
      },
    },
  },
  uniCloud: false,
}
