<template>
  <div class="sidebar-logo-container" :class="{ 'collapse': collapse }"  :style="{ backgroundColor: isThemeBackground() }">
    <transition name="sidebarLogoFade">
      <router-link v-if="collapse" key="collapse" class="sidebar-logo-link" to="/">
        <img v-if="logo" :src="logo" class="sidebar-logo" />
        <h1 v-else class="sidebar-title" :style="{ color: isLogoTitleColor() }">{{ title }}</h1>
      </router-link>
      <router-link v-else key="expand" class="sidebar-logo-link" to="/">
        <img v-if="logo" :src="logo" class="sidebar-logo" />
        <h1 class="sidebar-title" :style="{ color: isLogoTitleColor() }">{{ title }}</h1>
      </router-link>
    </transition>
  </div>
</template>

<script setup>
import variables from '@/assets/styles/variables.module.scss'
import logo from '@/assets/logo/logo.png'
import useSettingsStore from '@/store/modules/settings'

defineProps({
  collapse: {
    type: Boolean,
    required: true
  }
})

const title = import.meta.env.VITE_APP_TITLE;
const settingsStore = useSettingsStore();
const sideTheme = computed(() => settingsStore.sideTheme);
// 背景颜色
function isThemeBackground() {
  const value = settingsStore.sideTheme;
  switch (value) {
    case 'theme-dark':
      return variables.menuBackground;
    case 'theme-light':
      return variables.menuLightBackground;
    case 'theme-red':
      return variables.menuRedBackground;
    case 'theme-purple':
      return variables.menuPurpleBackground;
    default:
      return variables.menuLightBackground;
  }
}
// 图标颜色
function isLogoTitleColor() {
  const value = settingsStore.sideTheme;
  switch (value) {
    case 'theme-dark':
      return variables.logoTitleColor;
    case 'theme-light':
      return variables.logoLightTitleColor;
    case 'theme-red':
      return variables.logoRedTitleColor;
    case 'theme-purple':
      return variables.logoPurpleTitleColor;
    default:
      return variables.logoLightTitleColor;
  }
}
</script>

<style lang="scss" scoped>
.sidebarLogoFade-enter-active {
  transition: opacity 1.5s;
}

.sidebarLogoFade-enter,
.sidebarLogoFade-leave-to {
  opacity: 0;
}

.sidebar-logo-container {
  position: relative;
  width: 100%;
  height: 50px;
  line-height: 50px;
  background: #2b2f3a;
  text-align: center;
  overflow: hidden;

  & .sidebar-logo-link {
    height: 100%;
    width: 100%;

    & .sidebar-logo {
      width: 32px;
      height: 32px;
      vertical-align: middle;
      margin-right: 12px;
    }

    & .sidebar-title {
      display: inline-block;
      margin: 0;
      color: #fff;
      font-weight: 600;
      line-height: 50px;
      font-size: 14px;
      font-family: Avenir, Helvetica Neue, Arial, Helvetica, sans-serif;
      vertical-align: middle;
    }
  }

  &.collapse {
    .sidebar-logo {
      margin-right: 0px;
    }
  }
}
</style>