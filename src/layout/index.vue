<template>
  <el-watermark :font="state.font" :content="state.watermarkContetent">
    <div :class="classObj" class="app-wrapper" :style="{ '--current-color': theme }">
      <div v-if="device === 'mobile' && sidebar.opened" class="drawer-bg" @click="handleClickOutside" />
      <sidebar v-if="!sidebar.hide" class="sidebar-container" />
      <div :class="{ hasTagsView: needTagsView, sidebarHide: sidebar.hide }" class="main-container">
        <div :class="{ 'fixed-header': fixedHeader }">
          <navbar @setLayout="setLayout" />
          <tags-view v-if="needTagsView" />
        </div>
        <app-main />
        <settings ref="settingRef" />
      </div>
    </div>
  </el-watermark>
</template>

<script setup>
// import { useMQTTStore } from '@/store/modules/useMQTTStore'
// const mqttStore = useMQTTStore()
// mqttStore.connect();
// import { useSocketStore } from '@/store/modules/useSocketStore'
// const socketStore = useSocketStore()
// socketStore.initWebSocket();
import { useWindowSize } from '@vueuse/core'
import Sidebar from './components/Sidebar/index.vue'
import { AppMain, Navbar, Settings, TagsView } from './components'
import defaultSettings from '@/settings'
import { getNowTimes } from '@/utils/tools'
import { getUserName } from '@/utils/auth'
import useAppStore from '@/store/modules/app'
import useSettingsStore from '@/store/modules/settings'

const { proxy } = getCurrentInstance();

const settingsStore = useSettingsStore()
const theme = computed(() => settingsStore.theme);
const sideTheme = computed(() => settingsStore.sideTheme);
const sidebar = computed(() => useAppStore().sidebar);
const device = computed(() => useAppStore().device);
const needTagsView = computed(() => settingsStore.tagsView);
const fixedHeader = computed(() => settingsStore.fixedHeader);
const isDark = computed(() => settingsStore.dark)

const classObj = computed(() => ({
  hideSidebar: !sidebar.value.opened,
  openSidebar: sidebar.value.opened,
  withoutAnimation: sidebar.value.withoutAnimation,
  mobile: device.value === 'mobile'
}))

const { width, height } = useWindowSize();
const WIDTH = 992; // refer to Bootstrap's responsive design
const state = reactive({
  font: {
    color: 'rgba(0, 0, 0, .15)'
  },
  timer: null,
  watermarkContetent: []
})

const watermarkSwitch = () => {
  if (import.meta.env.VITE_APP_SYSTEM_WATERMARK === 'true') {
    console.log('proxy?.$auth.getUserInfo()', proxy?.$auth.getUserInfo())
    state.watermarkContetent = ['玑肤芮-JFR', proxy?.$auth.getUserInfo().userName, getNowTimes()];
    state.timer = setInterval(() => {
      // 实时时间获取
      state.watermarkContetent[2] = getNowTimes();
    }, 1000);
    watch(
      isDark,
      (newVal) => {
        // 监听是否深色模式，并且更换水印颜色
        newVal ? (state.font.color = 'rgba(255, 255, 255, .15)') : (state.font.color = 'rgba(0, 0, 0, .15)');
      },
      {
        immediate: true
      }
    );
  } else {
    state.watermarkContetent = [];
  }
};

watchEffect(() => {
  if (device.value === 'mobile' && sidebar.value.opened) {
    useAppStore().closeSideBar({ withoutAnimation: false })
  }
  if (width.value - 1 < WIDTH) {
    useAppStore().toggleDevice('mobile')
    useAppStore().closeSideBar({ withoutAnimation: true })
  } else {
    useAppStore().toggleDevice('desktop')
  }
})

watermarkSwitch();
function handleClickOutside() {
  useAppStore().closeSideBar({ withoutAnimation: false })
}

const settingRef = ref(null);
function setLayout() {
  settingRef.value.openSetting();
}
</script>

<style lang="scss" scoped>
@import "@/assets/styles/mixin.scss";
@import "@/assets/styles/variables.module.scss";

.app-wrapper {
  @include clearfix;
  position: relative;
  height: 100%;
  width: 100%;

  &.mobile.openSidebar {
    position: fixed;
    top: 0;
  }
}

.drawer-bg {
  background: #000;
  opacity: 0.3;
  width: 100%;
  top: 0;
  height: 100%;
  position: absolute;
  z-index: 999;
}

.fixed-header {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 9;
  width: calc(100% - #{$base-sidebar-width});
  transition: width 0.28s;
}

.hideSidebar .fixed-header {
  width: calc(100% - 54px);
}

.sidebarHide .fixed-header {
  width: 100%;
}

.mobile .fixed-header {
  width: 100%;
}
</style>