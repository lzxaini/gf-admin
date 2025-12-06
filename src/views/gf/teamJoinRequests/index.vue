<!--
 * @Author: 17630921248 1245634367@qq.com
 * @Date: 2025-08-09 09:36:21
 * @LastEditors: 17630921248 1245634367@qq.com
 * @LastEditTime: 2025-12-06 14:20:09
 * @FilePath: \ryv3\src\views\gf\teamJoinRequests\index.vue
 * @Description: Fuck Bug
 * 微信：lizx2066
-->
<template>
	<div class="app-container">
		<el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="100px">
			<el-form-item label="申请状态" prop="status">
				<el-select v-model="queryParams.status" placeholder="请选择申请状态" clearable style="width: 200px">
					<el-option v-for="dict in gf_join_team_status" :key="dict.value" :label="dict.label" :value="dict.value" />
				</el-select>
			</el-form-item>
			<el-form-item label="申请时间" prop="requestTime">
				<el-date-picker clearable v-model="queryParams.requestTime" type="date" value-format="YYYY-MM-DD" placeholder="请选择申请时间"> </el-date-picker>
			</el-form-item>
			<el-form-item>
				<el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
				<el-button icon="Refresh" @click="resetQuery">重置</el-button>
			</el-form-item>
		</el-form>

		<el-row :gutter="10" class="mb8">
			<el-col :span="1.5">
				<el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['gf:teamJoinRequests:export']">导出</el-button>
			</el-col>
			<right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
		</el-row>

		<el-table v-loading="loading" :data="teamJoinRequestsList">
			<el-table-column label="申请加入的团队" align="center" prop="deptName" />
			<el-table-column label="申请人" align="center" prop="userName" />
			<el-table-column label="申请状态" align="center" prop="status">
				<template #default="scope">
					<dict-tag :options="gf_join_team_status" :value="scope.row.status" />
				</template>
			</el-table-column>
			<el-table-column label="申请时间" align="center" prop="requestTime" width="180">
				<template #default="scope">
					<span>{{ scope.row.requestTime }}</span>
				</template>
			</el-table-column>
			<el-table-column label="操作" align="center" class-name="small-padding fixed-width">
				<template #default="scope">
					<el-button :disabled="scope.row.status != 0" link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['gf:teamJoinRequests:edit']">审批</el-button>
					<!-- <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)"
            v-hasPermi="['gf:teamJoinRequests:remove']">删除</el-button> -->
				</template>
			</el-table-column>
		</el-table>

		<pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

		<!-- 添加或审批团队加入申请对话框 -->
		<el-dialog :title="title" v-model="open" width="20%" append-to-body align-center style="margin-top: auto !important" :show-close="false" :close-on-click-modal="false" :close-on-press-escape="false">
			<el-form ref="teamJoinRequestsRef" :model="form" :rules="rules" label-width="80px">
				<el-form-item label="申请状态" prop="status">
					<el-select v-model="form.status" placeholder="请选择申请状态">
						<el-option :key="1" label="同意申请" :value="1"></el-option>
						<el-option :key="2" label="拒绝申请" :value="2"></el-option>
					</el-select>
				</el-form-item>
				<el-form-item label="角色">
					<el-select v-model="roleIds[0]" placeholder="请选择角色" style="width: 100%">
						<el-option v-for="item in roleOptions" :key="item.roleId" :label="item.roleName" :value="item.roleId" :disabled="item.status == 1"></el-option>
					</el-select>
				</el-form-item>
				<!-- <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
        </el-form-item> -->
			</el-form>
			<template #footer>
				<div class="dialog-footer">
					<el-button :loading="dialogLoading" type="primary" @click="submitForm">确 定</el-button>
					<el-button :loading="dialogLoading" @click="cancel">取 消</el-button>
				</div>
			</template>
		</el-dialog>
	</div>
</template>

<script setup name="TeamJoinRequests">
import { listTeamJoinRequests, getTeamJoinRequests, agreeJoinTeamApi } from '@/api/gf/teamJoinRequests';
import { getUser, updateUser } from '@/api/system/user';

const { proxy } = getCurrentInstance();
const { gf_join_team_status } = proxy.useDict('gf_join_team_status');

