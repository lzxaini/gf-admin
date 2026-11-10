<template>
	<div class="app-container mqtt-monitor">
		<el-card class="header-card">
			<div class="header-info">
				<h3>客户端监控</h3>
				<div class="header-actions">
					<el-tag type="success" size="large">本页在线: {{ onlineClientCount }}</el-tag>
					<el-button type="primary" :loading="tableLoading" @click="fetchClientList" icon="Refresh">刷新列表</el-button>
				</div>
			</div>
			<el-form :inline="true" class="client-search" @submit.prevent="handleSearch">
				<el-form-item label="关键词">
					<el-input v-model="searchInput" placeholder="请输入设备编号或客户端ID" clearable @keyup.enter="handleSearch" @clear="handleSearch" />
				</el-form-item>
				<el-form-item label="搜索字段">
					<el-select v-model="searchField"><el-option label="设备编号 / 客户端ID" value="like_clientid" /><el-option label="IP地址" value="ip_address" /><el-option label="连接类型" value="like_username" /></el-select>
				</el-form-item>
				<el-form-item label="本页类型">
					<el-select v-model="searchType" placeholder="全部类型" clearable>
						<el-option v-for="type in CLIENT_TYPES" :key="type.typeName" :label="type.typeName" :value="type.typeName" />
						<el-option label="未知类型" value="未知类型" />
					</el-select>
				</el-form-item>
				<el-form-item>
					<el-button type="primary" icon="Search" @click="handleSearch">搜索</el-button>
					<el-button icon="Refresh" @click="resetSearch">重置</el-button>
				</el-form-item>
			</el-form>
			<div class="search-summary">第 {{ pageNum }} 页，本页 {{ clientList.length }} 个客户端，显示 {{ filteredClientList.length }} 个</div>
		</el-card>

		<div v-loading="tableLoading" class="client-grid">
			<el-card v-for="client in pagedClientList" :key="client.clientid" class="client-card" shadow="hover">
				<div class="card-header">
					<div class="client-id">
						<el-icon><Connection /></el-icon>
						<span>{{ displayClientId(client.clientid) }}</span>
						<el-tag :type="client.typeColor">{{ client.typeName }}</el-tag>
					</div>
					<el-tag :type="client.connected ? 'success' : 'danger'" size="small">
						{{ client.connected ? '在线' : '离线' }}
					</el-tag>
				</div>

				<el-divider />

				<div class="card-body">
					<div class="info-row">
						<div class="info-item">
							<span class="label">连接类型</span>
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
							<el-button v-if="client.typeName === 'wifi模块'" type="primary" @click="openWifiDialog(client.clientid)">WiFi通信</el-button>
							<el-button v-if="client.typeName === '安卓客户端'" type="primary" @click="open4GDialog(client.clientid)">在线调试</el-button>
							<el-button v-if="client.typeName === '4G模块'" type="success" @click="open4GDialog(client.clientid)">4G通信</el-button>
						</div>
					</div>
				</div>
			</el-card>
		</div>

		<el-empty v-if="!tableLoading && filteredClientList.length === 0" :description="clientList.length ? '没有匹配的客户端，请调整搜索条件' : '暂无在线客户端'" />
		<div class="client-pagination">
			<span>第 {{ pageNum }} 页</span>
			<el-select :model-value="pageSize" :disabled="tableLoading" style="width: 110px" @change="changePageSize">
				<el-option v-for="size in [12, 20, 24, 48, 50, 100]" :key="size" :label="`${size}条/页`" :value="size" />
			</el-select>
			<el-button :disabled="tableLoading || pageNum === 1" @click="fetchClientList(pageNum - 1)">上一页</el-button>
			<el-button :disabled="tableLoading || !nextCursor" @click="fetchClientList(pageNum + 1)">下一页</el-button>
		</div>
	</div>

	<!-- WiFi模块通信对话框 -->
	<WifiDialog v-model="wifiDialogVisible" :client-id="currentWifiClientId" />

	<!-- 4G模块通信对话框 -->
	<FourGDialog v-model="fourGDialogVisible" :client-id="current4GClientId" />
</template>

<script setup>
import { useMQTTStore } from '@/store/modules/useMQTTStore';
import WifiDialog from './wifi.vue';
import FourGDialog from './4G.vue';
import axios from 'axios';
import dayjs from 'dayjs';

const mqttStore = useMQTTStore();
const { proxy } = getCurrentInstance();
const tableLoading = ref(false);
const clientList = ref([]);
const searchInput = ref('');
const searchKeyword = ref('');
const searchType = ref('');
const searchField = ref('like_clientid');
const activeSearch = ref({});
const pageCursors = ref(['']);
const nextCursor = ref('');
const pageNum = ref(1);
const pageSize = ref(20);
const onlineClientCount = computed(() => clientList.value.filter(client => client.connected).length);
// 仅裁剪展示用 ID，通信、订阅和卡片 key 仍使用原始 clientid。
function displayClientId(clientId) {
	return String(clientId || '').replace(/^app_\d+_(?=.+)/, '');
}

