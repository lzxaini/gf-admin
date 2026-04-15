<!--
 * @Author: 17630921248 1245634367@qq.com
 * @Date: 2026-04-15 14:23:04
 * @LastEditors: 17630921248 1245634367@qq.com
 * @LastEditTime: 2026-04-15 14:49:38
 * @FilePath: \ryv3\src\views\gf\statistics\index.vue
 * @Description: 统计页面 - 仿小程序样式的仪表盘展示
 * 微信：lizx2066
-->
<template>
	<div class="statistics_container">
		<!-- 顶部标题 -->
		<el-row class="header_row" type="flex" justify="space-between" align="middle">
			<el-col>
				<h3 class="page_title">统计数据</h3>
			</el-col>
			<el-col>
				<el-button type="text" @click="handleRefresh" :loading="loading">刷新</el-button>
			</el-col>
		</el-row>

		<!-- 关键指标卡片 -->
		<el-row :gutter="16" class="grid_box">
			<el-col :xs="24" :sm="12" :lg="6">
				<el-card class="item_box blue" shadow="hover">
					<div class="icon_wrap"><i class="s_icon s_1" /></div>
					<div class="title">总点数余额</div>
					<div class="content" :class="{ danger: dashboard.remainingPoints <= 10 }">{{ formatNumber(dashboard.remainingPoints) }}</div>
					<div class="tips">pts · 未消耗余额</div>
				</el-card>
			</el-col>

			<el-col :xs="24" :sm="12" :lg="6">
				<el-card class="item_box" shadow="hover">
					<div class="icon_wrap"><i class="s_icon s_2" /></div>
					<div class="title">设备活跃数</div>
					<div class="content">{{ dashboard.activeDeviceCount ?? 0 }}</div>
					<div class="tips">台 · 近30天活跃</div>
				</el-card>
			</el-col>

			<el-col :xs="24" :sm="12" :lg="6">
				<el-card class="item_box" shadow="hover">
					<div class="icon_wrap"><i class="s_icon s_3" /></div>
					<div class="title">今日消耗点数</div>
					<div class="content">{{ dashboard.todayConsumedPoints ?? 0 }}</div>
					<div class="tips tips_c_1"><i class="tips_icon line_g" /> {{ formatRate(dashboard.todayConsumedPointsGrowthRate) }}% vs 昨日</div>
				</el-card>
			</el-col>

			<el-col :xs="24" :sm="12" :lg="6">
				<el-card class="item_box" shadow="hover">
					<div class="icon_wrap"><i class="s_icon s_4" /></div>
					<div class="title">今日充值点数</div>
					<div class="content">{{ dashboard.todayRechargeAmount ?? 0 }}</div>
					<div class="tips tips_c_2"><i class="tips_icon line_p" /> {{ formatRate(dashboard.todayRechargeAmountGrowthRate) }}% vs 昨日</div>
				</el-card>
			</el-col>
		</el-row>

		<!-- 项目消耗占比 -->
		<el-card class="obj_info" shadow="always">
			<div class="header_box">
				<div class="page_title">项目消耗占比</div>
				<el-button type="text" size="small">实时</el-button>
			</div>
			<el-row :gutter="12" class="ratio_list">
				<el-col :xs="24" :sm="12" :md="8" v-for="(item, idx) in dashboard.todayServiceRatios || []" :key="idx">
					<div class="ratio_item">
						<div class="label">{{ serviceName(item.serviceType) }}</div>
						<div class="value">{{ item.ratio }}%</div>
						<el-progress :percentage="Math.min(item.ratio, 100)" :stroke-width="10" status="active" />
					</div>
				</el-col>
			</el-row>
			<div class="footer_tips">总消耗：{{ sumRatios() }} pts</div>
		</el-card>

		<!-- 实时点数（门店列表） -->
		<el-card class="dep_info" shadow="always">
			<div class="header_box">
				<div class="page_title">实时点数</div>
				<el-input v-model="searchName" placeholder="搜索机构" clearable size="small" class="search_input" @clear="onSearchClear" @input="onSearchChange" />
			</div>

			<el-table v-loading="loadingStores" :data="stores" stripe style="width: 100%">
				<el-table-column prop="deptName" label="机构名称" min-width="220">
					<template #default="{ row }">
						<div class="textOverflow">{{ row.deptName }}</div>
					</template>
				</el-table-column>
				<el-table-column prop="accountBalance" label="剩余点数" width="160">
					<template #default="{ row }">
						<div :class="row.accountBalance < 10 ? 'danger' : ''">{{ formatNumber(row.accountBalance) }}</div>
					</template>
				</el-table-column>
				<el-table-column prop="total" label="累计充值" width="160">
					<template #default="{ row }">
						{{ formatNumber(row.total) }}
					</template>
				</el-table-column>
			</el-table>

			<div class="pagination_wrap" style="margin-top: 12px; display: flex; justify-content: flex-end">
				<el-pagination
					background
					:current-page.sync="pageNum"
					:page-size.sync="pageSize"
					:page-sizes="[6, 12, 24, 48]"
					:total="total"
					layout="total, sizes, prev, pager, next, jumper"
					@current-change="handlePageChange"
					@size-change="handleSizeChange"
				/>
			</div>
		</el-card>
	</div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { getDashboardApi, getUserExtendListApi } from '@/api/gf/device';

