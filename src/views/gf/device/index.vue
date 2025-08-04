<!--
 * @Author: 17630921248 1245634367@qq.com
 * @Date: 2025-08-04 13:05:59
 * @LastEditors: 17630921248 1245634367@qq.com
 * @LastEditTime: 2025-08-04 13:27:29
 * @FilePath: \ryv3\src\views\gf\device\index.vue
 * @Description: Fuck Bug
 * 微信：lizx2066
-->
<template>
	<div class="app-container">
		<el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="120px">
			<el-form-item label="设备名称" prop="deviceName">
				<el-input v-model="queryParams.deviceName" placeholder="请输入设备名称" clearable @keyup.enter="handleQuery" />
			</el-form-item>
			<el-form-item label="设备识别号" prop="serialNumber">
				<el-input v-model="queryParams.serialNumber" placeholder="请输入设备识别号" clearable @keyup.enter="handleQuery" />
			</el-form-item>
			<el-form-item label="状态" prop="status">
				<el-select v-model="queryParams.status" placeholder="请选择状态" clearable style="width: 200px;">
					<el-option v-for="dict in iot_device_status" :key="dict.value" :label="dict.label" :value="dict.value" />
				</el-select>
			</el-form-item>
			<!-- <el-form-item label="是否启用" prop="enable">
				<el-select v-model="queryParams.enable" placeholder="请选择是否启用" clearable>
					<el-option v-for="dict in iot_is_enable" :key="dict.value" :label="dict.label" :value="dict.value" />
				</el-select>
			</el-form-item> -->
			<el-form-item>
				<el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
				<el-button icon="Refresh" @click="resetQuery">重置</el-button>
			</el-form-item>
		</el-form>

		<el-row :gutter="10" class="mb8">
			<el-col :span="1.5">
				<el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['iot:device:add']">新增</el-button>
			</el-col>
			<el-col :span="1.5">
				<el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate" v-hasPermi="['iot:device:edit']">修改</el-button>
			</el-col>
			<el-col :span="1.5">
				<el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete" v-hasPermi="['iot:device:remove']">删除</el-button>
			</el-col>
			<el-col :span="1.5">
				<el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['iot:device:export']">导出</el-button>
			</el-col>
			<right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
		</el-row>

		<el-table v-loading="loading" :data="deviceList" @selection-change="handleSelectionChange">
			<el-table-column type="selection" width="55" align="center" />
			<!-- <el-table-column label="设备id" align="center" prop="id" /> -->
			<el-table-column label="设备名称" align="center" prop="deviceName" />
			<el-table-column label="设备识别号" align="center" prop="serialNumber" />
			<el-table-column label="图片地址" align="center" prop="imageUrl" />
			<el-table-column label="状态" align="center" prop="status">
				<template #default="scope">
					<dict-tag :options="iot_device_status" :value="scope.row.status" />
				</template>
			</el-table-column>
			<el-table-column label="激活时间" align="center" prop="activeTime" width="180">
				<template #default="scope">
					<span>{{ parseTime(scope.row.activeTime, '{y}-{m}-{d}') }}</span>
				</template>
			</el-table-column>
			<el-table-column label="最后一次上报时间" align="center" prop="lastReportTime" width="180">
				<template #default="scope">
					<span>{{ parseTime(scope.row.lastReportTime, '{y}-{m}-{d}') }}</span>
				</template>
			</el-table-column>
			<!-- <el-table-column label="是否启用" align="center" prop="enable">
				<template #default="scope">
          {{iot_is_enable}}
					<dict-tag :options="iot_is_enable" :value="scope.row.enable" />
				</template>
			</el-table-column> -->
			<!-- <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
				<template #default="scope">
					<el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['iot:device:edit']">修改</el-button>
					<el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['iot:device:remove']">删除</el-button>
				</template>
			</el-table-column> -->
		</el-table>

		<pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

		<!-- 添加或修改设备管理对话框 -->
		<el-dialog :title="title" v-model="open" width="30%" append-to-body>
			<el-form ref="deviceRef" :model="form" :rules="rules" label-width="120px">
				<el-form-item label="设备名称" prop="deviceName">
					<el-input v-model="form.deviceName" placeholder="请输入设备名称" />
				</el-form-item>
				<el-form-item label="设备识别号" prop="serialNumber">
					<el-input v-model="form.serialNumber" placeholder="请输入设备识别号" :disabled="true" />
				</el-form-item>
				<el-form-item label="设备地址" prop="networkAddress">
					<el-input v-model="form.networkAddress" placeholder="请输入设备地址" />
				</el-form-item>
				<el-form-item label="状态" prop="status">
					<el-select v-model="form.status" placeholder="请选择状态">
						<el-option v-for="dict in iot_device_status" :key="dict.value" :label="dict.label" :value="dict.value"></el-option>
					</el-select>
				</el-form-item>
				<el-form-item label="激活时间" prop="activeTime">
					<el-date-picker clearable v-model="form.activeTime" type="date" value-format="YYYY-MM-DD" placeholder="请选择激活时间"> </el-date-picker>
				</el-form-item>
				<el-form-item label="是否启用" prop="enable">
					<el-select v-model="form.enable" placeholder="请选择是否启用">
						<el-option v-for="dict in iot_is_enable" :key="dict.value" :label="dict.label" :value="dict.value"></el-option>
					</el-select>
				</el-form-item>
				<el-form-item label="备注" prop="remark">
					<el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
				</el-form-item>
			</el-form>
			<template #footer>
				<div class="dialog-footer">
					<el-button type="primary" @click="submitForm">确 定</el-button>
					<el-button @click="cancel">取 消</el-button>
				</div>
			</template>
		</el-dialog>
	</div>
