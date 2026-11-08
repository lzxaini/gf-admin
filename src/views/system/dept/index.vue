<template>
	<div class="app-container">
		<el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
			<el-form-item label="部门名称" prop="deptName">
				<el-input v-model="queryParams.deptName" placeholder="请输入部门名称" clearable style="width: 200px"
					@keyup.enter="handleQuery" />
			</el-form-item>
			<el-form-item label="状态" prop="status">
				<el-select v-model="queryParams.status" placeholder="部门状态" clearable style="width: 200px">
					<el-option v-for="dict in sys_normal_disable" :key="dict.value" :label="dict.label" :value="dict.value" />
				</el-select>
			</el-form-item>
			<el-form-item>
				<el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
				<el-button icon="Refresh" @click="resetQuery">重置</el-button>
			</el-form-item>
		</el-form>

		<el-row :gutter="10" class="mb8">
			<!-- <el-col :span="1.5">
            <el-button type="primary" plain icon="Plus" @click="handleAdd"
               v-hasPermi="['system:dept:add']">新增</el-button>
         </el-col> -->
			<el-col :span="1.5">
				<el-button type="info" plain icon="Sort" @click="toggleExpandAll">展开/折叠</el-button>
			</el-col>
			<right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
		</el-row>

		<el-table v-if="refreshTable" v-loading="loading" :data="deptList" row-key="deptId"
			:default-expand-all="isExpandAll" :tree-props="{ children: 'children', hasChildren: 'hasChildren' }">
			<el-table-column prop="deptName" label="部门名称" width="260"></el-table-column>
			<el-table-column label="部门分类" align="center" prop="deptType">
				<template #default="scope">
					<dict-tag :options="gf_dept_type" :value="scope.row.deptType" />
				</template>
			</el-table-column>
			<el-table-column prop="parentName" label="归属机构" width="260"></el-table-column>
			<!-- <el-table-column prop="orderNum" label="排序"></el-table-column> -->
			<el-table-column prop="status" label="状态">
				<template #default="scope">
					<dict-tag :options="sys_normal_disable" :value="scope.row.status" />
				</template>
			</el-table-column>
			<el-table-column prop="leader" label="管理员" />
			<el-table-column label="创建时间" align="center" prop="createTime" width="200">
				<template #default="scope">
					<span>{{ parseTime(scope.row.createTime) }}</span>
				</template>
			</el-table-column>
			<el-table-column label="操作" align="center" class-name="small-padding fixed-width">
				<template #default="scope">
					<div v-if="scope.row.deptName !== '游客部门'">
						<el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)"
							v-hasPermi="['system:dept:edit']">修改</el-button>
						<el-button link type="primary" icon="Connection" @click="openSelectUser(scope.row)"
							v-hasPermi="['system:dept:edit']">绑定</el-button>
						<el-button link type="primary" icon="Wallet" @click="rechargeDialog(scope.row)"
							v-hasPermi="['system:dept:edit']">充值</el-button>
						<el-button link type="primary" icon="Plus" @click="handleAdd(scope.row)"
							v-hasPermi="['system:dept:add']">新增</el-button>
						<el-button v-if="scope.row.parentId != 0" link type="primary" icon="Delete" @click="handleDelete(scope.row)"
							v-hasPermi="['system:dept:remove']">删除</el-button>
					</div>
				</template>
			</el-table-column>
		</el-table>
		<pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
			v-model:limit="queryParams.pageSize" @pagination="getList" />
		<!-- 添加或修改部门对话框 -->
		<el-dialog :title="title" v-model="open" :width="isMobile ? '95%' : '600px'" append-to-body>
			<el-form ref="deptRef" :model="form" :rules="rules" :label-width="isMobile ? '70px' : '80px'">
				<el-row>
					<el-col :span="24" v-if="form.parentId !== 0 && title !== '修改部门'">
						<el-form-item label="上级部门" prop="parentId">
							<el-tree-select v-model="form.parentId" :data="deptOptions" filterable
								:props="{ value: 'deptId', label: 'deptName', children: 'children' }" value-key="deptId"
								placeholder="选择上级部门" check-strictly :disabled="true" style="width: 100%" />
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12">
						<el-form-item label="部门名称" prop="deptName">
							<el-input v-model="form.deptName" placeholder="请输入部门名称" />
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" v-if="deptType != 4 && title !== '修改部门'">
						<el-form-item label="部门分类" prop="deptType">
							<el-select v-model="form.deptType" placeholder="请选择部门分类" clearable style="width: 100%">
								<el-option v-for="dict in gf_dept_type" :key="dict.value" :label="dict.label" :value="dict.value"
									:disabled="Number(dict.value) <= Number(deptType)" />
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12">
						<el-form-item label="显示排序" prop="orderNum">
							<el-input-number v-model="form.orderNum" controls-position="right" :min="0" style="width: 100%" />
						</el-form-item>
					</el-col>
					<!-- <el-col :span="12" v-if="title !== '修改部门'">
                  <el-form-item label="负责人" prop="leader">
                     <el-input v-model="form.leader" placeholder="请输入负责人" maxlength="20" :disabled="true" />
                  </el-form-item>
               </el-col> -->
					<el-col :xs="24" :sm="12">
						<el-form-item label="联系电话" prop="phone">
							<el-input v-model="form.phone" placeholder="请输入联系电话" maxlength="11" />
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12">
						<el-form-item label="邮箱" prop="email">
							<el-input v-model="form.email" placeholder="请输入邮箱" maxlength="50" />
						</el-form-item>
					</el-col>
					<!-- <el-col :span="12">
                  <el-form-item label="部门状态">
                     <el-radio-group v-model="form.status">
                        <el-radio v-for="dict in sys_normal_disable" :key="dict.value" :label="dict.value">{{ dict.label
                           }}</el-radio>
                     </el-radio-group>
                  </el-form-item>
               </el-col> -->
					<!-- <el-col :span="24">
                  <el-form-item label="部门地址" prop="address">
                     <el-cascader style="width: 100%;" v-model="form.address" :options="areaOptions"
                        :props="{ label: 'label', value: 'value', children: 'children', emitPath: true }"
                        placeholder="请选择部门地址" clearable @change="handleAddressChange" />
                  </el-form-item>
               </el-col>

               <el-col :span="24">
                  <el-form-item label="详细地址" prop="addressDetail">
                     <el-input type="textarea" v-model="form.addressDetail" placeholder="请输入详细地址" maxlength="100"
                        show-word-limit />
                  </el-form-item>
               </el-col> -->
				</el-row>
			</el-form>
			<template #footer>
				<div class="dialog-footer">
					<el-button type="primary" @click="submitForm">确 定</el-button>
					<el-button @click="cancel">取 消</el-button>
				</div>
			</template>
		</el-dialog>

		<el-dialog title="部门点数调整" v-model="rechargeOpen" :width="isMobile ? '95%' : '600px'"
			append-to-body :close-on-click-modal="false" :close-on-press-escape="!rechargeSubmitting"
			:show-close="!rechargeSubmitting" @closed="resetRecharge">
			<el-form v-if="rechargeInfo" v-loading="rechargeLoading" :label-width="isMobile ? '90px' : '110px'">
				<el-form-item label="部门">
					<el-input :model-value="rechargeInfo.deptName" disabled />
				</el-form-item>
				<el-form-item label="当前点数">
					<span>{{ currentBalance === null ? '未获取' : currentBalance }}</span>
					<el-button link type="primary" :disabled="rechargeSubmitting || rechargeLoading" @click="loadRechargeBalance">刷新</el-button>
				</el-form-item>
				<el-form-item label="操作类型">
					<el-radio-group v-model="rechargeOperation" :disabled="rechargeSubmitting">
						<el-radio label="recharge">充值</el-radio>
						<el-radio label="deduct">减点</el-radio>
					</el-radio-group>
				</el-form-item>
				<el-form-item :label="rechargeOperation === 'deduct' ? '扣减点数' : '充值点数'" required>
					<el-input-number v-model="rechargeAmount" :min="0.01" :max="99999999.99" :precision="2"
						:step="1" :disabled="rechargeSubmitting" style="width: 100%" />
				</el-form-item>
				<el-form-item label="调整后点数">
					<span :style="{ color: projectedBalance !== null && Number(projectedBalance) < 0 ? '#f56c6c' : '' }">
						{{ projectedBalance === null ? '—' : projectedBalance }}
					</span>
				</el-form-item>
				<el-form-item label="操作备注" :required="rechargeOperation === 'deduct'">
					<el-input v-model="rechargeRemark" type="textarea" maxlength="400" show-word-limit
						:disabled="rechargeSubmitting" placeholder="减点必须填写原因" />
				</el-form-item>
			</el-form>
			<template #footer>
				<el-button :disabled="rechargeSubmitting" @click="rechargeClose">取消</el-button>
				<el-button :type="rechargeOperation === 'deduct' ? 'danger' : 'primary'"
					:loading="rechargeSubmitting" :disabled="rechargeLoading || currentBalance === null"
					@click="rechargeSubmit">{{ rechargeOperation === 'deduct' ? '确认减点' : '确认充值' }}</el-button>
			</template>
		</el-dialog>
		<select-user ref="selectRef" :roleId="queryParams.roleId" @setUserInfo="setUserInfo" @ok="getList" />
	</div>
