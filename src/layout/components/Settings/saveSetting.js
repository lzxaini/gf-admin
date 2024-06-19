/*
 * @Author: 17630921248 1245634367@qq.com
 * @Date: 2024-06-18 13:57:25
 * @LastEditors: 17630921248 1245634367@qq.com
 * @LastEditTime: 2024-06-18 15:14:59
 * @FilePath: \RuoYi-Vue3\src\layout\components\Settings\saveSetting.js
 * @Description: Fuck Bug
 * 微信：My-World-40
 */
export default function saveSetting(modal, storeSettings) {
  modal.loading("正在保存到本地，请稍候...");
  let layoutSetting = {
    "topNav": storeSettings.topNav,
    "tagsView": storeSettings.tagsView,
    "fixedHeader": storeSettings.fixedHeader,
    "sidebarLogo": storeSettings.sidebarLogo,
    "dynamicTitle": storeSettings.dynamicTitle,
    "sideTheme": storeSettings.sideTheme,
    "theme": storeSettings.theme,
    "dark": storeSettings.dark,
    "lang": storeSettings.lang
  };
  localStorage.setItem("layout-setting", JSON.stringify(layoutSetting));
  setTimeout(modal.closeLoading(), 1000)
}