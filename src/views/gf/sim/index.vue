<!--
 * @Author: 17630921248 1245634367@qq.com
 * @Date: 2026-01-20 13:26:20
 * @LastEditors: 17630921248 1245634367@qq.com
 * @LastEditTime: 2026-02-05 08:39:12
 * @FilePath: \ryv3\src\views\gf\sim\index.vue
 * @Description: 流量池管理
 * 微信:lizx2066
-->
<template>
	<div class="app-container">
		<!-- 顶部统计卡片 -->
		<el-row :gutter="20" class="stats-row">
			<el-col :span="6">
				<el-card shadow="hover" class="stats-card">
					<div class="stats-item">
						<el-icon class="stats-icon total"><Coin /></el-icon>
						<div class="stats-content">
							<div class="stats-value">{{ poolList.length }}</div>
							<div class="stats-label">流量池数量</div>
						</div>
					</div>
				</el-card>
			</el-col>
			<el-col :span="6">
				<el-card shadow="hover" class="stats-card">
					<div class="stats-item">
						<el-icon class="stats-icon total-flow"><TrendCharts /></el-icon>
						<div class="stats-content">
							<div class="stats-value">{{ totalFlowSum }}</div>
							<div class="stats-label">总流量</div>
						</div>
					</div>
				</el-card>
			</el-col>
			<el-col :span="6">
				<el-card shadow="hover" class="stats-card">
					<div class="stats-item">
						<el-icon class="stats-icon used-flow"><DataAnalysis /></el-icon>
						<div class="stats-content">
							<div class="stats-value">{{ usedFlowSum }}</div>
							<div class="stats-label">已用流量</div>
						</div>
					</div>
				</el-card>
			</el-col>
			<el-col :span="6">
				<el-card shadow="hover" class="stats-card">
					<div class="stats-item">
						<el-icon class="stats-icon remain-flow"><Odometer /></el-icon>
						<div class="stats-content">
							<div class="stats-value">{{ remainFlowSum }}</div>
							<div class="stats-label">剩余流量</div>
						</div>
					</div>
				</el-card>
			</el-col>
		</el-row>

		<!-- 搜索区域 -->
		<el-card shadow="never" class="search-card">
			<el-form :inline="true" :model="queryParams">
				<el-form-item label="流量池名称">
					<el-input v-model="queryParams.poolName" placeholder="请输入流量池名称" clearable style="width: 200px" @keyup.enter="handleQuery" />
				</el-form-item>
				<el-form-item label="企业名称">
					<el-input v-model="queryParams.deptName" placeholder="请输入企业名称" clearable style="width: 200px" @keyup.enter="handleQuery" />
				</el-form-item>
				<el-form-item>
					<el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
					<el-button icon="Refresh" @click="resetQuery">重置</el-button>
					<el-button type="success" icon="Refresh" @click="handleRefresh" :loading="loading">刷新数据</el-button>
				</el-form-item>
			</el-form>
		</el-card>

		<!-- 流量池卡片列表 -->
		<el-row :gutter="20" v-loading="loading">
			<el-col :span="6" v-for="pool in displayPoolList" :key="pool.id" style="margin-bottom: 20px">
				<el-card shadow="hover" class="pool-card" @click="goToSimCardList(pool.id)" style="cursor: pointer">
					<!-- 卡片头部 -->
					<template #header>
						<div class="pool-header">
							<div class="pool-title">
								<el-icon class="pool-icon"><Box /></el-icon>
								<span class="pool-name">{{ pool.poolName }}</span>
							</div>
							<el-tag type="primary" size="large">{{ pool.deptName }}</el-tag>
						</div>
					</template>

					<!-- 流量使用进度 -->
					<div class="flow-section">
						<div class="flow-progress">
							<el-progress :percentage="getFlowPercentage(pool)" :color="getFlowColor(pool)" :stroke-width="30" :text-inside="true" />
						</div>
						<div class="flow-stats">
							<div class="flow-item">
								<span class="flow-label">总流量</span>
								<span class="flow-value total">{{ pool.totalFlowStr }}</span>
							</div>
							<div class="flow-item">
								<span class="flow-label">已用</span>
								<span class="flow-value used">{{ formatFlow(pool.useFlow) }}</span>
							</div>
							<div class="flow-item">
								<span class="flow-label">剩余</span>
								<span class="flow-value remain">{{ pool.remainingFlowStr }}</span>
							</div>
						</div>
					</div>

					<el-divider />

					<!-- 卡片数量统计 -->
					<div class="card-stats">
						<div class="stat-item">
							<el-icon class="stat-icon active"><CircleCheck /></el-icon>
							<div class="stat-content">
								<div class="stat-label">已激活</div>
								<div class="stat-value">{{ pool.activateNumber }}</div>
							</div>
						</div>
						<div class="stat-item">
							<el-icon class="stat-icon testing"><Clock /></el-icon>
							<div class="stat-content">
								<div class="stat-label">测试期</div>
								<div class="stat-value">{{ pool.testNumber }}</div>
							</div>
						</div>
						<div class="stat-item">
							<el-icon class="stat-icon stopped"><CircleClose /></el-icon>
							<div class="stat-content">
								<div class="stat-label">已停机</div>
								<div class="stat-value">{{ pool.stopNumber }}</div>
							</div>
						</div>
						<div class="stat-item">
							<el-icon class="stat-icon canceled"><Remove /></el-icon>
							<div class="stat-content">
								<div class="stat-label">已注销</div>
								<div class="stat-value">{{ pool.cancelNumber }}</div>
							</div>
						</div>
					</div>

					<el-divider />

					<!-- 同步时间 -->
					<div class="sync-time">
						<el-icon><Timer /></el-icon>
						<span>同步时间: {{ pool.syncTime }}</span>
					</div>
				</el-card>
			</el-col>
		</el-row>

		<!-- 空状态 -->
		<el-empty v-if="!loading && displayPoolList.length === 0" description="暂无流量池数据" />

		<!-- 分页 -->
		<el-pagination
			v-if="displayPoolList.length > 0"
			v-model:current-page="queryParams.pageNum"
			v-model:page-size="queryParams.pageSize"
			:total="total"
			:page-sizes="[6, 12, 24, 48]"
			layout="total, sizes, prev, pager, next, jumper"
			@size-change="handleQuery"
			@current-change="handleQuery"
			style="margin-top: 20px; display: flex; justify-content: center"
		/>
	</div>
