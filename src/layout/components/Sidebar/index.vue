<template>
  <div :class="{ 'has-logo': showLogo }" :style="{ backgroundColor: isThemeBackground() }">
    <logo v-if="showLogo" :collapse="isCollapse" />
    <el-scrollbar :class="sideTheme" wrap-class="scrollbar-wrapper">
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :background-color="isThemeBackground()"
        :text-color="isThemeText()"
        :unique-opened="true"
        :active-text-color="theme"
        :collapse-transition="false"
        mode="vertical"
      >
        <sidebar-item
          v-for="(route, index) in sidebarRouters"
          :key="route.path + index"
          :item="route"
          :base-path="route.path"
        />
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<script setup>
import Logo from './Logo'
import SidebarItem from './SidebarItem'
import variables from '@/assets/styles/variables.module.scss'
import useAppStore from '@/store/modules/app'
import useSettingsStore from '@/store/modules/settings'
import usePermissionStore from '@/store/modules/permission'

const route = useRoute();
const appStore = useAppStore()
const settingsStore = useSettingsStore()
const permissionStore = usePermissionStore()

const sidebarRouters =  computed(() => permissionStore.sidebarRouters);
const showLogo = computed(() => settingsStore.sidebarLogo);
const sideTheme = computed(() => settingsStore.sideTheme);
const theme = computed(() => settingsStore.theme);
const isCollapse = computed(() => !appStore.sidebar.opened);

const activeMenu = computed(() => {
  const { meta, path } = route;
  // if set path, the sidebar will highlight the path you set
  if (meta.activeMenu) {
    return meta.activeMenu;
  }
  return path;
})
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
    default:
      return variables.menuLightBackground;
  }
}
// 文字颜色
function isThemeText() {
  const value = settingsStore.sideTheme;
  switch (value) {
    case 'theme-dark':
      return variables.menuColor;
    case 'theme-light':
      return variables.menuLightColor;
    case 'theme-red':
      return variables.menuRedColor;
    default:
      return variables.menuLightColor;
  }
}
</script>
