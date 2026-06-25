<!--
 * @Author: 17630921248 1245634367@qq.com
 * @Date: 2026-06-25 10:31:57
 * @LastEditors: 17630921248 1245634367@qq.com
 * @LastEditTime: 2026-06-25 10:31:58
 * @FilePath: \gf-admin\src\views\gf\statistics\index.vue
 * @Description: Fuck Bug
 * 微信：lizx2066
-->
<template>
  <div class="statistics-page">
    <!-- Hero Header -->
    <!-- <div class="hero-header">
			<div class="hero-content">
				<h1 class="hero-title">数据概览</h1>
				<p class="hero-subtitle">实时业务数据与运营洞察</p>
			</div>
			<el-button class="refresh-btn" :icon="loading ? '' : 'Refresh'" :loading="loading" @click="handleRefresh" circle />
		</div> -->

    <!-- Metrics Grid -->
    <div class="metrics-grid">
      <div class="metric-card" :class="{ 'metric-warning': dashboard.remainingPoints <= 10 }">
        <div class="metric-header">
          <span class="metric-label">点数余额</span>
          <el-icon class="metric-icon" :size="20">
            <Coin />
          </el-icon>
        </div>
        <div class="metric-value">{{ formatNumber(dashboard.remainingPoints) }}</div>
        <div class="metric-unit">pts</div>
        <div v-if="dashboard.remainingPoints <= 10" class="metric-alert">余额不足，请及时充值</div>
      </div>

      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-label">活跃设备</span>
          <el-icon class="metric-icon" :size="20">
            <Monitor />
          </el-icon>
        </div>
        <div class="metric-value">{{ dashboard.activeDeviceCount ?? 0 }}</div>
        <div class="metric-unit">台设备</div>
        <div class="metric-desc">近30天活跃</div>
      </div>

      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-label">今日消耗</span>
          <el-icon class="metric-icon" :size="20">
            <TrendCharts />
          </el-icon>
        </div>
        <div class="metric-value">{{ dashboard.todayConsumedPoints ?? 0 }}</div>
        <div class="metric-unit">pts</div>
        <div class="metric-trend" :class="getTrendClass(dashboard.todayConsumedPointsGrowthRate)">
          <el-icon :size="14">
            <Top v-if="dashboard.todayConsumedPointsGrowthRate >= 0" />
            <Bottom v-else />
          </el-icon>
          {{ Math.abs(formatRate(dashboard.todayConsumedPointsGrowthRate)) }}% vs 昨日
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-label">今日充值</span>
          <el-icon class="metric-icon" :size="20">
            <Wallet />
          </el-icon>
        </div>
        <div class="metric-value">{{ dashboard.todayRechargeAmount ?? 0 }}</div>
        <div class="metric-unit">pts</div>
        <div class="metric-trend" :class="getTrendClass(dashboard.todayRechargeAmountGrowthRate)">
          <el-icon :size="14">
            <Top v-if="dashboard.todayRechargeAmountGrowthRate >= 0" />
            <Bottom v-else />
          </el-icon>
          {{ Math.abs(formatRate(dashboard.todayRechargeAmountGrowthRate)) }}% vs 昨日
        </div>
      </div>
    </div>

    <!-- Service Ratios Section -->
    <div class="section-card">
      <div class="section-header">
        <h2 class="section-title">项目消耗分析</h2>
        <el-tag size="small" effect="plain">实时数据</el-tag>
      </div>

      <div class="service-grid">
        <div v-for="(item, idx) in dashboard.todayServiceRatios || []" :key="idx" class="service-item">
          <div class="service-header">
            <span class="service-name">{{ serviceName(item.serviceType) }}</span>
            <span class="service-percentage">{{ item.ratio }}%</span>
          </div>
          <div class="service-stats">
            <span class="service-count">{{ item.count }} 次</span>
          </div>
          <div class="service-bar">
            <div class="service-bar-fill" :style="{ width: Math.min(item.ratio, 100) + '%' }" />
          </div>
        </div>
      </div>

      <div class="section-footer">
        <span class="footer-label">总消耗</span>
        <span class="footer-value">{{ sumRatios() }} pts</span>
      </div>
    </div>

    <!-- Stores Table Section -->
    <div class="section-card">
      <div class="section-header">
        <h2 class="section-title">机构点数明细</h2>
        <div>
          <el-input v-model="searchName" placeholder="搜索机构名称" clearable class="search-input" prefix-icon="Search"
            @clear="onSearchClear" @input="onSearchChange" />
          <el-button type="primary" class="refresh-btn" style="margin-left: 20px;" :icon="loading ? '' : 'Refresh'"
            :loading="loading" @click="handleRefresh" circle />
        </div>
      </div>

      <el-table v-loading="loadingStores" :data="stores" class="data-table"
        :header-cell-style="{ background: '#fafafa', color: '#1d1d1f', fontWeight: '600', fontSize: '14px' }">
        <el-table-column prop="deptName" label="机构名称" min-width="220">
          <template #default="{ row }">
            <div class="cell-name">{{ row.deptName }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="accountBalance" label="剩余点数" width="160" align="right">
          <template #default="{ row }">
            <div class="cell-balance" :class="{ 'balance-low': row.accountBalance < 10 }">{{
              formatNumber(row.accountBalance) }} pts</div>
          </template>
        </el-table-column>
        <el-table-column prop="total" label="累计充值" width="160" align="right">
          <template #default="{ row }">
            <div class="cell-total">{{ formatNumber(row.total) }} pts</div>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination background v-model:current-page="pageNum" v-model:page-size="pageSize"
          :page-sizes="[6, 12, 24, 48]" :total="total" layout="total, sizes, prev, pager, next, jumper"
          @current-change="handlePageChange" @size-change="handleSizeChange" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { getDashboardApi, getUserExtendListApi } from '@/api/gf/device';
import { Coin, Monitor, TrendCharts, Wallet, Top, Bottom } from '@element-plus/icons-vue';

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

function getTrendClass(rate) {
  if (!rate) return 'trend-neutral';
  return rate >= 0 ? 'trend-up' : 'trend-down';
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

function handlePageChange(page) {
  fetchStores(page, pageSize.value);
}

function handleSizeChange(size) {
  fetchStores(1, size);
}

onMounted(() => {
  handleRefresh();
});
</script>

<style lang="scss" scoped>
// Design tokens
$primary-color: #0066cc;
$ink: #1d1d1f;
$body-muted: #86868b;
$canvas: #ffffff;
$canvas-parchment: #f5f5f7;
$surface-pearl: #fafafa;
$divider: #e5e5e7;
$success: #30d158;
$warning: #ff9f0a;
$danger: #ff3b30;

$spacing-sm: 12px;
$spacing-md: 16px;
$spacing-lg: 24px;
$spacing-xl: 32px;
$spacing-xxl: 48px;

$rounded-sm: 8px;
$rounded-md: 12px;
$rounded-lg: 16px;
$rounded-xl: 20px;

// Base styles
.statistics-page {
  min-height: 100vh;
  // background: $canvas-parchment;
  // padding: $spacing-xl $spacing-lg;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif;
}

// Hero Header
.hero-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-xl;
  padding-bottom: $spacing-lg;
  border-bottom: 1px solid $divider;

  .hero-content {
    flex: 1;
  }

  .hero-title {
    font-size: 32px;
    font-weight: 600;
    color: $ink;
    margin: 0 0 4px;
    letter-spacing: -0.5px;
  }

  .hero-subtitle {
    font-size: 17px;
    font-weight: 400;
    color: $body-muted;
    margin: 0;
  }

  .refresh-btn {
    width: 44px;
    height: 44px;
    background: $canvas;
    border: 1px solid $divider;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      transform: scale(1.05);
      border-color: $primary-color;
      color: $primary-color;
    }

    &:active {
      transform: scale(0.95);
    }
  }
}

