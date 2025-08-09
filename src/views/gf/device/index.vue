<!--
 * @Author: 17630921248 1245634367@qq.com
 * @Date: 2025-08-04 13:05:59
 * @LastEditors: 17630921248 1245634367@qq.com
 * @LastEditTime: 2025-08-09 10:23:40
 * @FilePath: \ryv3\src\views\gf\device\index.vue
 * @Description: Fuck Bug
 * 微信：lizx2066
-->
<template>
	<div class="app-container">
		<el-card>
			<el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="100px">
				<el-form-item label="设备识别号" prop="serialNumber">
					<el-input v-model="queryParams.serialNumber" placeholder="请输入设备识别号" clearable @keyup.enter="handleQuery" />
				</el-form-item>
				<el-form-item label="运行状态" prop="runningState">
					<el-select v-model="queryParams.runningState" placeholder="请选择运行状态" clearable style="width: 200px;">
						<el-option v-for="dict in gf_running_state" :key="dict.value" :label="dict.label" :value="dict.value" />
					</el-select>
				</el-form-item>
				<el-form-item>
					<el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
					<el-button icon="Refresh" @click="resetQuery">重置</el-button>
				</el-form-item>

				<el-form-item style="float: right;">
					<el-row :gutter="20" class="mb8">
						<el-col :span="1.5">
							<el-button type="primary" plain icon="Plus" @click="importDevice"
								v-hasPermi="['gf:device:add']">导入设备</el-button>
						</el-col>
						<el-col :span="1.5">
							<el-button type="warning" plain icon="Download" @click="handleExport"
								v-hasPermi="['gf:device:export']">导出</el-button>
						</el-col>
						<right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
					</el-row>
				</el-form-item>
			</el-form>
		</el-card>
		<el-card style="margin-top: 20px;">
			<el-row :gutter="30" v-loading="loading">
				<el-col :xs="24" :sm="12" :md="12" :lg="8" :xl="6" v-for="(item, index) in deviceList" :key="index"
					style="margin-bottom:30px;text-align:center;">
					<el-card shadow="always">
						<el-row type="flex" :gutter="10" justify="space-between">
							<el-col :span="20" style="text-align:left;">
								<svg-icon icon-class="device" />
								{{ item.deptId != 0 ? item.deptName : '尚未绑定' }}
							</el-col>
							<el-col :span="4">
								<div style="font-size:28px;color:#ccc;">
									<svg-icon v-if="item.device.status == 2" icon-class="wifi_4" />
									<svg-icon v-else icon-class="wifi_0" />
								</div>
							</el-col>
						</el-row>
						<el-row :gutter="10">
							<el-col :span="15">
								<el-descriptions :column="1" size="mini" style="white-space:nowrap;">
									<el-descriptions-item label="设备名称">
										{{ item.device.deviceName }}
									</el-descriptions-item>
									<el-descriptions-item label="设备编号">
										{{ item.serialNumber }}
									</el-descriptions-item>
									<el-descriptions-item label="设备状态">
										<dict-tag :options="gf_running_state" :value="item.runningState" style="display:inline-block;" />
									</el-descriptions-item>
									<el-descriptions-item label="激活时间">
										<!-- {{ parseTime(item.createTime, '{y}-{m}-{d}') }} -->
										{{ item.createTime }}
									</el-descriptions-item>
								</el-descriptions>
							</el-col>
							<el-col :span="9">
								<el-image class="device_image" :src="deviceImg" fit="cover"></el-image>
							</el-col>
						</el-row>
						<el-button-group>
							<el-button type="primary" size="mini" icon="edit" @click="handleUpdate(item)"
								v-hasPermi="['gf:device:edit']">绑定</el-button>
							<el-button :disabled="item.runningState == 0" type="warning" size="mini" icon="delete"
								@click="handleBind(item)" v-hasPermi="['gf:device:remove']">解绑</el-button>
						</el-button-group>
					</el-card>
				</el-col>
			</el-row>
			<el-empty description="暂无数据，请添加设备" v-if="total == 0"></el-empty>
		</el-card>

		<pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
			v-model:limit="queryParams.pageSize" :pageSizes="[12, 24, 36, 60]" @pagination="getList" />

		<!-- 添加或修改GF设备管理对话框 -->
		<el-dialog :title="title" v-model="open" width="20%" append-to-body align-center
			style="margin-top: auto !important;">
			<el-form ref="deviceRef" :model="form" :rules="rules" label-width="80px">
				<el-form-item label="绑定部门" prop="deptId">
					<el-tree-select v-model="form.deptId" :data="deptOptions"
						:props="{ value: 'id', label: 'label', children: 'children' }" value-key="id" placeholder="请选择归属部门"
						check-strictly />
				</el-form-item>
			</el-form>
			<template #footer>
				<div class="dialog-footer">
					<el-button type="primary" @click="submitForm">确 定</el-button>
					<el-button @click="cancel">取 消</el-button>
				</div>
			</template>
		</el-dialog>
		<el-dialog title="导入设备" v-model="importDialog" width="20%" append-to-body align-center
			style="margin-top: auto !important;">
			<fileUpload ref="file-upload" :value="filePath" :limit="1" :fileSize="3" :drag="true"
				:uploadUrl="'/gf/device/import'" :fileType='["xls", "xlsx"]' @updateSuccess="updateSuccess"></fileUpload>
			<template #footer>
				<div class="dialog-footer">
					<el-button @click="closeImportDevice">取 消</el-button>
				</div>
			</template>
		</el-dialog>
	</div>
