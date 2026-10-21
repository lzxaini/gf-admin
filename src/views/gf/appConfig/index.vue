<template>
  <div class="app-container">
    <el-card v-loading="loading" header="APP 配置管理">
      <el-alert title="以下配置适用于全部安卓设备。治疗时长从下一次扫码会话生效；MQTT 参数保存后设备将重新连接；串口参数在设备空闲时生效。" type="info" :closable="false" class="mb8" />
      <el-form ref="formRef" :model="form" :rules="rules" label-width="160px" style="max-width: 640px">
        <el-form-item label="治疗运行时长" prop="treatmentMinutes">
          <el-input-number v-model="form.treatmentMinutes" :min="1" :max="255" :precision="0" /> <span class="unit">分钟</span>
        </el-form-item>
        <el-form-item label="心跳间隔" prop="heartbeatSeconds">
          <el-input-number v-model="form.heartbeatSeconds" :min="10" :max="3600" :precision="0" /> <span class="unit">秒</span>
        </el-form-item>
        <el-divider content-position="left">串口配置</el-divider>
        <el-form-item label="设备路径" prop="serialDevicePath">
          <el-input v-model.trim="form.serialDevicePath" placeholder="/dev/ttyUSB5" />
        </el-form-item>
        <el-form-item label="波特率" prop="serialBaudRate">
          <el-input-number v-model="form.serialBaudRate" :min="300" :max="3000000" :precision="0" />
        </el-form-item>
        <el-form-item label="数据位" prop="serialDataBits">
          <el-select v-model="form.serialDataBits"><el-option v-for="value in [5, 6, 7, 8]" :key="value" :label="value" :value="value" /></el-select>
        </el-form-item>
        <el-form-item label="停止位" prop="serialStopBits">
          <el-select v-model="form.serialStopBits"><el-option v-for="value in [1, 2]" :key="value" :label="value" :value="value" /></el-select>
        </el-form-item>
        <el-form-item label="校验位" prop="serialParity">
          <el-select v-model="form.serialParity"><el-option label="无" value="none" /><el-option label="偶校验" value="even" /><el-option label="奇校验" value="odd" /></el-select>
        </el-form-item>
        <el-form-item label="方向控制 GPIO" prop="serialDirectionGpio">
          <el-input-number v-model="form.serialDirectionGpio" :min="-1" :max="1024" :precision="0" /> <span class="unit">-1 为关闭</span>
        </el-form-item>
        <el-form-item label="帧字节间隔" prop="serialInterByteTimeout">
          <el-input-number v-model="form.serialInterByteTimeout" :min="1" :max="1000" :precision="0" /> <span class="unit">毫秒</span>
        </el-form-item>
        <el-divider content-position="left">MQTT 配置</el-divider>
        <el-form-item label="MQTT 地址" prop="mqttUrl">
          <el-input v-model.trim="form.mqttUrl" placeholder="ws://host:port/mqtt 或 wss://host:port/mqtt" />
        </el-form-item>
        <el-form-item label="MQTT 用户名" prop="mqttUsername">
          <el-input v-model.trim="form.mqttUsername" />
        </el-form-item>
        <el-form-item label="MQTT 密码" prop="mqttPassword">
          <el-input v-model="form.mqttPassword" type="password" show-password autocomplete="new-password" :placeholder="form.mqttPasswordConfigured ? '留空表示不修改现有密码' : '请输入 MQTT 密码'" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="saving" @click="save" v-hasPermi="['gf:appConfig:edit']">保存运行配置</el-button>
          <el-button @click="load">刷新</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-card header="调试入口" style="margin-top: 16px">
      <el-descriptions :column="1" border style="max-width: 640px">
        <el-descriptions-item label="当前状态">{{ form.debugEnabled === 1 ? '开启' : '关闭' }}</el-descriptions-item>
        <el-descriptions-item label="授权修订">{{ form.debugRevision }}</el-descriptions-item>
      </el-descriptions>
      <div style="margin-top: 16px">
        <el-button v-if="form.debugEnabled !== 1" type="primary" :loading="debugBusy" @click="changeDebug(1)" v-hasPermi="['gf:appConfig:edit']">开启并生成密码</el-button>
        <template v-else>
          <el-button type="warning" :loading="debugBusy" @click="changeDebug(1, true)" v-hasPermi="['gf:appConfig:edit']">重置密码</el-button>
          <el-button type="danger" :loading="debugBusy" @click="changeDebug(0)" v-hasPermi="['gf:appConfig:edit']">关闭入口</el-button>
        </template>
      </div>
    </el-card>
    <el-dialog v-model="passwordOpen" title="调试密码已生成" width="400px" :close-on-click-modal="false" @closed="generatedPassword = ''">
      <el-alert title="仅展示本次；旧密码和授权已失效，请妥善保存。" type="warning" :closable="false" />
      <el-input :model-value="generatedPassword" readonly style="margin-top: 20px; font-size: 24px; letter-spacing: 4px" />
      <template #footer><el-button @click="copyPassword">复制密码</el-button><el-button type="primary" @click="passwordOpen = false">已保存</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup name="AppConfig">
