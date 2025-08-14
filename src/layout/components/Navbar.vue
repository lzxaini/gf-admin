<template>
  <div class="navbar">
    <hamburger id="hamburger-container" :is-active="appStore.sidebar.opened" class="hamburger-container"
      @toggleClick="toggleSideBar" />
    <breadcrumb id="breadcrumb-container" class="breadcrumb-container" v-if="!settingsStore.topNav" />
    <top-nav id="topmenu-container" class="topmenu-container" v-if="settingsStore.topNav" />

    <div class="right-menu">
      <template v-if="appStore.device !== 'mobile'">
        <header-search id="header-search" class="right-menu-item" />

        <el-tooltip :content="$t(`navbar.darkMode`)" effect="dark" placement="bottom">
          <!-- <ruo-yi-git id="ruoyi-git" class="right-menu-item hover-effect" /> -->
          <!-- <el-switch v-model="isDark" inline-prompt active-text="dark" size="large" inactive-text="light"
            @change="toggleDark" /> -->
          <div class="switchNight">
            <!-- <el-switch @change="changeTheme(darkVal)" v-model="darkVal" active-color="#16bbffbf" inactive-color="#595454">
          </el-switch> -->
            <div @click="changeTheme(!darkVal)" style="display: flex;justify-content: center;">
              <svg v-if="!darkVal" t="1704270097678" class="sun_icon" viewBox="0 0 1024 1024" version="1.1"
                xmlns="http://www.w3.org/2000/svg" p-id="8865" width="20" height="20">
                <path
                  d="M512 874.666667a32 32 0 0 1 32 32v64a32 32 0 0 1-64 0v-64A32 32 0 0 1 512 874.666667z m-256.426667-106.24a32 32 0 0 1 0 45.269333l-45.269333 45.248a32 32 0 0 1-45.248-45.226667l45.226667-45.269333a32 32 0 0 1 45.269333 0z m558.122667 0l45.248 45.269333a32 32 0 0 1-45.226667 45.248l-45.269333-45.226667a32 32 0 1 1 45.248-45.269333zM512 213.333333c164.949333 0 298.666667 133.717333 298.666667 298.666667s-133.717333 298.666667-298.666667 298.666667-298.666667-133.717333-298.666667-298.666667 133.717333-298.666667 298.666667-298.666667zM117.333333 480a32 32 0 0 1 0 64h-64a32 32 0 0 1 0-64h64z m853.333334 0a32 32 0 0 1 0 64h-64a32 32 0 0 1 0-64h64zM210.304 165.056l45.248 45.226667a32 32 0 1 1-45.248 45.269333L165.056 210.304a32 32 0 0 1 45.226667-45.248z m648.64 0a32 32 0 0 1 0 45.226667l-45.226667 45.269333a32 32 0 1 1-45.269333-45.248l45.248-45.248a32 32 0 0 1 45.248 0zM512 21.333333a32 32 0 0 1 32 32v64a32 32 0 0 1-64 0v-64A32 32 0 0 1 512 21.333333z"
                  fill="#ff9900" p-id="8866"></path>
              </svg>
              <svg v-else t="1704270196388" class="night_icon" viewBox="0 0 1024 1024" version="1.1"
                xmlns="http://www.w3.org/2000/svg" p-id="11733" width="20" height="20">
                <path
                  d="M463.90303 938.666667c-114.812121 0-221.866667-44.993939-302.545454-127.224243l-27.927273-27.927272 38.787879-10.860607c164.460606-44.993939 279.272727-195.490909 279.272727-366.157575 0-100.848485-38.787879-195.490909-108.606061-266.860606l-27.927272-27.927273 38.787879-10.860606c37.236364-9.309091 74.472727-15.515152 111.70909-15.515152 234.278788 0 426.666667 190.836364 426.666667 426.666667S699.733333 938.666667 463.90303 938.666667z"
                  fill="#2c2c2c" p-id="11734"></path>
              </svg>
            </div>
          </div>
        </el-tooltip>

        <!-- <el-tooltip content="文档地址" effect="dark" placement="bottom">
          <ruo-yi-doc id="ruoyi-doc" class="right-menu-item hover-effect" />
        </el-tooltip> -->

        <screenfull id="screenfull" class="right-menu-item hover-effect" />

        <el-tooltip :content="$t(`navbar.layoutSize`)" effect="dark" placement="bottom">
          <size-select id="size-select" class="right-menu-item hover-effect" />
        </el-tooltip>
        <!-- <el-tooltip :content="$t(`navbar.language`)" effect="dark" placement="bottom">
          <lang-select id="lang-select" class="right-menu-item hover-effect" />
        </el-tooltip> -->
      </template>
      <div class="avatar-container">
        <el-dropdown @command="handleCommand" class="right-menu-item hover-effect" trigger="click">
          <div class="avatar-wrapper">
            <img :src="userStore.avatar" class="user-avatar" />
            <el-icon><caret-bottom /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <router-link to="/user/profile">
                <el-dropdown-item>个人中心</el-dropdown-item>
              </router-link>
              <el-dropdown-item command="setLayout" v-if="settingsStore.showSettings">
                <span>布局设置</span>
              </el-dropdown-item>
              <el-dropdown-item divided command="logout">
                <span>退出登录</span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useDark, useToggle } from '@vueuse/core'
