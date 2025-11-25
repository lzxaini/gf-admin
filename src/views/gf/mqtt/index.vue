<template>
	<div class="app-container">
		<el-card class="header-card">
			<div class="header-info">
				<h3>客户端监控</h3>
				<div class="header-actions">
					<el-tag type="success" size="large">在线客户端: {{ clientList.length }}</el-tag>
					<el-button type="primary" :loading="tableLoading" @click="fetchClientList" icon="Refresh">刷新列表</el-button>
				</div>
			</div>
		</el-card>

		<div v-loading="tableLoading" class="client-grid">
			<el-card v-for="client in clientList" :key="client.clientid" class="client-card" shadow="hover">
				<div class="card-header">
					<div class="client-id">
						<el-icon><Connection /></el-icon>
						<span>{{ client.clientid }}</span>
					</div>
					<el-tag :type="client.connected ? 'success' : 'danger'" size="small">
						{{ client.connected ? '在线' : '离线' }}
					</el-tag>
				</div>

				<el-divider />

				<div class="card-body">
					<div class="info-row">
						<div class="info-item">
							<span class="label">用户名</span>
							<span class="value">{{ client.username || '-' }}</span>
						</div>
						<div class="info-item">
							<span class="label">心跳</span>
							<span class="value">{{ client.keepalive }}s</span>
						</div>
					</div>

					<div class="info-row">
						<div class="info-item">
							<span class="label">IP地址</span>
							<span class="value">{{ client.ip_address }}</span>
						</div>
						<div class="info-item">
							<span class="label">订阅数</span>
							<span class="value">{{ client.subscriptions_cnt }}</span>
						</div>
					</div>

					<div class="info-row">
						<div class="info-item">
							<span class="label">接收消息</span>
							<span class="value highlight">{{ client.recv_msg }}</span>
						</div>
						<div class="info-item">
							<span class="label">发送消息</span>
							<span class="value highlight">{{ client.send_msg }}</span>
						</div>
					</div>

					<div class="info-row">
						<div class="info-item">
							<span class="label">连接时间</span>
							<span class="value">{{ formatTime(client.connected_at) }}</span>
						</div>
						<div class="info-item">
							<span class="label">会话创建</span>
							<span class="value">{{ formatTime(client.created_at) }}</span>
						</div>
					</div>

					<div class="info-row">
						<div class="info-item full-width">
							<el-button v-if="client.type === 'wifi'" type="primary" @click="getDeviceConfig(client.clientid)">获取设备信息</el-button>
						</div>
					</div>
				</div>
			</el-card>
		</div>

		<el-empty v-if="!tableLoading && clientList.length === 0" description="暂无在线客户端" />
	</div>

	<el-dialog v-model="deviceInfoDialog" title="设备信息" width="500px" :close-on-click-modal="false">
		<template #default>
			<div v-if="deviceInfoData">
				<pre style="background: #f6f8fa; padding: 12px; border-radius: 6px; overflow: auto; max-height: 400px"
					>{{ JSON.stringify(deviceInfoData, null, 2) }}
					</pre
				>
			</div>
			<div v-else>
				<pre style="background: #f6f8fa; padding: 12px; border-radius: 6px; overflow: auto; max-height: 400px">{{ deviceInfoRaw }}</pre>
			</div>
		</template>
		<template #footer>
			<el-button @click="deviceInfoDialog = false">关闭</el-button>
		</template>
	</el-dialog>
</template>

<script setup>
import { useMQTTStore } from '@/store/modules/useMQTTStore';
import axios from 'axios';
import dayjs from 'dayjs';

const mqttStore = useMQTTStore();
const { proxy } = getCurrentInstance();
const tableLoading = ref(false);
const clientList = ref([]);
const MQTT_TOKEN_KEY = 'mqtt_api_token';
let timer = null;
let isFirstLoad = true;

const username = 'asdasdad';
const password = 'asdasda';

function formatTime(val) {
	if (!val) return '';
	return dayjs(val).format('YYYY-MM-DD HH:mm:ss');
}

// 获取缓存的token
function getToken() {
	return localStorage.getItem(MQTT_TOKEN_KEY);
}

// 缓存token
function setToken(token) {
	localStorage.setItem(MQTT_TOKEN_KEY, token);
}

// 清除token
function clearToken() {
	localStorage.removeItem(MQTT_TOKEN_KEY);
}

// 登录获取token
async function login() {
	try {
		const res = await axios.post('/mqttapi/api/v5/login', { username, password });
		const token = res.data.token;
		setToken(token);
		return token;
	} catch (e) {
		window.$message?.error?.('登录失败: ' + (e.response?.data?.message || e.message));
		throw e;
	}
}