import { getAppConfig, updateAppConfig, controlAppDebug } from '@/api/gf/appConfig'

const { proxy } = getCurrentInstance()
const formRef = ref(null)
const loading = ref(false)
const saving = ref(false)
const debugBusy = ref(false)
const passwordOpen = ref(false)
const generatedPassword = ref('')
const form = reactive({ treatmentMinutes: 80, heartbeatSeconds: 30,
  serialDevicePath: '/dev/ttyUSB5', serialBaudRate: 19200, serialDataBits: 8, serialStopBits: 1,
  serialParity: 'none',
  serialDirectionGpio: -1, serialInterByteTimeout: 20,
  mqttUrl: '', mqttUsername: '', mqttPassword: '', mqttPasswordConfigured: false,
  revision: 0, debugEnabled: 0, debugRevision: 0 })
const rules = {
  treatmentMinutes: [{ required: true, type: 'number', min: 1, max: 255, message: '请输入 1 至 255 分钟', trigger: 'change' }],
  heartbeatSeconds: [{ required: true, type: 'number', min: 10, max: 3600, message: '请输入 10 至 3600 秒', trigger: 'change' }],
  serialDevicePath: [{ required: true, pattern: /^\/dev\/[A-Za-z0-9._-]+$/, message: '请输入有效的 /dev/ 串口路径', trigger: 'blur' }],
  serialBaudRate: [{ required: true, type: 'number', min: 300, max: 3000000, message: '波特率超出范围', trigger: 'change' }],
  serialDataBits: [{ required: true, type: 'number', min: 5, max: 8, trigger: 'change' }],
  serialStopBits: [{ required: true, type: 'number', min: 1, max: 2, trigger: 'change' }],
  serialParity: [{ required: true, type: 'string', trigger: 'change' }],
  serialDirectionGpio: [{ required: true, type: 'number', min: -1, max: 1024, trigger: 'change' }],
  serialInterByteTimeout: [{ required: true, type: 'number', min: 1, max: 1000, trigger: 'change' }],
  mqttUrl: [{ required: true, pattern: /^wss?:\/\/\S+$/, message: '请输入 ws:// 或 wss:// 地址', trigger: 'blur' }],
  mqttUsername: [{ required: true, message: '请输入用户名', trigger: 'blur' }]
}

async function load() {
  loading.value = true
  try {
    const { data } = await getAppConfig()
    Object.assign(form, data, { mqttPassword: '' })
  } finally { loading.value = false }
}

async function save() {
  await formRef.value.validate()
  saving.value = true
  try {
    const { data } = await updateAppConfig({
      treatmentMinutes: form.treatmentMinutes, heartbeatSeconds: form.heartbeatSeconds,
      serialDevicePath: form.serialDevicePath, serialBaudRate: form.serialBaudRate,
      serialDataBits: form.serialDataBits, serialStopBits: form.serialStopBits,
      serialParity: form.serialParity, serialDirectionGpio: form.serialDirectionGpio,
      serialInterByteTimeout: form.serialInterByteTimeout,
      mqttUrl: form.mqttUrl, mqttUsername: form.mqttUsername, mqttPassword: form.mqttPassword,
      expectedRevision: form.revision
    })
    Object.assign(form, data, { mqttPassword: '' })
    proxy.$modal.msgSuccess('配置已保存')
  } finally { saving.value = false }
}

async function changeDebug(enabled, resetPassword = false) {
  await proxy.$modal.confirm(resetPassword ? '重置后旧密码及授权立即失效，是否继续？' : enabled ? '为全部设备开启调试入口并生成密码？' : '关闭全部设备的调试入口？')
  debugBusy.value = true
  try {
    const { data } = await controlAppDebug({ enabled, resetPassword, expectedRevision: form.debugRevision })
    form.debugEnabled = data.debugEnabled
    form.debugRevision = data.debugRevision
    if (data.password) { generatedPassword.value = data.password; passwordOpen.value = true }
    proxy.$modal.msgSuccess('调试配置已更新')
  } finally { debugBusy.value = false }
}

async function copyPassword() {
  try { await navigator.clipboard.writeText(generatedPassword.value); proxy.$modal.msgSuccess('密码已复制') }
  catch (_) { proxy.$modal.msgError('复制失败，请手动复制') }
}

load()
</script>

<style scoped>
.unit { margin-left: 8px; color: #909399; }
</style>