</template>

<script setup name="Dept">
import { listDept, getDept, delDept, addDept, updateDept, listDeptExcludeChild } from "@/api/system/dept";
import areaOptions from '@/utils/areaList.json';
import selectUser from "./selectUser";
import { getDeptBalance, adjustDeptPoints } from "@/api/gf/rechargeRecords";

const { proxy } = getCurrentInstance();
const { sys_normal_disable, gf_dept_type } = proxy.useDict("sys_normal_disable", "gf_dept_type");

const deptList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const title = ref("");
const deptOptions = ref([]);
const isExpandAll = ref(true);
const refreshTable = ref(true);
const deptType = ref()
const rechargeOpen = ref(false);
const rechargeInfo = ref()
const rechargeAmount = ref(1)
const rechargeOperation = ref('recharge');
const rechargeRemark = ref('');
const rechargeLoading = ref(false);
const rechargeSubmitting = ref(false);
const currentBalance = ref(null);
const projectedBalance = computed(() => {
	if (currentBalance.value === null || !Number.isFinite(rechargeAmount.value)) return null;
	const balance = Math.round(Number(currentBalance.value) * 100);
	const amount = Math.round(rechargeAmount.value * 100);
	return ((balance + (rechargeOperation.value === 'deduct' ? -amount : amount)) / 100).toFixed(2);
});
const total = ref(0);
const data = reactive({
	form: {},
	queryParams: {
		pageNum: 1,
		pageSize: 10,
		deptName: undefined,
		status: undefined
	},
	rules: {
		parentId: [{ required: true, message: "上级部门不能为空", trigger: "blur" }],
		deptName: [{ required: true, message: "部门名称不能为空", trigger: "blur" }],
		deptType: [{ required: true, message: "部门分类不能为空", trigger: "change" }],
		orderNum: [{ required: true, message: "显示排序不能为空", trigger: "blur" }],
		email: [{ type: "email", message: "请输入正确的邮箱地址", trigger: ["blur", "change"] }],
		phone: [{ pattern: /^1[3|4|5|6|7|8|9][0-9]\d{8}$/, message: "请输入正确的手机号码", trigger: "blur" }],
		address: [{ required: true, message: "请选择部门地址", trigger: "change" }],
		addressDetail: [{ required: true, message: "请输入详细地址", trigger: "blur" }]
	},
});

