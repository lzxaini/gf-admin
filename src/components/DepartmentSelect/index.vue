<!--
 * @Author: lzx 1245634367@qq.com
 * @Date: 2026-08-08 22:09:01
 * @LastEditors: lzx 1245634367@qq.com
 * @LastEditTime: 2026-08-08 22:17:50
 * @FilePath: \gf-serverd:\code\GF-code\gf-admin\src\components\DepartmentSelect\index.vue
 * @Description: Fuck Bug
 * 微信：lizx2066
-->
<!--
 * @Description: 支持搜索分页的选择部门组件
 * 用法：
 *   <department-select v-model="form.deptId" placeholder="请选择绑定部门" />
 *   <department-select v-model="form.deptId" @change="handleDeptChange" />
-->
<template>
  <div class="department-select">
    <el-input :model-value="displayName" :placeholder="placeholder" readonly clearable :disabled="disabled"
      class="department-select-input" @clear="handleClear">
      <template #append>
        <el-button :disabled="disabled" @click="openDialog">选择</el-button>
      </template>
    </el-input>

    <el-dialog title="选择部门" v-model="visible" :width="isMobile ? '95%' : '50%'" top="5vh" append-to-body>
      <el-form :inline="true" @submit.prevent>
        <el-form-item label="部门名称">
          <el-input v-model="queryParams.deptName" placeholder="请输入部门名称" clearable style="width: 240px"
            @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
      <el-table ref="deptTableRef" :data="deptList" height="300px" highlight-current-row empty-text="暂无部门数据"
        @row-click="handleRowClick">
        <el-table-column label="选择" width="60" align="center">
          <template #default="scope">
            <el-radio :model-value="selectedId" :value="scope.row.deptId" @change="handleRadioChange(scope.row)" />
          </template>
        </el-table-column>
        <el-table-column label="部门分类" align="center" prop="deptType" width="100">
          <template #default="scope">
            <dict-tag :options="gf_dept_type" :value="scope.row.deptType" />
          </template>
        </el-table-column>
        <el-table-column label="部门名称" prop="deptName" :show-overflow-tooltip="true" />
        <el-table-column label="归属机构" prop="parentName" :show-overflow-tooltip="true" />
        <el-table-column label="状态" prop="status" :show-overflow-tooltip="true">
          <template #default="scope">
            <dict-tag :options="sys_normal_disable" :value="scope.row.status" />
          </template>
        </el-table-column>
      </el-table>
      <div class="dept-select-pagination">
        <el-button size="small" :disabled="queryParams.pageNum <= 1" @click="pageChange(-1)">上一页</el-button>
        <span class="dept-select-page-info">{{ queryParams.pageNum }} / {{ totalPages }}</span>
        <el-button size="small" :disabled="queryParams.pageNum >= totalPages" @click="pageChange(1)">下一页</el-button>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="handleConfirm">确 定</el-button>
          <el-button @click="visible = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="DepartmentSelect">
import { getDept, listDept } from '@/api/system/dept';

const props = defineProps({
  modelValue: {
    type: [Number, String],
    default: null,
  },
  placeholder: {
    type: String,
    default: '请选择部门',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});
const emit = defineEmits(['update:modelValue', 'change']);

const { proxy } = getCurrentInstance();

const visible = ref(false);
const isMobile = ref(false);
const deptList = ref([]);
const deptTotal = ref(0);
const selectedId = ref(null);
const selectedDept = ref(null);
const displayName = ref('');
const deptTableRef = ref(null);

const queryParams = reactive({
  pageNum: 1,
  pageSize: 16,
  deptName: undefined,
});

const { sys_normal_disable, gf_dept_type } = proxy.useDict("sys_normal_disable", "gf_dept_type");

const totalPages = computed(() => Math.max(1, Math.ceil(deptTotal.value / queryParams.pageSize)));

// 回显已选部门名称
watch(
  () => props.modelValue,
  val => {
    if (val == null || val === '') {
      displayName.value = '';
      return;
    }
    getDept(val).then(res => {
      if (res.code === 200 && res.data) {
        displayName.value = res.data.deptName;
      }
    });
  },
  { immediate: true }
);

/** 查询部门列表（分页） */
function getDeptList() {
  listDept({ ...queryParams }).then(res => {
    deptList.value = (res.data && res.data.rows) || [];
    deptTotal.value = (res.data && res.data.total) || 0;
  });
}
/** 搜索 */
function handleQuery() {
  queryParams.pageNum = 1;
  getDeptList();
}
/** 重置 */
function resetQuery() {
  queryParams.deptName = undefined;
  handleQuery();
}
/** 翻页 */
function pageChange(delta) {
  const next = queryParams.pageNum + delta;
  if (next < 1 || next > totalPages.value) return;
  queryParams.pageNum = next;
  getDeptList();
}
/** 选中部门 */
function selectDept(item) {
  selectedId.value = item.deptId;
  selectedDept.value = item;
}
/** 点击行选中 */
function handleRowClick(row) {
  selectDept(row);
}
/** 单选按钮选中 */
function handleRadioChange(row) {
  selectDept(row);
}
/** 打开弹窗 */
function openDialog() {
  if (props.disabled) return;
  selectedId.value = props.modelValue ?? null;
  selectedDept.value = null;
  getDeptList();
  visible.value = true;
}
/** 清空 */
function handleClear() {
  displayName.value = '';
  emit('update:modelValue', null);
  emit('change', null);
}
/** 确定 */
function handleConfirm() {
  if (!selectedId.value) {
    proxy.$modal.msgError('请选择部门');
    return;
  }
  displayName.value = selectedDept.value ? selectedDept.value.deptName : displayName.value;
  emit('update:modelValue', selectedId.value);
  emit('change', selectedDept.value);
  visible.value = false;
}
/** 检测是否为移动端 */
function checkMobile() {
  isMobile.value = window.innerWidth <= 768;
}

onMounted(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);
});
onBeforeUnmount(() => {
  window.removeEventListener('resize', checkMobile);
});
</script>

<style lang="scss" scoped>
.department-select-input {
  width: 100%;
}

.dept-select-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px 0 0;
}

.dept-select-page-info {
  font-size: 13px;
  color: #606266;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .el-form--inline .el-form-item {
    display: block;
    margin-right: 0;
    margin-bottom: 12px;
  }

  .el-form-item__label {
    text-align: left !important;
    padding: 0 !important;
    margin-bottom: 5px;
  }

  .el-form-item__content {
    margin-left: 0 !important;
  }

  .dialog-footer {
    display: flex;
    justify-content: center;
    gap: 10px;
  }
}
</style>