import { ElMessageBox } from 'element-plus'
import Breadcrumb from '@/components/Breadcrumb'
import TopNav from '@/components/TopNav'
import Hamburger from '@/components/Hamburger'
import Screenfull from '@/components/Screenfull'
import SizeSelect from '@/components/SizeSelect'
import LangSelect from '@/components/LangSelect'
import HeaderSearch from '@/components/HeaderSearch'
import RuoYiGit from '@/components/RuoYi/Git'
import RuoYiDoc from '@/components/RuoYi/Doc'
import useAppStore from '@/store/modules/app'
import useUserStore from '@/store/modules/user'
import useSettingsStore from '@/store/modules/settings'
import saveSettingFun from './Settings/saveSetting'
import { ref } from 'vue'
import { disable, enable, auto } from "darkreader"; // 插件暗夜模式

const { proxy } = getCurrentInstance();
const appStore = useAppStore()
const userStore = useUserStore()
const settingsStore = useSettingsStore()
const darkVal = ref(settingsStore.dark)
const isDark = useDark()
const toggleDark = useToggle(isDark) // 暗夜模式
function toggleSideBar() {
  appStore.toggleSideBar()
}

function handleCommand(command) {
  switch (command) {
    case "setLayout":
      setLayout();
      break;
    case "logout":
      logout();
      break;
    default:
      break;
  }
}

function logout() {
  ElMessageBox.confirm('确定注销并退出系统吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    userStore.logOut().then(() => {
      location.href = '/index';
    })
  }).catch(() => { });
}

const emits = defineEmits(['setLayout'])
function setLayout() {
  emits('setLayout');
}

// 深色模式
function changeTheme(val) {
  darkVal.value = val
  settingsStore.dark = val
  // 调用暗夜模式
  if (val) {
    enable({
      brightness: 100,
      contrast: 90,
      sepia: 10
    });
  } else disable();
  saveSettingFun(proxy.$modal, settingsStore)
}
</script>

<style lang='scss' scoped>
.navbar {
  height: 50px;
  overflow: hidden;
  position: relative;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);

  .hamburger-container {
    line-height: 46px;
    height: 100%;
    float: left;
    cursor: pointer;
    transition: background 0.3s;
    -webkit-tap-highlight-color: transparent;

    &:hover {
      background: rgba(0, 0, 0, 0.025);
    }
  }

  .breadcrumb-container {
    float: left;
  }

  .topmenu-container {
    position: absolute;
    left: 50px;
  }

  .errLog-container {
    display: inline-block;
    vertical-align: top;
  }

  .right-menu {
    float: right;
    height: 100%;
    line-height: 50px;
    display: flex;

    .switchNight {
      display: flex;
      align-items: center;
      float: left;
      padding: 0 8px;
      height: 100%;

      .sun_icon {
        animation: sun_icon_is_show 0.8s ease;
      }

      .night_icon {
        animation: night_icon_is_show 0.8s ease;
      }

      @keyframes sun_icon_is_show {
        0% {
          width: 1px;
          height: 1px;
        }

        100% {
          width: 20px;
          height: 20px;
        }
      }

      @keyframes night_icon_is_show {
        0% {
          width: 1px;
          height: 1px;
        }

        100% {
          width: 20px;
          height: 20px;
        }
      }
    }

    &:focus {
      outline: none;
    }

    .right-menu-item {
      display: inline-block;
      padding: 0 8px;
      height: 100%;
      font-size: 18px;
      color: #5a5e66;
      vertical-align: text-bottom;

      &.hover-effect {
        cursor: pointer;
        transition: background 0.3s;

        &:hover {
          background: rgba(0, 0, 0, 0.025);
        }
      }
    }

    .avatar-container {
      margin-right: 40px;

      .avatar-wrapper {
        margin-top: 5px;
        position: relative;

        .user-avatar {
          cursor: pointer;
          width: 40px;
          height: 40px;
          border-radius: 10px;
        }

        i {
          cursor: pointer;
          position: absolute;
          right: -20px;
          top: 25px;
          font-size: 12px;
        }
      }
    }
  }
}
</style>
