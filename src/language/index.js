/*
 * @Author: 17630921248 1245634367@qq.com
 * @Date: 2024-06-18 14:57:57
 * @LastEditors: 17630921248 1245634367@qq.com
 * @LastEditTime: 2024-06-19 13:22:54
 * @FilePath: \RuoYi-Vue3\src\language\index.js
 * @Description: Fuck Bug
 * 微信：My-World-40
 */
// element-plus的语言包
import elementZhCn from 'element-plus/es/locale/lang/zh-cn'
import elementZhTw from 'element-plus/es/locale/lang/zh-tw'
import elementEn from 'element-plus/es/locale/lang/en'
import { createI18n } from 'vue-i18n'; // 引入vue-i18n组件
import zhCn from './lang/zhCn';
import zhTw from './lang/zhTw';
import en from './lang/en';
const vueI18n = (lang) => {
  // 注意：在创建实例时，一定要将 legacy 属性设置为 false，因为 legacy 默认为 true，它支持使用 Vue2 框架中的 Options API，如果要在 Vue3 更好的使用 Composition API 模式，那么就需要将此属性手动设置为 false。
  return createI18n({
    legacy: false,  // 设置为 false，启用 composition API 模式
    locale: lang, // 默认显示语音
    messages: {
      zhCn, // 中文
      zhTw, // 中文繁体
      en // 英文
    }
  });
}
/**
 * 框架语言
 * @param {*} lang 语言
 * @returns 
 */
const switchLanguages = (lang) => {
  switch (lang) {
    case 'zhCn':
      return elementZhCn
    case 'zhTw':
      return elementZhTw
    case 'en':
      return elementEn
    default:
      return elementEn
  }
}
export {
  vueI18n,
  switchLanguages
};