</template>

<script setup>
import { ref, onMounted, computed, getCurrentInstance } from 'vue';
import { Coin, TrendCharts, DataAnalysis, Odometer, Box, CircleCheck, Clock, CircleClose, Remove, Timer } from '@element-plus/icons-vue';
import axios from 'axios';

const { proxy } = getCurrentInstance();

// 状态数据
const loading = ref(false);
const poolList = ref([]);
const total = ref(0);

// 查询参数
const queryParams = ref({
	pageNum: 1,
	pageSize: 12,
	poolName: '',
	deptName: '',
});

// API配置
const API_BASE_URL = import.meta.env.DEV ? '/simapi' : 'https://5giot.cn/prod-api';
const API_TOKEN = 'Bearer eyJhbGciOiJIUzUxMiJ9.eyJsb2dpbl91c2VyX2tleSI6IjZlMjJiODQ5LTljM2QtNGUwYS04ZDJlLTAzNWJkZGY4MTg2MCJ9.pAqN73jMrRetPW3tTCiE-d-QTiacIOqwjuOuCkL3XP82y3e-gacFYiQk3S3e3cLV_VjmSHlmj87fiJubfPjGYw';

// 统计数据
const totalFlowSum = computed(() => {
	const total = poolList.value.reduce((sum, pool) => sum + pool.totalFlow, 0);
	return formatFlow(total);
});

const usedFlowSum = computed(() => {
	const total = poolList.value.reduce((sum, pool) => sum + pool.useFlow, 0);
	return formatFlow(total);
});

const remainFlowSum = computed(() => {
	const totalFlow = poolList.value.reduce((sum, pool) => sum + pool.totalFlow, 0);
	const usedFlow = poolList.value.reduce((sum, pool) => sum + pool.useFlow, 0);
	return formatFlow(totalFlow - usedFlow);
});

// 过滤后的列表
const displayPoolList = computed(() => {
	let list = poolList.value;
	
	// 根据流量池名称过滤
	if (queryParams.value.poolName) {
		list = list.filter(pool => pool.poolName.includes(queryParams.value.poolName));
	}
	
	// 根据企业名称过滤
	if (queryParams.value.deptName) {
		list = list.filter(pool => pool.deptName.includes(queryParams.value.deptName));
	}
	
	return list;
});

// 获取流量池列表
async function fetchCardList() {
	loading.value = true;
	try {
		const listRes = await axios.get(`${API_BASE_URL}/pool/pool/list`, {
			params: { 
				pageNum: queryParams.value.pageNum, 
				pageSize: queryParams.value.pageSize 
			},
			headers: { Authorization: API_TOKEN },
		});

		if (listRes.data.code !== 200) {
			proxy.$modal.msgError(listRes.data.msg || '获取列表失败');
			return;
		}

		poolList.value = listRes.data.rows || [];
		total.value = listRes.data.total || 0;
		
	} catch (error) {
		console.error('获取流量池列表失败:', error);
		proxy.$modal.msgError('获取数据失败: ' + (error.response?.data?.msg || error.message));
	} finally {
		loading.value = false;
	}
}