</template>

<script setup name="Device">
import { listDevice, getDevice, delDevice, addDevice, updateDevice } from '@/api/gf/device';

const { proxy } = getCurrentInstance();
const { iot_location_mode, iot_device_status, iot_is_enable } = proxy.useDict('iot_location_mode', 'iot_device_status', 'iot_is_enable');

const deviceList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref('');

const data = reactive({
	form: {},
	queryParams: {
		pageNum: 1,
		pageSize: 10,
		deviceName: null,
		serialNumber: null,
		status: null,
		enable: null,
	},
	rules: {
		enable: [{ required: true, message: '是否启用不能为空', trigger: 'change' }],
	},
});

const { queryParams, form, rules } = toRefs(data);

/** 查询设备管理列表 */
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
		productId: null,
		productName: null,
		userId: null,
		areaId: null,
		deviceName: null,
		serialNumber: null,
		parentDeviceId: null,
		parentSerialNumber: null,
		imageUrl: null,
		version: null,
		rssi: null,
		locationMode: null,
		networkIp: null,
		networkAddress: null,
		longitude: null,
		latitude: null,
		status: null,
		activeTime: null,
		lastReportTime: null,
		alertId: null,
		alertName: null,
		alertLevel: null,
		enable: null,
		remark: null,
		tenantId: null,
		createBy: null,
		createTime: null,
		updateBy: null,
		updateTime: null,
		deleteTime: null,
		delFlag: null,
	};
	proxy.resetForm('deviceRef');
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

// 多选框选中数据
function handleSelectionChange(selection) {
	ids.value = selection.map(item => item.id);
	single.value = selection.length != 1;
	multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
	reset();
	open.value = true;
	title.value = '添加设备管理';
}

/** 修改按钮操作 */
function handleUpdate(row) {
	reset();
	const _id = row.id || ids.value;
	getDevice(_id).then(response => {
		form.value = response.data;
		open.value = true;
		title.value = '修改设备管理';
	});
}

/** 提交按钮 */
function submitForm() {
	proxy.$refs['deviceRef'].validate(valid => {
		if (valid) {
			if (form.value.id != null) {
				updateDevice(form.value).then(response => {
					proxy.$modal.msgSuccess('修改成功');
					open.value = false;
					getList();
				});
			} else {
				addDevice(form.value).then(response => {
					proxy.$modal.msgSuccess('新增成功');
					open.value = false;
					getList();
				});
			}
		}
	});
}

/** 删除按钮操作 */
function handleDelete(row) {
	const _ids = row.id || ids.value;
	proxy.$modal
		.confirm('是否确认删除设备管理编号为"' + _ids + '"的数据项？')
		.then(function () {
			return delDevice(_ids);
		})
		.then(() => {
			getList();
			proxy.$modal.msgSuccess('删除成功');
		})
		.catch(() => {});
}

/** 导出按钮操作 */
function handleExport() {
	proxy.download(
		'iot/device/export',
		{
			...queryParams.value,
		},
		`device_${new Date().getTime()}.xlsx`
	);
}

getList();
</script>