// 获取客户端列表
async function fetchClientList() {
	// 只有首次加载才显示loading，后续静默刷新
	if (isFirstLoad) {
		tableLoading.value = true;
	}
	try {
		let token = getToken();

		// 如果没有token，先登录
		if (!token) {
			token = await login();
		}

		const res = await axios.get(
			'/mqttapi/api/v5/clients_v2?limit=100&fields=clientid,username,connected,ip_address,keepalive,connected_at,recv_msg,send_msg,created_at,subscriptions_cnt',
			{
				headers: {
					Authorization: `Bearer ${token}`,
				},
			}
		);
		clientList.value = res.data.data || [];
		handleSubscribeAll();
	} catch (e) {
		// 如果是401错误，清除token并重新登录
		if (e.response?.status === 401) {
			clearToken();
			try {
				const newToken = await login();
				// 重新请求
				const res = await axios.get(
					'/mqttapi/api/v5/clients_v2?limit=100&fields=clientid,username,connected,ip_address,keepalive,connected_at,recv_msg,send_msg,created_at,subscriptions_cnt',
					{
						headers: {
							Authorization: newToken,
						},
					}
				);
				clientList.value = res.data.data || [];
			} catch (retryError) {
				window.$message?.error?.('获取客户端列表失败: ' + (retryError.response?.data?.message || retryError.message));
			}
		} else {
			window.$message?.error?.('获取客户端列表失败: ' + (e.response?.data?.message || e.message));
		}
	} finally {
		if (isFirstLoad) {
			tableLoading.value = false;
			isFirstLoad = false;
		}
	}
}
const deviceInfoDialog = ref(false);
const deviceInfoData = ref(null);
const deviceInfoRaw = ref('');

const getDeviceConfig = async clientId => {
	tableLoading.value = true;
	mqttStore.publish(`/req/${clientId}`, 'config-get');
	try {
		const deviceInfo = await getDeviceInfo(clientId);
		tableLoading.value = false;
		// 尝试解析JSON
		let parsed = null;
		try {
			parsed = JSON.parse(deviceInfo);
		} catch (e) {
			parsed = null;
		}
		deviceInfoData.value = parsed;
		deviceInfoRaw.value = deviceInfo;
		deviceInfoDialog.value = true;
	} catch (error) {
		tableLoading.value = false;
		proxy.$modal.msgError('获取设备信息失败，设备可能离线！');
	}
};

/** 获取设备信息 */
function getDeviceInfo(serialNumber) {
	return new Promise((resolve, reject) => {
		const messageListener = (topic, message) => {
			if (topic === `/resp/${serialNumber}`) {
				mqttStore.offMessage(messageListener);
				resolve(message.toString());
			}
		};
		mqttStore.onMessage(messageListener);

		// 超时处理，5秒后如果没有收到消息则拒绝
		setTimeout(() => {
			mqttStore.offMessage(messageListener);
			reject(new Error('获取设备信息超时'));
		}, 5000);
	});
}

/** 订阅所有wifi设备 */
function handleSubscribeAll() {
	// 循环订阅所有WIFI设备
	clientList.value.forEach(item => {
		// 订阅所有编号为GFKM-开头的设备
		if (item.clientid.startsWith('GFKM-')) {
			item.type = 'wifi';
			if (isFirstLoad) {
				console.log('订阅', `/resp/${item.clientid}`);
				// 首次加载后订阅所有WIFI设备
				mqttStore.subscribe(`/resp/${item.clientid}`);
			}
		}
	});
}
onMounted(() => {
	mqttStore.connect();
	// 监听MQTT连接成功后再加载列表
	const stopWatch = watch(
		() => mqttStore.state.isConnected,
		val => {
			if (val) {
				fetchClientList();
				timer = setInterval(() => {
					fetchClientList();
				}, 1000 * 10);
				stopWatch(); // 只监听一次
			}
		},
		{ immediate: true }
	);
});

onBeforeUnmount(() => {
	mqttStore.disconnect();
	// 组件卸载时清除定时器
	if (timer) {
		clearInterval(timer);
		timer = null;
	}
});
</script>

<style scoped>
.app-container {
	padding: 24px;
	background: #f5f7fa;
	min-height: calc(100vh - 84px);
}

.header-card {
	margin-bottom: 20px;
}

.header-info {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.header-actions {
	display: flex;
	align-items: center;
	gap: 12px;
}

.header-info h3 {
	margin: 0;
	font-size: 20px;
	color: #303133;
}

.client-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
	gap: 20px;
	margin-bottom: 20px;
}

.client-card {
	transition: all 0.3s ease;
}

.client-card:hover {
	transform: translateY(-4px);
}

.card-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 12px;
}

.client-id {
	display: flex;
	align-items: center;
	gap: 8px;
	font-weight: 600;
	font-size: 14px;
	color: #409eff;
	word-break: break-all;
}

.card-body {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.info-row {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 16px;
}

.info-item {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.info-item.full-width {
	grid-column: 1 / -1;
}

.info-item .label {
	font-size: 12px;
	color: #909399;
}

.info-item .value {
	font-size: 14px;
	color: #303133;
	font-weight: 500;
}

.info-item .value.highlight {
	color: #409eff;
	font-weight: 600;
}

:deep(.el-divider--horizontal) {
	margin: 12px 0;
}
</style>