// Metrics Grid
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: $spacing-md;
  margin-bottom: $spacing-xl;
}

.metric-card {
  background: $canvas;
  border-radius: $rounded-lg;
  padding: $spacing-lg;
  border: 1px solid $divider;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    border-color: rgba(0, 102, 204, 0.2);
  }

  &.metric-warning {
    background: linear-gradient(135deg, #fff5f5 0%, #ffffff 100%);
    border-color: rgba(255, 59, 48, 0.2);
  }

  .metric-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-sm;
  }

  .metric-label {
    font-size: 14px;
    font-weight: 500;
    color: $body-muted;
    letter-spacing: -0.2px;
  }

  .metric-icon {
    color: $primary-color;
    opacity: 0.6;
  }

  .metric-value {
    font-size: 36px;
    font-weight: 600;
    color: $ink;
    line-height: 1.1;
    margin: 4px 0;
    letter-spacing: -1px;
  }

  .metric-unit {
    font-size: 13px;
    font-weight: 400;
    color: $body-muted;
    margin-bottom: 8px;
  }

  .metric-desc {
    font-size: 12px;
    color: $body-muted;
    margin-top: 4px;
  }

  .metric-alert {
    font-size: 12px;
    color: $danger;
    font-weight: 500;
    margin-top: 8px;
    padding: 6px 10px;
    background: rgba(255, 59, 48, 0.1);
    border-radius: 6px;
  }

  .metric-trend {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    font-weight: 500;
    margin-top: 8px;

    &.trend-up {
      color: $success;
    }

    &.trend-down {
      color: $danger;
    }

    &.trend-neutral {
      color: $body-muted;
    }
  }
}