const filteredClientList = computed(() => clientList.value.filter(client => !searchType.value || client.typeName === searchType.value));
const pagedClientList = filteredClientList;

function handleSearch() {
	if (fetchingClients || tableLoading.value) return;
	searchKeyword.value = searchInput.value.trim();
	activeSearch.value = searchKeyword.value ? { [searchField.value]: searchKeyword.value } : {};
	pageCursors.value = [''];
	preparedNextPage = null;
	fetchClientList(1);
}

function resetSearch() {
	if (fetchingClients || tableLoading.value) return;
	searchInput.value = '';
	searchKeyword.value = '';
	searchType.value = '';
	searchField.value = 'like_clientid';
	handleSearch();
}

function changePageSize(size) {
	if (fetchingClients) return;
	pageSize.value = size;
	pageCursors.value = [''];
	preparedNextPage = null;
	fetchClientList(1);
}
const MQTT_TOKEN_KEY = 'mqtt_api_token';
let timer = null;
let isFirstLoad = true;
let fetchingClients = false;
let disposed = false;

// WiFi对话框相关
const wifiDialogVisible = ref(false);
const currentWifiClientId = ref('');

// 4G对话框相关
const fourGDialogVisible = ref(false);
const current4GClientId = ref('');

const username = 'public';
const password = 'ByufSsGA96Q:Dd2';

/** 客户端类型配置 */
const CLIENT_TYPES = [
	{ prefix: 'GFKM-', typeName: 'wifi模块', typeColor: 'warning', needSubscribe: true },
	{ prefix: 'app_', typeName: '安卓客户端', typeColor: 'info', needSubscribe: true },
	{ prefix: 'wx_', typeName: '微信小程序', typeColor: 'success', needSubscribe: false },
	{ prefix: 'web-', typeName: 'PC管理后台', typeColor: 'primary', needSubscribe: false },
	{ prefix: 'server-', typeName: '系统服务端', typeColor: 'danger', needSubscribe: false },
	{ prefix: 'mqttx_', typeName: '调试工具', typeColor: 'info', needSubscribe: false },
	{ pattern: /^\d{15}$/, typeName: '4G模块', typeColor: 'info', needSubscribe: false }, // IMEI号15位数字
];

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
		const res = await axios.post(`${import.meta.env.VITE_APP_EMQX_SERVER_API}/api/v5/login`, { username, password });
		const token = res.data.token;
		setToken(token);
		return token;
	} catch (e) {
		proxy.$modal.msgError('登录失败: ' + (e.response?.data?.message || e.message));
		throw e;
	}
}

// 统一请求方法，自动处理401重登录
async function requestWithAuth(requestFn) {
	let token = getToken();

	// 如果没有token，先登录
	if (!token) {
		token = await login();
	}

	try {
		const res = await requestFn(token);
		// 检查业务code是否为401
		if (res.data?.code === 401) {
			clearToken();
			throw { isAuth401: true, response: res };
		}
		return res;
	} catch (e) {
		// 如果是401错误（http状态码或业务code），清除token并重新登录
		if (e.response?.status === 401 || e.isAuth401) {
			clearToken();
			const newToken = await login();
			// 使用新token重新请求
			const res = await requestFn(newToken);
			if (res.data?.code === 401) {
				clearToken();
				throw new Error('认证失败');
			}
			return res;
		}
		throw e;
	}
}

// 游标可能指向空批次，必须实际读取后才能确认是否还有数据。
async function readClientPage(startCursor) {
	let cursor = startCursor;
	const visited = new Set();
	while (!disposed) {
		const res = await requestWithAuth(token => axios.get(
			`${import.meta.env.VITE_APP_EMQX_SERVER_API}/api/v5/clients_v2`,
			{
				headers: { Authorization: `Bearer ${token}` },
				params: {
					limit: pageSize.value,
					...(cursor ? { cursor } : {}),
					...activeSearch.value,
					fields: 'clientid,username,connected,ip_address,port,keepalive,clean_start,expiry_interval,connected_at,send_msg,recv_msg,client_attrs,created_at,subscriptions_cnt,subscriptions_max',
				},
			}
		));
		const rows = res.data.data || [];
		const next = res.data.meta?.cursor || '';
		if (next && (next === cursor || visited.has(next))) throw new Error('接口返回重复分页游标，请刷新列表');
		if (rows.length || !next) return { rows, cursor, next };
		visited.add(next);
		cursor = next;
	}
	return { rows: [], cursor, next: '' };
}

