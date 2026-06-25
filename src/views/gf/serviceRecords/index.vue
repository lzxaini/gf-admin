<!--
 * @Author: 17630921248 1245634367@qq.com
 * @Date: 2025-08-08 17:33:14
 * @LastEditors: 17630921248 1245634367@qq.com
 * @LastEditTime: 2026-06-25 10:28:03
 * @FilePath: \gf-servere:\code\gf-admin\src\views\gf\serviceRecords\index.vue
 * @Description: Fuck Bug
 * 微信：lizx2066
-->
<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="100px">
      <el-form-item label="设备识别号" prop="serialNumber">
        <el-input v-model="queryParams.serialNumber" placeholder="请输入设备识别号" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="设备部门" prop="deptName">
        <el-input v-model="queryParams.deptName" placeholder="请输入设备部门" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="时间范围">
        <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期"
          end-placeholder="结束日期" value-format="YYYY-MM-DD" @change="handleDateRangeChange"></el-date-picker>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="warning" plain icon="Download" @click="handleExport"
          v-hasPermi="['gf:serviceRecords:export']">导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <!-- 会话聚合表格 -->
    <el-table v-loading="loading" :data="serviceRecordsList" row-key="sessionId" @expand-change="handleExpandChange">
      <!-- 展开行：查看暂停/恢复明细 -->
      <el-table-column type="expand" width="50">
        <template #default="scope">
          <div v-if="scope.row.detailList && scope.row.detailList.length > 0" class="detail-wrapper">
            <!-- <div class="detail-header">
              <span class="detail-title">暂停/恢复明细（共 {{ scope.row.detailList.length }} 条记录）</span>
            </div> -->
            <el-table :data="scope.row.detailList" size="small" style="width: 100%">
              <el-table-column label="服务内容" align="center" prop="service">
                <template #default="detailScope">
                  <dict-tag :options="gf_service" :value="detailScope.row.service" />
                </template>
              </el-table-column>
              <el-table-column label="服务单号" align="center" prop="code" width="180" />
              <!-- <el-table-column label="运行时长（分）" align="center" prop="runningTime" width="120" /> -->
              <el-table-column label="运行时长（分）" align="center" prop="runningTime" width="120">
                <template #default="scope">
                  <el-tag :type="scope.row.runningTime > 0 ? 'success' : 'info'">
                    {{ scope.row.runningTime }} 分钟
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="服务者" align="center" prop="userName" />
              <el-table-column label="开始时" align="center" prop="startTime" width="180" />
              <el-table-column label="结束时" align="center" prop="endTime" width="180" />
              <!-- <el-table-column label="状态" align="center" prop="status" width="100">
                <template #default="detailScope">
                  <dict-tag :options="iot_device_status" :value="detailScope.row.status" />
                </template>
              </el-table-column> -->
            </el-table>
          </div>
          <div v-else class="detail-wrapper detail-empty">
            <span>暂无详细记录</span>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="服务单号" align="center" prop="code" />
      <el-table-column label="设备识别号" align="center" prop="serialNumber" />
      <el-table-column label="部门" align="center" prop="deptName" />
      <!-- <el-table-column label="服务者" align="center" prop="userName" /> -->
      <!-- <el-table-column label="总运行时长（分）" align="center" prop="totalRunningTime">
        <template #default="scope">
          <el-tag :type="scope.row.totalRunningTime > 0 ? 'success' : 'info'">
            {{ scope.row.totalRunningTime }} 分钟
          </el-tag>
        </template>
      </el-table-column> -->
      <!-- <el-table-column label="暂停次数" align="center" prop="pauseCount">
        <template #default="scope">
          <el-tag v-if="scope.row.pauseCount > 0" type="warning" size="small">
            {{ scope.row.pauseCount }} 次
          </el-tag>
          <span v-else>无暂停</span>
        </template>
      </el-table-column> -->
      <el-table-column label="会话开始" align="center" prop="sessionStart" width="180" />
      <el-table-column label="会话结束" align="center" prop="sessionEnd" width="180">
        <template #default="scope">
          <span>{{ scope.row.sessionEnd || '进行中' }}</span>
        </template>
      </el-table-column>
      <!-- <el-table-column label="状态" align="center" prop="status" width="100">
        <template #default="scope">
          <dict-tag :options="iot_device_status" :value="scope.row.status" />
        </template>
      </el-table-column> -->
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize" @pagination="getList" />
  </div>
</template>

<script setup name="ServiceRecords">
import { listServiceSession, getSessionDetail } from "@/api/gf/serviceRecords";

const { proxy } = getCurrentInstance();
const { iot_device_status, gf_service } = proxy.useDict("iot_device_status", "gf_service");

const serviceRecordsList = ref([]);
const loading = ref(true);
const showSearch = ref(true);
const total = ref(0);
const dateRange = ref([]);

const data = reactive({
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    deptName: null,
    serialNumber: null,
  },
});

const { queryParams } = toRefs(data);

/** 时间范围变更处理 */
function handleDateRangeChange(val) {
  if (val && val.length === 2) {
    queryParams.value.minServiceTime = val[0] + ' 00:00:00';
    queryParams.value.maxServiceTime = val[1] + ' 23:59:59';
  } else {
    queryParams.value.minServiceTime = null;
    queryParams.value.maxServiceTime = null;
  }
}

/** 查询服务会话列表 */
function getList() {
  loading.value = true;
  listServiceSession(queryParams.value).then(response => {
    // 拿到会话数据
    const rows = response.data.rows || [];
    // 初始化 detailList 字段用于展开
    serviceRecordsList.value = rows.map(item => ({
      ...item,
      detailList: undefined  // 未展开时不加载详情
    }));
    total.value = response.data.total;
    loading.value = false;
  });
}

/**
 * 展开/折叠行时加载详细记录
 * @param {Object} row 展开/折叠的行数据
 * @param {Array} expandedRows 当前展开的行数组
 */
function handleExpandChange(row, expandedRows) {
  if (expandedRows && expandedRows.length > 0) {
    // 展开：加载详情
    if (!row.detailList) {
      getSessionDetail(row.sessionId).then(response => {
        row.detailList = response.data || [];
      });
    }
  }
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  dateRange.value = [];
  queryParams.value.minServiceTime = null;
  queryParams.value.maxServiceTime = null;
  proxy.resetForm("queryRef");
  handleQuery();
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('gf/serviceRecords/export', {
    ...queryParams.value
  }, `${queryParams.value.deptName || '全部'}_服务记录_${new Date().getTime()}.xlsx`)
}

getList();
</script>