// Section Card
.section-card {
  background: $canvas;
  border-radius: $rounded-xl;
  padding: $spacing-xl;
  margin-bottom: $spacing-lg;
  border: 1px solid $divider;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-lg;
    padding-bottom: $spacing-md;
    border-bottom: 1px solid $divider;
  }

  .section-title {
    font-size: 21px;
    font-weight: 600;
    color: $ink;
    margin: 0;
    letter-spacing: -0.3px;
  }

  .section-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: $spacing-lg;
    padding-top: $spacing-md;
    border-top: 1px solid $divider;

    .footer-label {
      font-size: 14px;
      color: $body-muted;
      font-weight: 500;
    }

    .footer-value {
      font-size: 17px;
      color: $ink;
      font-weight: 600;
    }
  }
}

// Service Grid
.service-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: $spacing-md;
}

.service-item {
  padding: $spacing-md;
  background: $surface-pearl;
  border-radius: $rounded-md;
  transition: all 0.2s ease;

  &:hover {
    background: #f0f0f2;
  }

  .service-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }

  .service-name {
    font-size: 15px;
    font-weight: 500;
    color: $ink;
  }

  .service-percentage {
    font-size: 17px;
    font-weight: 600;
    color: $primary-color;
  }

  .service-stats {
    margin-bottom: 10px;
  }

  .service-count {
    font-size: 13px;
    color: $body-muted;
  }

  .service-bar {
    height: 6px;
    background: #e5e5e7;
    border-radius: 3px;
    overflow: hidden;
  }

  .service-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, $primary-color 0%, #0077ed 100%);
    border-radius: 3px;
    transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  }
}

// Search Input
.search-input {
  width: 320px;

  :deep(.el-input__wrapper) {
    border-radius: 20px;
    border: 1px solid $divider;
    box-shadow: none;
    transition: all 0.2s ease;

    &:hover {
      border-color: rgba(0, 102, 204, 0.3);
    }

    &.is-focus {
      border-color: $primary-color;
      box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
    }
  }

  :deep(.el-input__inner) {
    font-size: 14px;
  }
}

// Data Table
.data-table {
  :deep(.el-table__header-wrapper) {
    border-radius: $rounded-sm $rounded-sm 0 0;
  }

  :deep(.el-table__body tr) {
    transition: background-color 0.2s ease;

    &:hover {
      background-color: $surface-pearl !important;
    }
  }

  :deep(.el-table td),
  :deep(.el-table th) {
    border-bottom: 1px solid #f0f0f0;
  }

  .cell-name {
    font-size: 15px;
    font-weight: 500;
    color: $ink;
  }

  .cell-balance {
    font-size: 15px;
    font-weight: 600;
    color: $ink;

    &.balance-low {
      color: $danger;
    }
  }

  .cell-total {
    font-size: 15px;
    color: $body-muted;
  }
}

// Pagination
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: $spacing-lg;
  padding-top: $spacing-md;
  border-top: 1px solid $divider;

  :deep(.el-pagination) {

    .btn-prev,
    .btn-next,
    .el-pager li {
      border-radius: 6px;
      border: 1px solid $divider;
      min-width: 32px;
      height: 32px;
      line-height: 30px;
      font-size: 13px;
      transition: all 0.2s ease;

      &:hover {
        border-color: $primary-color;
        color: $primary-color;
      }

      &.is-active {
        background: $primary-color;
        border-color: $primary-color;
        color: white;
      }
    }
  }
}

// Responsive Design
@media (max-width: 768px) {
  .statistics-page {
    // padding: $spacing-md;
  }

  .hero-header {
    flex-direction: column;
    align-items: flex-start;
    gap: $spacing-md;

    .refresh-btn {
      align-self: flex-end;
    }
  }

  .hero-title {
    font-size: 24px !important;
  }

  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .service-grid {
    grid-template-columns: 1fr;
  }

  .section-card {
    padding: $spacing-lg;
  }

  .search-input {
    width: 100%;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start !important;
    gap: $spacing-sm;
  }

  .pagination-wrap {
    justify-content: center;

    :deep(.el-pagination) {
      flex-wrap: wrap;
      justify-content: center;
    }
  }
}

@media (max-width: 480px) {
  .metric-value {
    font-size: 28px !important;
  }

  .data-table {
    :deep(.el-table__body-wrapper) {
      overflow-x: auto;
    }
  }
}
</style>
