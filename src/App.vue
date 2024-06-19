<template>
  <el-config-provider :locale="locale">
    <router-view />
  </el-config-provider>
</template>

<script setup>
import useSettingsStore from '@/store/modules/settings'
import { switchLanguages } from './language/index'
import { handleThemeStyle } from '@/utils/theme'
import { ElConfigProvider } from 'element-plus'
const locale = switchLanguages(useSettingsStore().lang) // 获取对应的语言
onMounted(() => {
  nextTick(() => {
    // 初始化主题样式
    handleThemeStyle(useSettingsStore().theme)
  })
})
</script>