// 搜索
function handleQuery() {
	fetchCardList();
}

// 重置
function resetQuery() {
	queryParams.value = {
		pageNum: 1,
		pageSize: 12,
		poolName: '',
		deptName: '',
	};
	fetchCardList();
}

// 刷新
function handleRefresh() {
	fetchCardList();
}

// 格式化流量(MB转换为合适单位)
function formatFlow(flowMB) {
	if (!flowMB || flowMB === 0) return '0 MB';
	if (flowMB < 1024) {
		return flowMB.toFixed(2) + ' MB';
	} else if (flowMB < 1024 * 1024) {
		return (flowMB / 1024).toFixed(2) + ' GB';
	} else {
		return (flowMB / 1024 / 1024).toFixed(2) + ' TB';
	}
}

// 获取流量使用百分比
function getFlowPercentage(pool) {
	if (!pool.totalFlow || pool.totalFlow === 0) return 0;
	return Math.round((pool.useFlow / pool.totalFlow) * 100);
}

// 获取流量进度条颜色
function getFlowColor(pool) {
	const percentage = getFlowPercentage(pool);
	if (percentage < 70) return '#67c23a';
	if (percentage < 90) return '#e6a23c';
	return '#f56c6c';
}
// 前往sim卡列表
function goToSimCardList(poolId) {
	proxy.$router.push({ path: '/business/sim/list', query: { poolId } });
}
// 页面加载时获取数据
onMounted(() => {
	fetchCardList();
});
</script>

<style lang="scss" scoped>
.app-container {
	padding: 20px;
}

.stats-row {
	margin-bottom: 20px;
}

.stats-card {
	transition: all 0.3s;
}

.stats-card:hover {
	transform: translateY(-4px);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stats-item {
	display: flex;
	align-items: center;
	gap: 16px;
}

.stats-icon {
	font-size: 48px;
}

.stats-icon.total {
	color: #409eff;
}

.stats-icon.total-flow {
	color: #67c23a;
}

.stats-icon.used-flow {
	color: #e6a23c;
}

.stats-icon.remain-flow {
	color: #409eff;
}

.stats-content {
	flex: 1;
}

.stats-value {
	font-size: 28px;
	font-weight: 600;
	color: #303133;
	line-height: 1.2;
}

.stats-label {
	font-size: 14px;
	color: #909399;
	margin-top: 4px;
}

.search-card {
	margin-bottom: 20px;
}

.pool-card {
	height: 100%;
	transition: all 0.3s;
}

.pool-card:hover {
	transform: translateY(-4px);
	box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.pool-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.pool-title {
	display: flex;
	align-items: center;
	gap: 8px;
}

.pool-icon {
	font-size: 20px;
	color: #409eff;
}

.pool-name {
	font-size: 16px;
	font-weight: 600;
	color: #303133;
}

.flow-section {
	margin-bottom: 16px;
}

.flow-progress {
	margin-bottom: 16px;
}

.flow-stats {
	display: flex;
	justify-content: space-between;
	gap: 12px;
}

.flow-item {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 10px;
	background: #f5f7fa;
	border-radius: 8px;
}

.flow-label {
	font-size: 16px;
	color: #909399;
	margin-bottom: 4px;
}

.flow-value {
	font-size: 22px;
	font-weight: 600;
}

.flow-value.total {
	color: #409eff;
}

.flow-value.used {
	color: #e6a23c;
}

.flow-value.remain {
	color: #67c23a;
}

.card-stats {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 16px;
}

.stat-item {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 12px;
	background: #f5f7fa;
	border-radius: 8px;
}

.stat-icon {
	font-size: 28px;
}

.stat-icon.active {
	color: #67c23a;
}

.stat-icon.testing {
	color: #909399;
}

.stat-icon.stopped {
	color: #f56c6c;
}

.stat-icon.canceled {
	color: #c0c4cc;
}

.stat-content {
	flex: 1;
}

.stat-label {
	font-size: 12px;
	color: #909399;
	margin-bottom: 2px;
}

.stat-value {
	font-size: 20px;
	font-weight: 600;
	color: #303133;
}

.sync-time {
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 13px;
	color: #909399;
	justify-content: center;
}

.sync-time .el-icon {
	font-size: 14px;
}
</style>