</template>

<script setup name="Device">
import { listDevice, getDevice, delDevice, addDevice, updateDevice } from "@/api/gf/device";
import { deptTreeSelect } from "@/api/system/user";
import deviceImg from '@/assets/images/device.png';

const { proxy } = getCurrentInstance();
const { gf_running_state } = proxy.useDict("gf_running_state");

const deviceList = ref([]);
const open = ref(false);
const importDialog = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const total = ref(0);
const title = ref("");
const deptOptions = ref(undefined);

const data = reactive({
	form: {},
	queryParams: {
		pageNum: 1,
		pageSize: 12,
		serialNumber: null,
		runningState: null,
	},
	rules: {
		deviceId: [
			{ required: true, message: "设备id不能为空", trigger: "blur" }
		],
		serialNumber: [
			{ required: true, message: "设备识别号不能为空", trigger: "blur" }
		],
	}
});

const { queryParams, form, rules } = toRefs(data);

/** 查询GF设备管理列表 */
function getList() {
	loading.value = true;
	listDevice(queryParams.value).then(response => {
		deviceList.value = response.data.rows;
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
		deviceId: null,
		serialNumber: null,
		deptId: null,
		teamId: null,
		runningState: null,
		service: null,
		remainingTime: null,
		remark: null,
		tenantId: null,
		createBy: null,
		createTime: null,
		updateBy: null,
		updateTime: null,
		delFlag: null
	};
	proxy.resetForm("deviceRef");
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

/** 导入文件按钮操作 */
function importDevice() {
	importDialog.value = true
}

/** 导入文件按钮操作 */
function closeImportDevice() {
	importDialog.value = false
}

/** 修改按钮操作 */
function handleUpdate(row) {
	reset();
	const _id = row.id
	getDevice(_id).then(response => {
		form.value = response.data;
		open.value = true;
		title.value = "修改设备";
	});
}

/** 提交按钮 */
function submitForm() {
	proxy.$refs["deviceRef"].validate(valid => {
		if (valid) {
			if (form.value.deptId == 0) {
				return proxy.$modal.msgWarning("请选择绑定部门！");
			}
			if (form.value.id != null) {
				let params = {
					...form.value,
					runningState: 1
				}
				updateDevice(params).then(response => {
					proxy.$modal.msgSuccess("修改成功");
					open.value = false;
					getList();
				});
			} else {
				addDevice(form.value).then(response => {
					proxy.$modal.msgSuccess("新增成功");
					open.value = false;
					getList();
				});
			}
		}
	});
}

/** 删除按钮操作 */
function handleBind(row) {
	proxy.$modal.confirm('是否确认解绑设备编号为"' + row.serialNumber + '"的数据项？').then(function () {
		let params = {
			...row,
			deptId: 0,
			runningState: 0,
			teamId: 0
		}
		updateDevice(params).then(response => {
			proxy.$modal.msgSuccess("修改成功");
			getList();
		});
	}).then(() => {
	}).catch(() => { });
}

/** 导出按钮操作 */
function handleExport() {
	proxy.download('gf/device/export', {
		...queryParams.value
	}, `device_${new Date().getTime()}.xlsx`)
}
/** 查询部门下拉树结构 */
function getDeptTree() {
	deptTreeSelect().then(response => {
		deptOptions.value = response.data;
	});
};
/** 上传成功 */
function updateSuccess(res) {
	if (res.code === 200) {
		proxy.$modal.msgSuccess("导入成功！");
		importDialog.value = false;
		getList();
	} else {
		proxy.$modal.msgError(res.msg || "导入失败！");
	}
}
getList();
getDeptTree()
</script>
<style lang="scss">
.device_image {
	width: 150px;
}
</style>
