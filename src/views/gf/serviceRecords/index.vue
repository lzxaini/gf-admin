<!--
 * @Author: 17630921248 1245634367@qq.com
 * @Date: 2025-08-08 17:33:14
 * @LastEditors: 17630921248 1245634367@qq.com
 * @LastEditTime: 2025-12-08 08:07:08
 * @FilePath: \ryv3\src\views\gf\serviceRecords\index.vue
 * @Description: Fuck Bug
 * 微信：lizx2066
-->
<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="100px">
      <el-form-item label="服务单号" prop="code">
        <el-input v-model="queryParams.code" placeholder="请输入服务单号" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="设备识别号" prop="serialNumber">
        <el-input v-model="queryParams.serialNumber" placeholder="请输入设备识别号" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="设备部门" prop="deptName">
        <el-input v-model="queryParams.deptName" placeholder="请输入设备部门" clearable @keyup.enter="handleQuery" />
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

    <el-table v-loading="loading" :data="serviceRecordsList">
      <el-table-column label="服务单号" align="center" prop="code" />
      <el-table-column label="服务内容" align="center" prop="service">
        <template #default="scope">
          <dict-tag :options="gf_service" :value="scope.row.service" />
        </template>
      </el-table-column>
      <el-table-column label="设备识别号" align="center" prop="serialNumber" />
      <el-table-column label="部门" align="center" prop="deptName" />
      <el-table-column label="服务者" align="center" prop="userName" />
      <el-table-column label="服务时长（分）" align="center" prop="runningTime" />
      <el-table-column label="开始时间" align="center" prop="startTime" width="180">
        <template #default="scope">
          <span>{{ scope.row.startTime }}</span>
        </template>
      </el-table-column>
      <el-table-column label="结束时间" align="center" prop="endTime" width="180">
        <template #default="scope">
          <span>{{ scope.row.endTime }}</span>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize" @pagination="getList" />
  </div>
</template>

<script setup name="ServiceRecords">
import { listServiceRecords } from "@/api/gf/serviceRecords";

const { proxy } = getCurrentInstance();
const { iot_device_status, gf_service } = proxy.useDict("iot_device_status", "gf_service");

const serviceRecordsList = ref([]);
const loading = ref(true);
const showSearch = ref(true);
const total = ref(0);
const title = ref("");

const data = reactive({
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    deptName: null,
    code: null,
    serialNumber: null,
    status: null,
  },
});

const { queryParams } = toRefs(data);

/** 查询服务记录列表 */
function getList() {
  loading.value = true;
  listServiceRecords(queryParams.value).then(response => {
    serviceRecordsList.value = response.data.rows;
    total.value = response.data.total;
    loading.value = false;
  });
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
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