const { queryParams, form, rules } = toRefs(data);

const isMobile = ref(false);

// 检测是否为移动端
function checkMobile() {
	isMobile.value = window.innerWidth <= 768;
}

/** 查询部门列表 */
function getList() {
	// loading.value = true;
	// listDept(queryParams.value).then(response => {
	//    deptList.value = proxy.handleTree(response.data, "deptId");
	//    loading.value = false;
	// });
	loading.value = true;
	listDept(queryParams.value).then(res => {
		loading.value = false;
		deptList.value = res.data.rows;
		total.value = res.data.total;
	});
}
/** 取消按钮 */
function cancel() {
	open.value = false;
	reset();
}
/** 表单重置 */
function reset() {
	form.value = {
		deptId: undefined,
		parentId: undefined,
		deptName: undefined,
		orderNum: 0,
		leader: undefined,
		phone: undefined,
		email: undefined,
		status: "0",
		addressArr: [],
		address: '',
		addressDetail: ''
	};
	proxy.resetForm("deptRef");
}
/** 搜索按钮操作 */
function handleQuery() {
	getList();
}
/** 重置按钮操作 */
function resetQuery() {
	proxy.resetForm("queryRef");
	handleQuery();
}
/** 新增按钮操作 */
function handleAdd(row) {
	reset();
	listDept().then(response => {
		deptOptions.value = proxy.handleTree(response.data, "deptId");
	});
	if (row != undefined) {
		form.value.parentId = row.deptId;
		deptType.value = row.deptType;
	}
	open.value = true;
	title.value = "添加部门";
}
/** 展开/折叠操作 */
function toggleExpandAll() {
	refreshTable.value = false;
	isExpandAll.value = !isExpandAll.value;
	nextTick(() => {
		refreshTable.value = true;
	});
}
/** 修改按钮操作 */
function handleUpdate(row) {
	reset();
	listDeptExcludeChild(row.deptId).then(response => {
		deptOptions.value = proxy.handleTree(response.data, "deptId");
	});
	getDept(row.deptId).then(response => {
		form.value = response.data;
		open.value = true;
		title.value = "修改部门";
	});
}
/** 提交按钮 */
function submitForm() {
	proxy.$refs["deptRef"].validate(valid => {
		if (valid) {
			if (form.value.deptId != undefined) {
				updateDept(form.value).then(response => {
					proxy.$modal.msgSuccess("修改成功");
					open.value = false;
					getList();
				});
			} else {
				addDept(form.value).then(response => {
					proxy.$modal.msgSuccess("新增成功");
					open.value = false;
					getList();
				});
			}
		}
	});
}
/** 删除按钮操作 */
function handleDelete(row) {
	proxy.$modal.confirm('是否确认删除名称为"' + row.deptName + '"的数据项?').then(function () {
		return delDept(row.deptId);
	}).then(() => {
		getList();
		proxy.$modal.msgSuccess("删除成功");
	}).catch(() => { });
}
/** 打开授权用户表弹窗 */
function openSelectUser(row) {
	proxy.$refs["selectRef"].show();
	getDept(row.deptId).then(response => {
		form.value = response.data;
	});
}
function setUserInfo(info) {
	let { userId, userName } = info
	form.value.leaderId = userId
	form.value.leader = userName
	updateDept(form.value).then(response => {
		proxy.$modal.msgSuccess("绑定成功");
		proxy.$refs["selectRef"].hide();
	});
}
function resetRecharge() {
	rechargeInfo.value = null;
	currentBalance.value = null;
	rechargeAmount.value = 1;
	rechargeOperation.value = 'recharge';
	rechargeRemark.value = '';
}
function rechargeDialog(row) {
	resetRecharge();
	rechargeInfo.value = { deptId: row.deptId, deptName: row.deptName };
	rechargeOpen.value = true;
	loadRechargeBalance();
}
async function loadRechargeBalance() {
	const deptId = rechargeInfo.value?.deptId;
	if (!deptId) return;
	rechargeLoading.value = true;
	currentBalance.value = null;
	try {
		const res = await getDeptBalance(deptId);
		if (rechargeOpen.value && rechargeInfo.value?.deptId === deptId) {
			currentBalance.value = res.data;
		}
	} catch (_) {
		// 请求拦截器统一提示错误，未获取余额时禁止提交。
	} finally {
		rechargeLoading.value = false;
	}
}
async function rechargeSubmit() {
	if (rechargeSubmitting.value || rechargeLoading.value || currentBalance.value === null) return;
	if (!Number.isFinite(rechargeAmount.value) || rechargeAmount.value <= 0) {
		proxy.$modal.msgError('请输入大于0的点数');
		return;
	}
	if (rechargeOperation.value === 'deduct' && !rechargeRemark.value.trim()) {
		proxy.$modal.msgError('请填写减点原因');
		return;
	}
	if (Number(projectedBalance.value) < 0) {
		proxy.$modal.msgError('当前部门点数不足');
		return;
	}
	rechargeSubmitting.value = true;
	try {
		await adjustDeptPoints({
			deptId: rechargeInfo.value.deptId,
			rechargeAmount: rechargeOperation.value === 'deduct' ? -rechargeAmount.value : rechargeAmount.value,
			remark: rechargeRemark.value.trim()
		});
		proxy.$modal.msgSuccess(rechargeOperation.value === 'deduct' ? '减点成功' : '充值成功');
		await loadRechargeBalance();
		rechargeAmount.value = 1;
		rechargeRemark.value = '';
		getList();
	} catch (_) {
		await loadRechargeBalance();
	} finally {
		rechargeSubmitting.value = false;
	}
}
function rechargeClose() {
	if (!rechargeSubmitting.value) rechargeOpen.value = false;
}

