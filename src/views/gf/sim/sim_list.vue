<!--
 * @Author: 17630921248 1245634367@qq.com
 * @Date: 2026-01-20 13:26:20
 * @LastEditors: 17630921248 1245634367@qq.com
 * @LastEditTime: 2026-02-05 08:41:54
 * @FilePath: \ryv3\src\views\gf\sim\sim_list.vue
 * @Description: 物联网卡管理
 * 微信：lizx2066
-->
<template>
	<div class="app-container">
		<!-- 顶部统计卡片 -->
		<el-row :gutter="20" class="stats-row">
			<el-col :span="6">
				<el-card shadow="hover" class="stats-card">
					<div class="stats-item">
						<el-icon class="stats-icon total"><CreditCard /></el-icon>
						<div class="stats-content">
							<div class="stats-value">{{ totalCards }}</div>
							<div class="stats-label">总卡数</div>
						</div>
					</div>
				</el-card>
			</el-col>
			<el-col :span="6">
				<el-card shadow="hover" class="stats-card">
					<div class="stats-item">
						<el-icon class="stats-icon active"><CircleCheck /></el-icon>
						<div class="stats-content">
							<div class="stats-value">{{ activeCards }}</div>
							<div class="stats-label">已激活</div>
						</div>
					</div>
				</el-card>
			</el-col>
			<el-col :span="6">
				<el-card shadow="hover" class="stats-card">
					<div class="stats-item">
						<el-icon class="stats-icon warning"><WarningFilled /></el-icon>
						<div class="stats-content">
							<div class="stats-value">{{ stoppedCards }}</div>
							<div class="stats-label">已停机</div>
						</div>
					</div>
				</el-card>
			</el-col>
			<el-col :span="6">
				<el-card shadow="hover" class="stats-card">
					<div class="stats-item">
						<el-icon class="stats-icon testing"><Clock /></el-icon>
						<div class="stats-content">
							<div class="stats-value">{{ testingCards }}</div>
							<div class="stats-label">测试期</div>
						</div>
					</div>
				</el-card>
			</el-col>
		</el-row>

		<!-- 搜索和操作区 -->
		<el-card shadow="never" class="search-card">
			<el-form :inline="true" :model="queryParams" class="search-form">
				<el-form-item>
					<el-button type="info" icon="back" @click="goBack">返回</el-button>
				</el-form-item>
				<el-form-item label="ICCID">
					<el-input v-model="queryParams.iccid" placeholder="请输入ICCID" clearable style="width: 300px" @keyup.enter="handleQuery" />
				</el-form-item>
				<el-form-item label="卡状态">
					<el-select v-model="queryParams.cardStatus" placeholder="请选择状态" clearable style="width: 200px">
						<el-option label="已激活" value="已激活" />
						<el-option label="测试期" value="测试期" />
						<el-option label="已停机" value="已停机" />
						<el-option label="已注销" value="已注销" />
					</el-select>
				</el-form-item>
				<el-form-item label="运营商">
					<el-select v-model="queryParams.carrier" placeholder="请选择运营商" clearable style="width: 150px">
						<el-option label="移动" value="移动" />
						<el-option label="联通" value="联通" />
						<el-option label="电信" value="电信" />
					</el-select>
				</el-form-item>
				<el-form-item>
					<el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
					<el-button icon="Refresh" @click="resetQuery">重置</el-button>
					<el-button type="success" icon="Refresh" @click="handleRefresh" :loading="loading">刷新数据</el-button>
				</el-form-item>
			</el-form>
			<div class="toolbar">
				<el-button v-if="false" type="warning" icon="Upload" @click="handleBatchRenewal" :disabled="selectedCards.length === 0">批量续费({{ selectedCards.length }})</el-button>
			</div>
		</el-card>

		<!-- 卡片列表 -->
		<el-card shadow="never" v-loading="loading">
			<el-table :data="cardList" @selection-change="handleSelectionChange" stripe style="width: 100%" align="center">
				<el-table-column type="selection" width="55" />
				<el-table-column prop="iccid" label="ICCID" min-width="200" show-overflow-tooltip />
				<el-table-column prop="cardPhone" label="号码" min-width="130" />
				<el-table-column prop="cardStatus" label="状态" min-width="100">
					<template #default="{ row }">
						<el-tag :type="getStatusType(row.cardStatus)">{{ row.cardStatus }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="deviceStatusName" label="网络状态" min-width="100">
					<template #default="{ row }">
						<el-tag :type="row.deviceStatusName === '开启' ? 'success' : 'danger'">{{ row.deviceStatusName }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="carrier" label="运营商" min-width="80" />
				<el-table-column label="流量使用" min-width="200">
					<template #default="{ row }">
						<div class="flow-info">
							<el-progress :percentage="getFlowPercentage(row)" :color="getFlowColor(row)" :stroke-width="12" />
							<span class="flow-text">{{ row.useDataVolume.toFixed(2) }}M / {{ row.remainingVolume.toFixed(2) }}M</span>
						</div>
					</template>
				</el-table-column>
				<el-table-column prop="flowSpecification" label="流量规格" min-width="150" />
				<el-table-column prop="orgName" label="企业" min-width="120" show-overflow-tooltip />
				<el-table-column prop="startDate" label="激活时间" width="180" />
				<el-table-column prop="expireDate" label="过期时间" width="180">
					<template #default="{ row }">
						<span :class="{ 'expire-warning': isNearExpire(row.expireDate) }">{{ row.expireDate }}</span>
					</template>
				</el-table-column>
				<el-table-column label="操作" width="280" fixed="right">
					<template #default="{ row }">
						<el-button link type="primary" icon="View" @click="handleViewDetail(row)">详情</el-button>
						<el-button v-if="false" link :type="row.deviceStatusName === '开启' ? 'warning' : 'success'" icon="Switch" @click="handleToggleNetwork(row)">
							{{ row.deviceStatusName === '开启' ? '关闭' : '开启' }}网络
						</el-button>
						<el-button v-if="false" link type="warning" icon="Upload" @click="handleRenewal(row)">续费</el-button>
					</template>
				</el-table-column>
			</el-table>

			<!-- 分页 -->
			<el-pagination
				v-model:current-page="queryParams.pageNum"
				v-model:page-size="queryParams.pageSize"
				:total="total"
				:page-sizes="[10, 20, 50, 100]"
				layout="total, sizes, prev, pager, next, jumper"
				@size-change="handleQuery"
				@current-change="handleQuery"
				style="margin-top: 20px"
			/>
		</el-card>

		<!-- 详情对话框 -->
		<el-dialog v-model="detailVisible" title="物联网卡详情" width="600px">
			<el-descriptions :column="2" border v-if="currentCard">
				<el-descriptions-item label="ICCID">{{ currentCard.iccid }}</el-descriptions-item>
				<el-descriptions-item label="IMSI">{{ currentCard.imsi || '-' }}</el-descriptions-item>
				<el-descriptions-item label="IMEI">{{ currentCard.imei || '-' }}</el-descriptions-item>
				<el-descriptions-item label="号码">{{ currentCard.cardPhone }}</el-descriptions-item>
				<el-descriptions-item label="卡状态">
					<el-tag :type="getStatusType(currentCard.cardStatus)">{{ currentCard.cardStatus }}</el-tag>
				</el-descriptions-item>
				<el-descriptions-item label="网络状态">
					<el-tag :type="currentCard.deviceStatusName === '开启' ? 'success' : 'danger'">{{ currentCard.deviceStatusName }}</el-tag>
				</el-descriptions-item>
				<el-descriptions-item label="运营商">{{ currentCard.carrier }}</el-descriptions-item>
				<el-descriptions-item label="企业名称">{{ currentCard.orgName }}</el-descriptions-item>
				<el-descriptions-item label="流量规格">{{ currentCard.flowSpecification }}</el-descriptions-item>
				<el-descriptions-item label="总流量">{{ currentCard.totalDataVolume }}MB</el-descriptions-item>
				<el-descriptions-item label="已用流量">{{ currentCard.useDataVolume.toFixed(2) }}MB</el-descriptions-item>
				<el-descriptions-item label="剩余流量">{{ currentCard.remainingVolume.toFixed(2) }}MB</el-descriptions-item>
				<el-descriptions-item label="激活时间" :span="2">{{ currentCard.startDate }}</el-descriptions-item>
				<el-descriptions-item label="过期时间" :span="2">{{ currentCard.expireDate }}</el-descriptions-item>
				<el-descriptions-item label="沉默结束" :span="2">{{ currentCard.silenceDate }}</el-descriptions-item>
				<el-descriptions-item label="测试期结束" :span="2">{{ currentCard.testingExpireDate }}</el-descriptions-item>
				<el-descriptions-item label="备注" :span="2">{{ currentCard.memo || '-' }}</el-descriptions-item>
			</el-descriptions>
		</el-dialog>
	</div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { CreditCard, CircleCheck, WarningFilled, Clock } from '@element-plus/icons-vue';
import axios from 'axios';

const { proxy } = getCurrentInstance();

// 状态数据
const loading = ref(false);
const cardList = ref([]);
const total = ref(0);
const selectedCards = ref([]);
const detailVisible = ref(false);
const currentCard = ref(null);

// 查询参数
const queryParams = ref({
	pageNum: 1,
	pageSize: 20,
	iccid: '',
	cardStatus: '',
	carrier: '',
});

// API配置
const API_BASE_URL = import.meta.env.DEV ? '/simapi/open/iotCard' : 'https://5giot.cn/prod-api/open/iotCard';
const API_TOKEN =
	'Bearer eyJhbGciOiJIUzUxMiJ9.eyJsb2dpbl91c2VyX2tleSI6IjZlMjJiODQ5LTljM2QtNGUwYS04ZDJlLTAzNWJkZGY4MTg2MCJ9.pAqN73jMrRetPW3tTCiE-d-QTiacIOqwjuOuCkL3XP82y3e-gacFYiQk3S3e3cLV_VjmSHlmj87fiJubfPjGYw'; // 需要配置客户端token

// 统计数据
const totalCards = computed(() => cardList.value.length);
const activeCards = computed(() => cardList.value.filter(card => card.cardStatus === '已激活').length);
const stoppedCards = computed(() => cardList.value.filter(card => card.cardStatus === '已停机').length);
const testingCards = computed(() => cardList.value.filter(card => card.cardStatus === '测试期').length);

// 获取卡列表
async function fetchCardList() {
	loading.value = true;
	try {
		// 1. 先获取ICCID列表
		const listRes = await axios.get(`${API_BASE_URL}/list`, {
			params: { pageNum: queryParams.value.pageNum },
			headers: { Authorization: API_TOKEN },
		});

		if (listRes.data.code !== 200) {
			proxy.$modal.msgError(listRes.data.msg || '获取列表失败');
			return;
		}

		const iccidList = listRes.data.rows || [];
		total.value = listRes.data.total || 0;

		if (iccidList.length === 0) {
			cardList.value = [];
			return;
		}

		// 2. 批量查询详情(每次最多100个)
		const detailRes = await axios.post(
			`${API_BASE_URL}/detail/batch`,
			{ iccidList },
			{
				headers: { Authorization: API_TOKEN },
			}
		);

		if (detailRes.data.code !== 200) {
			proxy.$modal.msgError(detailRes.data.msg || '获取详情失败');
			return;
		}

		let cards = detailRes.data.data || [];

		// 3. 前端过滤
		if (queryParams.value.iccid) {
			cards = cards.filter(card => card.iccid.includes(queryParams.value.iccid));
		}
		if (queryParams.value.cardStatus) {
			cards = cards.filter(card => card.cardStatus === queryParams.value.cardStatus);
		}
		if (queryParams.value.carrier) {
			cards = cards.filter(card => card.carrier === queryParams.value.carrier);
		}

		cardList.value = cards;
	} catch (error) {
		console.error('获取卡列表失败:', error);
		proxy.$modal.msgError('获取数据失败: ' + (error.response?.data?.msg || error.message));
	} finally {
		loading.value = false;
	}
}

// 搜索
function handleQuery() {
	queryParams.value.pageNum = 1;
	fetchCardList();
}

// 重置
function resetQuery() {
	queryParams.value = {
		pageNum: 1,
		pageSize: 20,
		iccid: '',
		cardStatus: '',
		carrier: '',
	};
	fetchCardList();
}

// 刷新
function handleRefresh() {
	fetchCardList();
}

// 查看详情
function handleViewDetail(row) {
	currentCard.value = row;
	detailVisible.value = true;
}

// 切换网络状态
async function handleToggleNetwork(row) {
	const status = row.deviceStatusName === '开启' ? 2 : 1;
	const action = status === 1 ? '开启' : '关闭';

	try {
		await proxy.$modal.confirm(`确认${action}该卡的网络吗？`);

		loading.value = true;
		const res = await axios.post(
			`${API_BASE_URL}/modifyIotCardStatus`,
			{
				iccid: row.iccid,
				status: status,
			},
			{
				headers: { Authorization: API_TOKEN },
			}
		);

		if (res.data.code === 200) {
			proxy.$modal.msgSuccess(`${action}成功`);
			fetchCardList();
		} else {
			proxy.$modal.msgError(res.data.msg || `${action}失败`);
		}
	} catch (error) {
		if (error !== 'cancel') {
			console.error('切换网络失败:', error);
			proxy.$modal.msgError('操作失败: ' + (error.response?.data?.msg || error.message));
		}
	} finally {
		loading.value = false;
	}
}

// 单卡续费
async function handleRenewal(row) {
	try {
		await proxy.$modal.confirm('确认续费该卡一年吗？');

		loading.value = true;
		const res = await axios.post(
			`${API_BASE_URL}/applyForRenewal`,
			{
				iccidList: [row.iccid],
			},
			{
				headers: { Authorization: API_TOKEN },
			}
		);

		if (res.data.code === 200) {
			const data = res.data.data;
			proxy.$modal.msgSuccess(`续费成功！花费: ¥${data.money}，流水号: ${data.transactionNo}`);
			fetchCardList();
		} else {
			proxy.$modal.msgError(res.data.msg || '续费失败');
		}
	} catch (error) {
		if (error !== 'cancel') {
			console.error('续费失败:', error);
			proxy.$modal.msgError('续费失败: ' + (error.response?.data?.msg || error.message));
		}
	} finally {
		loading.value = false;
	}
}

// 批量续费
async function handleBatchRenewal() {
	try {
		await proxy.$modal.confirm(`确认续费选中的 ${selectedCards.value.length} 张卡吗？每张续费一年`);

		loading.value = true;
		const iccidList = selectedCards.value.map(card => card.iccid);

		const res = await axios.post(
			`${API_BASE_URL}/applyForRenewal`,
			{ iccidList },
			{
				headers: { Authorization: API_TOKEN },
			}
		);

		if (res.data.code === 200) {
			const data = res.data.data;
			let message = `续费完成！\n总花费: ¥${data.money}\n流水号: ${data.transactionNo}\n成功: ${data.suceessIccIdList.length}张`;

			if (data.errList && data.errList.length > 0) {
				message += `\n失败: ${data.errList.reduce((sum, err) => sum + err.iccIdList.length, 0)}张`;
			}

			proxy.$modal.msgSuccess(message);
			fetchCardList();
		} else {
			proxy.$modal.msgError(res.data.msg || '批量续费失败');
		}
	} catch (error) {
		if (error !== 'cancel') {
			console.error('批量续费失败:', error);
			proxy.$modal.msgError('批量续费失败: ' + (error.response?.data?.msg || error.message));
		}
	} finally {
		loading.value = false;
	}
}

// 选择变化
function handleSelectionChange(selection) {
	selectedCards.value = selection;
}

// 获取状态类型
function getStatusType(status) {
	const typeMap = {
		已激活: 'success',
		测试期: 'warning',
		已停机: 'danger',
		已注销: 'info',
	};
	return typeMap[status] || 'info';
}

// 获取流量使用百分比
function getFlowPercentage(row) {
	const total = row.useDataVolume + row.remainingVolume;
	if (total === 0) return 0;
	return Math.round((row.useDataVolume / total) * 100);
}

// 获取流量颜色
function getFlowColor(row) {
	const percentage = getFlowPercentage(row);
	if (percentage >= 90) return '#f56c6c';
	if (percentage >= 70) return '#e6a23c';
	return '#67c23a';
}

// 判断是否临近过期(30天内)
function isNearExpire(expireDate) {
	if (!expireDate) return false;
	const expireTime = new Date(expireDate).getTime();
	const now = Date.now();
	const days = (expireTime - now) / (1000 * 60 * 60 * 24);
	return days <= 30 && days > 0;
}

// 返回
function goBack() {
	proxy.$router.back();
}
onMounted(() => {
	// 检查token配置
	if (!API_TOKEN) {
		proxy.$modal.msgWarning('请先配置API Token！在代码中设置 API_TOKEN 变量');
	} else {
		fetchCardList();
	}
});
</script>

<style scoped>
.app-container {
	padding: 20px;
	background: #f0f2f5;
	min-height: calc(100vh - 84px);
}

.stats-row {
	margin-bottom: 20px;
}

.stats-card {
	cursor: pointer;
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

.stats-icon.active {
	color: #67c23a;
}

.stats-icon.warning {
	color: #e6a23c;
}

.stats-icon.testing {
	color: #909399;
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

.search-form {
	margin-bottom: 0;
}

.toolbar {
	display: flex;
	gap: 12px;
	padding-top: 12px;
	border-top: 1px solid #ebeef5;
}

.flow-info {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.flow-text {
	font-size: 12px;
	color: #606266;
}

.expire-warning {
	color: #e6a23c;
	font-weight: 600;
}

:deep(.el-table) {
	font-size: 13px;
}

:deep(.el-pagination) {
	justify-content: center;
}
</style>
