<template>
  <div>
    <el-dropdown trigger="click" @command="handleSetLang">
      <div class="size-icon--style">
        <svg-icon icon-class="language-2" class="size-icon" />
      </div>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item v-for="item of langOptions" :key="item.value" :disabled="lang === item.value"
            :command="item.value">
            {{ item.label }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup>
import useSettingsStore from '@/store/modules/settings'
import saveSettingFun from '../../layout/components/Settings/saveSetting'

const settingsStore = useSettingsStore();
const lang = computed(() => settingsStore.lang);
const { proxy } = getCurrentInstance();
const langOptions = ref([
  { label: "中文", value: "zhCn" },
  { label: "繁体中文", value: "zhTw" },
  { label: "English", value: "en" },
]);

function handleSetLang(lang) {
  proxy.$modal.loading("正在设置语言，请稍候...");
  settingsStore.lang = lang;
  proxy.$i18n.locale = lang;
  saveSettingFun(proxy.$modal, settingsStore)
  setTimeout("window.location.reload()", 1000);
}
</script>

<style lang='scss' scoped>
.size-icon--style {
  font-size: 20px;
  line-height: 50px;
  padding-right: 7px;
}
</style>