const teamJoinRequestsList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const total = ref(0);
const title = ref('');
const roleOptions = ref([]);
const roleIds = ref([]); // 选择的角色列表
let originRoleIds = []; // 原始角色列表，用于对比是否修改了角色
const dialogLoading = ref(false);

const data = reactive({
	form: {},
	userInfo: {
		data: {},
	},
	queryParams: {
		pageNum: 1,
		pageSize: 10,
		status: null,
		requestTime: null,
	},
	rules: {
		teamId: [{ required: true, message: '团队ID不能为空', trigger: 'blur' }],
		userId: [{ required: true, message: '用户ID不能为空', trigger: 'blur' }],
		status: [{ required: true, message: '申请状态不能为空', trigger: 'change' }],
	},
});

const { queryParams, form, rules, userInfo } = toRefs(data);

/** 查询团队加入申请列表 */
function getList() {
	loading.value = true;
	listTeamJoinRequests(queryParams.value).then(response => {
		teamJoinRequestsList.value = response.data.rows;
		total.value = response.data.total;
		loading.value = false;
	});
}

// 取消按钮
function cancel() {
	open.value = false;
	reset();
}

// 表单重置
function reset() {
	form.value = {
		id: null,
		teamId: null,
		userId: null,
		status: null,
		requestTime: null,
		remark: null,
		tenantId: null,
		createBy: null,
		createTime: null,
		updateBy: null,
		updateTime: null,
		delFlag: null,
	};
	userInfo.value = {
		data: {},
		roleIds: [],
	};
	roleIds.value = [];
	proxy.resetForm('teamJoinRequestsRef');
}

/** 搜索按钮操作 */
function handleQuery() {
	queryParams.value.pageNum = 1;
	getList();
}

/** 重置按钮操作 */
function resetQuery() {
	proxy.resetForm('queryRef');
	handleQuery();
}

/** 审批按钮操作 */
function handleUpdate(row) {
	let { id } = row;
	const userId = row.userId;
	form.value = { id };
	// 获取用户信息和角色列表
	getUser(userId).then(response => {
		roleOptions.value = response.roles || [];
		userInfo.value = response;
		roleIds.value = response.roleIds ? [...response.roleIds] : [];
		originRoleIds = response.roleIds ? [...response.roleIds] : [];
		open.value = true;
		title.value = '加入审批';
	});
}

/** 提交按钮 */
function submitForm() {
	proxy.$refs['teamJoinRequestsRef'].validate(valid => {
		if (valid) {
			if (form.value.id != null) {
				dialogLoading.value = true;
				// 如果审批通过且修改了角色，则更新用户角色
				if (form.value.status == 1 && JSON.stringify(originRoleIds) !== JSON.stringify(roleIds.value)) {
					const params = {
						...userInfo.value.data,
						roleIds: roleIds.value,
					};
					updateUser(params)
						.then(() => {
							agreeJoinTeam('info');
						})
						.catch(() => {
							proxy.$modal.msgWarning('角色分配失败，请手动处理');
							agreeJoinTeam('update');
						});
				} else {
					agreeJoinTeam('update');
				}
			} else {
				dialogLoading.value = false;
				proxy.$modal.msgError('审批失败！');
			}
		}
	});
}
function agreeJoinTeam(type) {
	// 先处理审批
	agreeJoinTeamApi(form.value)
		.then(response => {
			if (response.code === 200) {
				proxy.$modal.msgSuccess(type === 'update' ? '审批成功！' : '审批成功并已分配角色！');
				open.value = false;
				dialogLoading.value = false;
				getList();
			} else {
				proxy.$modal.msgError(response.msg || '审批失败！');
				open.value = false;
				dialogLoading.value = false;
			}
		})
		.catch(() => {
			proxy.$modal.msgError('审批失败！');
			open.value = false;
			dialogLoading.value = false;
		});
}
/** 导出按钮操作 */
function handleExport() {
	proxy.download(
		'gf/teamJoinRequests/export',
		{
			...queryParams.value,
		},
		`teamJoinRequests_${new Date().getTime()}.xlsx`
	);
}

getList();
</script>
