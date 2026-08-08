<template>
  <div class="login">
    <!-- 动态光晕背景元素 -->
    <div class="bg-orb bg-orb--1"></div>
    <div class="bg-orb bg-orb--2"></div>
    <div class="bg-orb bg-orb--3"></div>

    <el-form ref="loginRef" :model="loginForm" :rules="loginRules" class="login-form">
      <!-- 品牌区域 -->
      <div class="brand-header">
        <div class="logo-icon">
          <!-- <svg-icon icon-class="jfr-logo" class="logo-svg" /> -->
           <img class="logo-svg" src="../assets/logo/logo-2.png" alt="">
        </div>
        <h3 class="title">玑肤芮 · 运营管理系统</h3>
        <p class="sub-title">JIFURUI OPERATION MANAGEMENT</p>
      </div>

      <!-- 账号 -->
      <el-form-item prop="username">
        <el-input v-model="loginForm.username" type="text" size="large" auto-complete="off" placeholder="请输入账号"
          class="enhanced-input">
          <template #prefix>
            <svg-icon icon-class="user" class="el-input__icon input-icon" />
          </template>
        </el-input>
      </el-form-item>

      <!-- 密码 -->
      <el-form-item prop="password">
        <el-input v-model="loginForm.password" type="password" size="large" auto-complete="off" placeholder="请输入密码"
          class="enhanced-input" @keyup.enter="handleLogin">
          <template #prefix>
            <svg-icon icon-class="password" class="el-input__icon input-icon" />
          </template>
        </el-input>
      </el-form-item>

      <!-- 验证码 -->
      <el-form-item prop="code" v-if="captchaEnabled" class="captcha-item">
        <el-input v-model="loginForm.code" size="large" auto-complete="off" placeholder="验证码" style="width: 63%"
          class="enhanced-input" @keyup.enter="handleLogin">
          <template #prefix>
            <svg-icon icon-class="validCode" class="el-input__icon input-icon" />
          </template>
        </el-input>
        <div class="login-code">
          <img :src="codeUrl" @click="getCode" class="login-code-img" />
        </div>
      </el-form-item>

      <!-- 选项组 -->
      <div class="options-row">
        <el-checkbox v-model="loginForm.rememberMe" class="remember-check">记住密码</el-checkbox>
        <span v-if="register" class="register-link">
          <router-link class="link-type" :to="'/register'">立即注册</router-link>
        </span>
      </div>

      <!-- 登录按钮 -->
      <el-form-item style="width:100%;">
        <el-button :loading="loading" size="large" type="primary" style="width:100%;" class="login-btn"
          @click.prevent="handleLogin">
          <span v-if="!loading">登 录</span>
          <span v-else>登录中...</span>
        </el-button>
      </el-form-item>

      <!-- 底部信息 (移到表单内部更紧凑) -->
      <div class="form-footer">
        <span>
          <a href="https://beian.miit.gov.cn" target="_blank">粤ICP备2025444193号</a>
        </span>
        <span>Copyright © 2025-2026 玑肤芮</span>
      </div>
    </el-form>
  </div>
</template>

<script setup>
import { getCodeImg } from "@/api/login";
import Cookies from "js-cookie";
import { encrypt, decrypt } from "@/utils/jsencrypt";
import useUserStore from '@/store/modules/user'

const userStore = useUserStore()
const route = useRoute();
const router = useRouter();
const { proxy } = getCurrentInstance();

const loginForm = ref({
  username: "",
  password: "",
  rememberMe: false,
  code: "",
  uuid: ""
});

const loginRules = {
  username: [{ required: true, trigger: "blur", message: "请输入您的账号" }],
  password: [{ required: true, trigger: "blur", message: "请输入您的密码" }],
  code: [{ required: true, trigger: "change", message: "请输入验证码" }]
};

const codeUrl = ref("");
const loading = ref(false);
const captchaEnabled = ref(true);
const register = ref(false);
const redirect = ref(undefined);

watch(route, (newRoute) => {
  redirect.value = newRoute.query && newRoute.query.redirect;
}, { immediate: true });

function handleLogin() {
  proxy.$refs.loginRef.validate(valid => {
    if (valid) {
      loading.value = true;
      if (loginForm.value.rememberMe) {
        Cookies.set("username", loginForm.value.username, { expires: 30 });
        Cookies.set("password", encrypt(loginForm.value.password), { expires: 30 });
        Cookies.set("rememberMe", loginForm.value.rememberMe, { expires: 30 });
      } else {
        Cookies.remove("username");
        Cookies.remove("password");
        Cookies.remove("rememberMe");
      }
      userStore.login(loginForm.value).then(() => {
        const query = route.query;
        const otherQueryParams = Object.keys(query).reduce((acc, cur) => {
          if (cur !== "redirect") {
            acc[cur] = query[cur];
          }
          return acc;
        }, {});
        router.push({ path: redirect.value || "/", query: otherQueryParams });
      }).catch(() => {
        loading.value = false;
        if (captchaEnabled.value) {
          getCode();
        }
      });
    }
  });
}

function getCode() {
  getCodeImg().then(res => {
    captchaEnabled.value = res.captchaEnabled === undefined ? true : res.captchaEnabled;
    if (captchaEnabled.value) {
      codeUrl.value = "data:image/gif;base64," + res.img;
      loginForm.value.uuid = res.uuid;
    }
  });
}

function getCookie() {
  const username = Cookies.get("username");
  const password = Cookies.get("password");
  const rememberMe = Cookies.get("rememberMe");
  loginForm.value = {
    username: username === undefined ? loginForm.value.username : username,
    password: password === undefined ? loginForm.value.password : decrypt(password),
    rememberMe: rememberMe === undefined ? false : Boolean(rememberMe)
  };
}

getCode();
getCookie();
</script>
<style>
input:-webkit-autofill {
  box-shadow: 0 0 0 1000px white inset;
}

input {
  box-shadow: 0 0 0px 1000px white inset;
}
</style>
<style lang='scss' scoped>
@import url('../assets/styles/login.scss');
</style>