// 缓存已探测的下一页，点击下一页时直接使用，避免重复请求。
let preparedNextPage = null;
async function fetchClientList(targetPage = pageNum.value, silent = false) {
	if (fetchingClients || disposed) return;
	if (!Number.isInteger(targetPage)) targetPage = pageNum.value;
	const cursor = pageCursors.value[targetPage - 1];
	if (cursor === undefined) return;
	fetchingClients = true;
	// 探测期间也禁用翻页及搜索，避免条件与游标串页。
	tableLoading.value = true;
	try {
		let result = targetPage === pageNum.value + 1 && preparedNextPage?.cursor === cursor
			? preparedNextPage : await readClientPage(cursor);
		preparedNextPage = null;
		while (!result.rows.length && targetPage > 1) {
			if (targetPage > pageNum.value && clientList.value.length) {
				nextCursor.value = '';
				pageCursors.value = pageCursors.value.slice(0, pageNum.value);
				return;
			}
			targetPage--;
			result = await readClientPage(pageCursors.value[targetPage - 1] || '');
		}
		const upcoming = result.next ? await readClientPage(result.next) : null;
		if (disposed) return;
		preparedNextPage = upcoming?.rows.length ? upcoming : null;
		pageCursors.value[targetPage - 1] = result.cursor;
		clientList.value = result.rows;
		pageNum.value = targetPage;
		nextCursor.value = preparedNextPage?.cursor || '';
		pageCursors.value = pageCursors.value.slice(0, targetPage);
		if (nextCursor.value) pageCursors.value[targetPage] = nextCursor.value;
		handleSubscribeAll();
		isFirstLoad = false;
	} catch (e) {
		preparedNextPage = null;
		nextCursor.value = '';
		if (!disposed) proxy.$modal.msgError('获取客户端列表失败: ' + (e.response?.data?.message || e.message));
	} finally {
		fetchingClients = false;
		tableLoading.value = false;
	}
}
/** 打开WiFi通信对话框 */
function openWifiDialog(clientId) {
	currentWifiClientId.value = clientId;
	wifiDialogVisible.value = true;
}

/** 打开4G通信对话框 */
function open4GDialog(clientId) {
	current4GClientId.value = clientId;
	fourGDialogVisible.value = true;
}

/** 订阅所有wifi设备 */
function handleSubscribeAll() {
	clientList.value.forEach(item => {
		// 根据clientid前缀或正则匹配类型
		const clientType = CLIENT_TYPES.find(type => {
			if (type.prefix) {
				return item.clientid.startsWith(type.prefix);
			}
			if (type.pattern) {
				return type.pattern.test(item.clientid);
			}
			return false;
		});

		if (clientType) {
			item.typeName = clientType.typeName;
			item.typeColor = clientType.typeColor;

			// 首次加载且需要订阅的类型才订阅
			if (isFirstLoad && clientType.needSubscribe) {
				console.log('订阅', `/resp/${item.clientid}`);
				mqttStore.subscribe(`/resp/${item.clientid}`);
			}
		} else {
			// 未匹配到类型的默认值
			item.typeName = '未知类型';
			item.typeColor = 'info';
		}
	});
}
onMounted(() => {
	mqttStore.connect();
	// 监听MQTT连接成功后再加载列表
	watch(
		() => mqttStore.state.isConnected,
		val => {
			if (val && !timer) {
				fetchClientList();
				timer = setInterval(() => {
					fetchClientList(pageNum.value, true);
				}, 1000 * 10);
			}
		},
		{ immediate: true }
	);
});

onBeforeUnmount(() => {
	disposed = true;
	mqttStore.disconnect();
	// 组件卸载时清除定时器
	if (timer) {
		clearInterval(timer);
		timer = null;
	}
});
</script>

<style scoped>
.command-buttons {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	margin-bottom: 16px;
	padding-bottom: 16px;
	border-bottom: 1px solid #ebeef5;
}
.mqtt-monitor {
	display: flex;
	flex-direction: column;
	box-sizing: border-box;
	padding: 24px;
	background: #f5f7fa;
	min-height: calc(100vh - 84px);
}

.header-card {
	flex-shrink: 0;
	margin-bottom: 20px;
}

.header-info {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.client-search { margin-top: 20px; }
.client-search :deep(.el-input) { width: 340px; max-width: 100%; }
.client-search :deep(.el-select) { width: 180px; }
.search-summary { color: #909399; font-size: 13px; }

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

.client-pagination {
	align-items: center;
	gap: 12px;
	flex-wrap: wrap;
	margin-top: auto;
	flex-shrink: 0;
	display: flex;
	justify-content: flex-end;
	padding: 4px 0 12px;
}
.client-pagination :deep(.el-pagination) {
	position: static;
	height: auto;
	flex-wrap: wrap;
	justify-content: flex-end;
	row-gap: 12px;
}
@media (max-width: 768px) {
	.client-pagination { justify-content: center; }
	.client-pagination :deep(.el-pagination) { justify-content: center; }
	.client-pagination :deep(.el-pagination__jump) { display: none; }
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