onMounted(() => {
	checkMobile();
	window.addEventListener('resize', checkMobile);
});

onBeforeUnmount(() => {
	window.removeEventListener('resize', checkMobile);
});

getList();
</script>

<style lang="scss" scoped>
/* 移动端适配 */
@media (max-width: 768px) {
	.app-container {
		padding: 8px !important;
	}

	/* 表单项垂直排列 */
	.el-form--inline .el-form-item {
		display: block;
		margin-right: 0;
		margin-bottom: 12px;
	}

	.el-form-item__label {
		width: 100% !important;
		text-align: left !important;
		padding: 0 !important;
		margin-bottom: 5px;
	}

	.el-form-item__content {
		margin-left: 0 !important;
	}

	/* 按钮优化 */
	.el-button {
		padding: 8px 12px;
		font-size: 13px;
		margin-bottom: 5px;
	}

	.el-row.mb8 {
		margin-bottom: 8px !important;
	}

	.el-col {
		margin-bottom: 8px;
	}

	/* 表格优化 */
	.el-table {
		font-size: 12px;
	}

	.el-table th,
	.el-table td {
		padding: 8px 0;
	}

	/* 弹窗优化 */
	.el-dialog__body {
		padding: 15px !important;
	}

	.el-dialog__footer {
		padding: 10px 15px !important;
	}

	.dialog-footer {
		display: flex;
		justify-content: center;
		gap: 10px;
	}

	.dialog-footer .el-button {
		flex: 1;
		max-width: 120px;
	}

	/* 表单项间距 */
	.el-form .el-row {
		margin-bottom: 0;
	}

	.el-form .el-col {
		margin-bottom: 10px;
	}

	/* 标签优化 */
	.el-tag {
		font-size: 11px !important;
		padding: 2px 6px;
	}

	.el-select,
	.el-tree-select,
	.el-input {
		width: 100% !important;
	}

	/* 输入数字框优化 */
	.el-input-number {
		width: 100% !important;
	}
}
</style>