const loading = ref(false);
const dashboard = ref({});
const stores = ref([]);
const searchName = ref('');

// paging for stores
const loadingStores = ref(false);
const pageNum = ref(1);
const pageSize = ref(12);
const total = ref(0);

function formatNumber(v) {
	if (v == null) return 0;
	if (typeof v === 'number') return Number(v).toFixed(2).replace(/\.00$/, '');
	return v;
}

function formatRate(v) {
	if (v == null) return 0;
	return Number(v).toFixed(2).replace(/\.00$/, '');
}

function serviceName(type) {
	// 简单映射，可按实际业务调整
	const map = {
		0: '其他服务',
		1: '脸部护理',
		2: '身体护理',
		3: '眼部方案',
		4: '激活导入',
		5: '水滴渗透',
	};
	return map[type] || '类型' + type;
}

function sumRatios() {
	return (dashboard.value.todayServiceRatios || []).reduce((s, it) => s + (Number(it.ratio) || 0), 0).toFixed(2);
}

const filteredStores = computed(() => {
	if (!searchName.value) return stores.value;
	return stores.value.filter(s => (s.deptName || '').toLowerCase().includes(searchName.value.toLowerCase()));
});

async function fetchDashboard() {
	loading.value = true;
	try {
		const res = await getDashboardApi();
		if (res && res.data) dashboard.value = res.data;
	} catch (e) {
		console.error('getDashboardApi error', e);
	} finally {
		loading.value = false;
	}
}

async function fetchStores(pn = pageNum.value, ps = pageSize.value) {
	loadingStores.value = true;
	try {
		const params = { pageNum: pn, pageSize: ps };
		if (searchName.value) params.deptName = searchName.value;
		const res = await getUserExtendListApi(params);
		if (res && res.data) {
			stores.value = res.data.rows || [];
			total.value = res.data.total || 0;
			pageNum.value = pn;
			pageSize.value = ps;
		}
	} catch (e) {
		console.error('getUserExtendListApi error', e);
	} finally {
		loadingStores.value = false;
	}
}

function onSearchChange() {
	// trigger server search
	pageNum.value = 1;
	fetchStores(1, pageSize.value);
}
function onSearchClear() {
	searchName.value = '';
	pageNum.value = 1;
	fetchStores(1, pageSize.value);
}

function handleRefresh() {
	fetchDashboard();
	fetchStores(pageNum.value, pageSize.value);
}

onMounted(() => {
	handleRefresh();
});

function handlePageChange(page) {
	fetchStores(page, pageSize.value);
}

function handleSizeChange(size) {
	fetchStores(1, size);
}
</script>

<style scoped lang="scss">
.statistics_container {
	padding: 16px;
}
.header_row {
	margin-bottom: 12px;
}
.page_title {
	font-size: 18px;
	margin: 0;
}
.grid_box {
	margin-bottom: 16px;
}
.item_box {
	padding: 16px;
	min-height: 120px;
	position: relative;
	.icon_wrap {
		position: absolute;
		top: 12px;
		right: 12px;
	}
	.title {
		color: #666;
		margin-top: 6px;
	}
	.content {
		font-size: 20px;
		font-weight: 700;
		margin: 8px 0;
	}
	.tips {
		font-size: 12px;
		color: rgba(0, 0, 0, 0.45);
	}
	.tips_c_1,
	.item_box .tips_c_2 {
		display: flex;
		align-items: center;
		gap: 6px;
	}
}
/* .item_box.blue { background: linear-gradient(90deg, #3b8eff 0%, #66b3ff 100%); color: #fff; } */
.ratio_list {
	margin-top: 12px;
}
.ratio_item {
	padding: 8px;
	background: #fff;
	border-radius: 6px;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}
.footer_tips {
	margin-top: 8px;
	color: #909399;
}
.dep_info {
	margin-top: 16px;
}
.header_box {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 12px;
}
.search_input {
	max-width: 320px;
}
.table_header_row {
	display: flex;
	gap: 12px;
	padding: 8px 12px;
	background: #fafafa;
	border-radius: 6px;
	margin-bottom: 8px;
}
.table_header_row .cell {
	flex: 1;
	font-weight: 600;
}
.table_header_row .cell-big {
	flex: 2;
}
.store_list {
	display: block;
}
.table-row {
	display: flex;
	gap: 12px;
	padding: 12px;
	align-items: center;
	border-bottom: 1px solid #f0f0f0;
}
.table-row .cell {
	flex: 1;
}
.table-row .cell-big {
	flex: 2;
}
.textOverflow {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.number-cell {
	display: flex;
	align-items: center;
}
.danger {
	color: #d54941;
}
</style>
