<!--
 * @Author: 17630921248 1245634367@qq.com
 * @Date: 2025-08-08 17:48:56
 * @LastEditors: 17630921248 1245634367@qq.com
 * @LastEditTime: 2025-08-08 17:58:14
 * @FilePath: \ryv3\src\views\gf\rechargeRecords\index.vue
 * @Description: Fuck Bug
 * 微信：lizx2066
-->
<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item>
        <el-form-item label="充值门店" prop="deptName">
          <el-input v-model="queryParams.deptName" placeholder="请输入充值门店" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="warning" plain icon="Download" @click="handleExport"
          v-hasPermi="['gf:rechargeRecords:export']">导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="rechargeRecordsList">
      <el-table-column label="充值门店" align="center" prop="deptName" />
      <el-table-column label="上期结余" align="center" prop="previousBalance" />
      <el-table-column label="当前结余" align="center" prop="currentBalance" />
      <el-table-column label="本次充值" align="center" prop="rechargeAmount" />
      <el-table-column label="充值时间" align="center" prop="createTime" width="180">
        <template #default="scope">
          <span>{{ scope.row.createTime }}</span>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize" @pagination="getList" />
  </div>
</template>

<script setup name="RechargeRecords">
import { listRechargeRecords } from "@/api/gf/rechargeRecords";

const { proxy } = getCurrentInstance();

const rechargeRecordsList = ref([]);
const loading = ref(true);
const showSearch = ref(true);
const total = ref(0);

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    deptName: null,
  },
  rules: {
  }
});

const { queryParams } = toRefs(data);

/** 查询充值记录列表 */
function getList() {
  loading.value = true;
  listRechargeRecords(queryParams.value).then(response => {
    rechargeRecordsList.value = response.data.rows;
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
  proxy.download('gf/rechargeRecords/export', {
    ...queryParams.value
  }, `rechargeRecords_${new Date().getTime()}.xlsx`)
}

getList();
</script>
