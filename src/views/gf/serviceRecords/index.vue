<!--
 * @Author: 17630921248 1245634367@qq.com
 * @Date: 2025-08-08 17:33:14
 * @LastEditors: lzx 1245634367@qq.com
 * @LastEditTime: 2026-06-29 20:52:35
 * @FilePath: \gf-admin\src\views\gf\serviceRecords\index.vue
 * @Description: Fuck Bug
 * 微信：lizx2066
-->
<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="100px">
      <el-form-item label="设备识别号" prop="serialNumber">
        <el-input v-model="queryParams.serialNumber" placeholder="请输入设备识别号" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <!-- <el-form-item label="设备部门" prop="deptName">
        <el-input v-model="queryParams.deptName" placeholder="请输入设备部门" @keyup.enter="handleQuery" />
      </el-form-item> -->
      <el-form-item label="归属部门" prop="deptId">
        <el-tree-select v-model="queryParams.deptId" :data="deptOptions" filterable
          :props="{ value: 'id', label: 'label', children: 'children' }" value-key="id" placeholder="请选择设备归属部门"
          check-strictly style="width: 300px" clearable />
      </el-form-item>
      <el-form-item label="时间范围">
        <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期"
          end-placeholder="结束日期" value-format="YYYY-MM-DD" @change="handleDateRangeChange"></el-date-picker>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        <!-- <el-icon icon="WarningFilled" circle type="warning"/> -->
        <el-tooltip effect="dark" content="导出系统全部服务记录，时间范围不能超过7天，查询则不能超过30天，指定部门或者设备后，导出和查询均不受时间限制！ " placement="top">
          <el-icon size="20px" color="#e6a23c" style="margin-left: 20px;cursor: pointer;">
            <WarningFilled />
          </el-icon>
        </el-tooltip>
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
import { dayjs } from 'element-plus'
import { listServiceSession, getSessionDetail } from "@/api/gf/serviceRecords";
import { deptTreeSelect } from "@/api/system/user";

const { proxy } = getCurrentInstance();
const { iot_device_status, gf_service } = proxy.useDict("iot_device_status", "gf_service");

const serviceRecordsList = ref([]);
const loading = ref(true);
const showSearch = ref(true);
const deptOptions = ref(undefined);
const total = ref(0);
// 计算近7天的日期范围
function getDefaultDateRange() {
  return [dayjs().subtract(7, 'day').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')];
}

const dateRange = ref(getDefaultDateRange());

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
  // 如果指定了部门或设备识别号，则不限制时间范围
  const hasFilter = queryParams.value.deptId || queryParams.value.serialNumber;
  if (!hasFilter) {
    if (!dateRange.value || dateRange.value.length !== 2) {
      proxy.$modal.msgWarning('查询全部服务记录，请先选择时间范围（最多30天）！');
      return;
    }
    const diffDays = dayjs(dateRange.value[1]).diff(dayjs(dateRange.value[0]), 'day');
    if (diffDays > 31) {
      proxy.$modal.msgWarning('查询全部服务记录，时间范围不能超过30天，请重新选择！');
      return;
    }
  }
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  dateRange.value = getDefaultDateRange();
  handleDateRangeChange(dateRange.value);
  proxy.resetForm("queryRef");
  handleQuery();
}

/** 导出按钮操作 */
function handleExport() {
  // 如果指定了部门或设备识别号，则不限制时间范围
  const hasFilter = queryParams.value.deptId || queryParams.value.serialNumber;
  if (!hasFilter) {
    if (!dateRange.value || dateRange.value.length !== 2) {
      proxy.$modal.msgWarning('查询系统全部数据，请先选择时间范围（最多30天）');
      return;
    }
    const diffDays = dayjs(dateRange.value[1]).diff(dayjs(dateRange.value[0]), 'day');
    if (diffDays > 30) {
      proxy.$modal.msgWarning('导出系统全部数据时间范围不能超过30天，请重新选择');
      return;
    }
  } else if (!dateRange.value || dateRange.value.length !== 2) {
    proxy.$modal.msgWarning('请选择时间范围');
    return;
  }
  const fileName = queryParams.value.serialNumber
    ? `${queryParams.value.serialNumber}_服务记录_${new Date().getTime()}.xlsx`
    : (queryParams.value.deptName || '全部') + `_服务记录_${new Date().getTime()}.xlsx`;
  proxy.download('gf/serviceRecords/export', {
    ...queryParams.value
  }, fileName)
}

/** 查询部门下拉树结构 */
function getDeptTree() {
  deptTreeSelect().then(response => {
    deptOptions.value = response.data;
  });
};
// 初始化默认时间范围查询参数
handleDateRangeChange(dateRange.value);
getDeptTree();
getList();
</script>