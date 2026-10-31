<!--
 * @Author: 17630921248 1245634367@qq.com
 * @Date: 2025-08-04 13:05:59
 * @LastEditors: 17630921248 1245634367@qq.com
 * @LastEditTime: 2026-10-31 13:17:59
 * @FilePath: \gf-servere:\code\gf-code\gf-admin\src\views\gf\device\index.vue
 * @Description: Fuck Bug
 * 微信：lizx2066
-->
<template>
	<div class="app-container">
		<el-card>
			<el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="100px">
				<el-form-item label="设备识别号" prop="serialNumber">
					<el-input v-model="queryParams.serialNumber" placeholder="请输入设备识别号" clearable @keyup.enter="handleQuery" style="width: 100%" />
				</el-form-item>
				<el-form-item label="归属部门" prop="deptId">
					<department-select v-model="queryParams.deptId" placeholder="请选择绑定部门" />
				</el-form-item>
				<!-- <el-form-item label="运行状态" prop="status">
					<el-select v-model="queryParams.status" placeholder="请选择运行状态" clearable style="width: 200px;">
						<el-option key="1" label="未激活" :value="1" />
						<el-option key="2" label="在线" :value="2" />
						<el-option key="3" label="离线" :value="3" />
					</el-select>
				</el-form-item> -->
				<el-form-item label="绑定状态" prop="runningState">
					<el-select v-model="queryParams.runningState" placeholder="请选择绑定状态" clearable style="width: 100%; min-width: 200px">
						<el-option v-for="dict in gf_running_state" :key="dict.value" :label="dict.value == '0' ? '未绑定' : dict.label" :value="dict.value" />
					</el-select>
				</el-form-item>
				<!-- 设备位置筛选暂时隐藏
				<el-form-item label="设备位置" prop="address">
					<el-cascader
						v-model="addressQuery"
						:options="locationData"
						placeholder="请选择设备位置"
						clearable
						style="width: 100%; min-width: 280px"
						@change="handleChangeLocation"
						:props="{ checkStrictly: true, value: 'label', label: 'label', children: 'children' }"
					/>
				</el-form-item>
				-->
				<el-form-item>
					<el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
					<el-button icon="Refresh" @click="resetQuery">重置</el-button>
				</el-form-item>

				<el-form-item style="float: right">
					<el-row :gutter="20" class="mb8">
						<el-col :span="1.5">
							<!-- <el-button type="primary" plain icon="Plus" @click="importDevice" v-hasPermi="['gf:device:add']">导入设备</el-button> -->
							<el-button type="primary" plain icon="Plus" @click="registerDailog.visible = true" v-hasPermi="['gf:device:add']">注册设备</el-button>
						</el-col>
						<el-col :span="1.5">
							<el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['gf:device:export']">导出</el-button>
						</el-col>
						<right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
					</el-row>
				</el-form-item>
			</el-form>
		</el-card>
		<div class="device-grid" v-loading="loading" :element-loading-text="loadingText">
			<article v-for="item in deviceList" :key="item.id || item.serialNumber" class="device-card">
				<header class="device-card-header">
					<div class="device-department"><svg-icon icon-class="device" /> {{ item.deptId ? (item.deptName || '尚未绑定') : '尚未绑定' }}</div>
					<el-tag :type="item.device?.status == 2 ? 'success' : 'info'" effect="light" round>{{ item.device?.status == 2 ? '在线' : '离线' }}</el-tag>
				</header>
				<div class="device-card-main">
					<div class="device-details">
						<div class="device-field-label">设备编号</div>
						<div class="device-serial">{{ item.serialNumber || '—' }}</div>
						<div class="device-tags">
							<el-tag size="small" :type="item.deviceType === 'ANDROID' ? 'success' : 'info'">{{ item.deviceType === 'ANDROID' ? '安卓客户端' : item.deviceType === 'UNKNOWN' ? '未知类型' : item.deviceType }}</el-tag>
							<el-tag size="small" :type="item.runningState == 0 ? 'info' : item.runningState == 1 ? 'success' : 'warning'">{{ item.runningState == 0 ? '未绑定' : item.runningState == 1 ? '运行中' : '已停止' }}</el-tag>
						</div>
					</div>
					<el-image class="device-thumbnail" :src="deviceImg" fit="contain" />
				</div>
				<div class="device-network"><span class="device-field-label">地址</span><span>{{ item.device?.networkAddress || '暂无地址' }}</span></div>
				<div class="device-created"><span class="device-field-label">激活时间</span><span>{{ item.createTime || '—' }}</span></div>
				<div class="device-actions">
							<el-button type="primary" size="small" icon="edit" @click="handleUpdate(item)" v-hasPermi="['gf:device:edit']">绑定</el-button>
							<el-button v-if="item.deviceType == 'WIFI'" type="danger" size="small" @click="handleReset(item)" v-hasPermi="['gf:device:remove']">重置配网</el-button>
							<el-button v-if="item.deviceType == 'WIFI'" type="info" size="small" @click="handleReboot(item)" v-hasPermi="['gf:device:remove']">重启</el-button>
							<el-button v-if="item.deviceType == 'WIFI'" type="success" size="small" @click="handleOTA(item)" v-hasPermi="['gf:device:remove']">OTA</el-button>
							<el-button type="warning" size="small" icon="delete" @click="handleBind(item)" v-hasPermi="['gf:device:remove']">解绑</el-button>
						</div>
			</article>
		</div>
		<el-empty v-if="!loading && total == 0" description="暂无数据，请添加设备" />

		<pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :pageSizes="[12, 24, 36, 60]" @pagination="getList" />

		<!-- 添加或修改GF设备管理对话框 -->
		<el-dialog :title="title" v-model="open" :width="isMobile ? '90%' : '20%'" append-to-body align-center style="margin-top: auto !important">
			<el-form ref="deviceRef" :model="form" :rules="rules" :label-width="isMobile ? '70px' : '80px'">
				<el-form-item label="绑定部门" prop="deptId">
					<department-select v-model="form.deptId" placeholder="请选择绑定部门" />
				</el-form-item>
			</el-form>
			<template #footer>
				<div class="dialog-footer">
					<el-button type="primary" @click="submitForm">确 定</el-button>
					<el-button @click="cancel">取 消</el-button>
				</div>
			</template>
		</el-dialog>
		<el-dialog title="导入设备" v-model="importDialog" :width="isMobile ? '90%' : '20%'" append-to-body align-center style="margin-top: auto !important">
			<fileUpload
				ref="file-upload"
				:value="filePath"
				:limit="1"
				:fileSize="3"
				:drag="true"
				:uploadUrl="'/gf/device/import'"
				:fileType="['xls', 'xlsx']"
				@updateSuccess="updateSuccess"
			></fileUpload>
			<template #footer>
				<div class="dialog-footer">
					<el-button @click="closeImportDevice">取 消</el-button>
				</div>
			</template>
		</el-dialog>
		<el-dialog title="注册设备" v-model="registerDailog.visible" :width="isMobile ? '90%' : '20%'" append-to-body align-center style="margin-top: auto !important">
			<el-input v-model="registerDailog.serialNumber" placeholder="请输入设备编号"></el-input>
			<template #footer>
				<div class="dialog-footer">
					<el-button @click="registerDailog.visible = false">取 消</el-button>
					<el-button type="primary" @click="handleRegister">确 定</el-button>
				</div>
			</template>
		</el-dialog>
	</div>
</template>

<script setup name="Device">
import { listDevice, getDevice, getLocationApi, addDevice, updateDevice } from '@/api/gf/device';
import deviceImg from '@/assets/images/device.png';
import { useMQTTStore } from '@/store/modules/useMQTTStore';
import { set } from 'nprogress';
import { h, nextTick } from 'vue';
const mqttStore = useMQTTStore();

const { proxy } = getCurrentInstance();
const { gf_running_state } = proxy.useDict('gf_running_state');

const addressQuery = ref([]);
const deviceList = ref([]);
const open = ref(false);
const importDialog = ref(false);
const loading = ref(true);
const loadingText = ref('正在加载中，请稍后...');
const showSearch = ref(true);
const total = ref(0);
const title = ref('');
const isMobile = ref(false);
const registerDailog = ref({
	visible: false,
	serialNumber: '',
});

const data = reactive({
	form: {},
	queryParams: {
		pageNum: 1,
		pageSize: 12,
		address: null,
		serialNumber: null,
		deptId: null,
		runningState: null,
	},
	locationData: [],
	rules: {
		deviceId: [{ required: true, message: '设备id不能为空', trigger: 'blur' }],
		serialNumber: [{ required: true, message: '设备识别号不能为空', trigger: 'blur' }],
	},
});

const { queryParams, form, rules, locationData } = toRefs(data);

/** 查询GF设备管理列表 */
function getList() {
	loading.value = true;
	listDevice(queryParams.value).then(response => {
		response.data.rows.forEach(item => {
			const serialNumber = String(item.serialNumber || '').trim();
			item.deviceType = serialNumber.startsWith('GFKM-') ? 'WIFI' : /^\d{15}$/.test(serialNumber) ? '4G' : serialNumber ? 'ANDROID' : 'UNKNOWN';
		});
		deviceList.value = response.data.rows;
		total.value = response.data.total;
		loading.value = false;
		handleSubscribeAll();
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
	addressQuery.value = [];
	handleQuery();
}

/** 导入文件按钮操作 */
function importDevice() {
	importDialog.value = true;
}

/** 导入文件按钮操作 */
function closeImportDevice() {
	importDialog.value = false;
}

/** 修改按钮操作 */
function handleUpdate(row) {
	reset();
	const _id = row.id;
	getDevice(_id).then(response => {
		form.value = response.data;
		open.value = true;
		title.value = '修改设备';
	});
}

/** 提交按钮 */
function submitForm() {
	proxy.$refs['deviceRef'].validate(valid => {
		if (valid) {
			if (form.value.deptId == 0) {
				return proxy.$modal.msgWarning('请选择绑定部门！');
			}
			if (form.value.id != null) {
				let params = {
					...form.value,
					runningState: 2,
				};
				updateDevice(params).then(response => {
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
function handleBind(row) {
	let { deviceType, serialNumber } = row;
	proxy.$modal
		.confirm('是否确认解绑设备编号为"' + row.serialNumber + '"的数据项？')
		.then(function () {
			let params = {
				...row,
				deptId: 0,
				runningState: 0,
				teamId: 0,
			};
			if (deviceType == 'WIFI') {
				handleReset(row);
			}
			updateDevice(params).then(response => {
				proxy.$modal.msgSuccess('修改成功');
				getList();
			});
		})
		.then(() => {})
		.catch(() => {});
}
/** 注册设备 */
function handleRegister() {
	proxy.$modal
		.confirm('是否确认注册设备编号为"' + registerDailog.value.serialNumber + '"的数据项？')
		.then(function () {
			mqttStore.publish(`/register/device`, registerDailog.value.serialNumber);
			proxy.$modal.msgSuccess('注册成功！');
			queryParams.value.serialNumber = registerDailog.value.serialNumber;
			registerDailog.value.visible = false;
			registerDailog.value.serialNumber = '';
			getList();
		})
		.then(() => {})
		.catch(() => {});
}
/** 重置配网 */
function handleReset(row) {
	let { deviceType, serialNumber } = row;
	// 将serialNumber转换为去掉冒号的mac地址
	loading.value = true;

	mqttStore.publish(`/req/${serialNumber}`, 'config-get');
	// 获取设备信息
	getDeviceInfo(serialNumber)
		.then(deviceInfo => {
			console.log('设备信息: ', deviceInfo);
			loading.value = false;
			proxy.$modal
				.confirm('是否确认重置配网设备编号为"' + row.serialNumber + '"的数据项？')
				.then(function () {
					if (deviceType == 'WIFI') {
						mqttStore.publish(`/req/${serialNumber}`, 'network-reset');
						proxy.$modal.msgSuccess('重置配网指令已发送，请等待设备重启！');
					} else {
						proxy.$modal.msgWarning('4G设备不支持重置配网操作！');
					}
				})
				.then(() => {})
				.catch(() => {});
		})
		.catch(() => {
			loading.value = false;
			proxy.$modal.msgError('获取设备信息失败，设备离线，无法重置配网！');
		});
}
/** 重启设备 */
function handleReboot(row) {
	let { deviceType, serialNumber } = row;
	// 将serialNumber转换为去掉冒号的mac地址
	loading.value = true;

	mqttStore.publish(`/req/${serialNumber}`, 'config-get');
	// 获取设备信息
	getDeviceInfo(serialNumber)
		.then(deviceInfo => {
			console.log('设备信息: ', deviceInfo);
			loading.value = false;
			proxy.$modal
				.confirm('是否确认重启设备编号为"' + row.serialNumber + '"的设备？')
				.then(function () {
					if (deviceType == 'WIFI') {
						mqttStore.publish(`/req/${serialNumber}`, 'system-reboot');
						proxy.$modal.msgSuccess('重启指令已发送，请等待设备重启！');
					} else {
						proxy.$modal.msgWarning('4G设备不支持重启操作！');
					}
				})
				.then(() => {})
				.catch(() => {});
		})
		.catch(() => {
			loading.value = false;
			proxy.$modal.msgError('获取设备信息失败，设备离线，无法重启设备！');
		});
}
/** OTA升级 */
function handleOTA(row) {
	let { deviceType, serialNumber } = row;
	// 将serialNumber转换为去掉冒号的mac地址
	loading.value = true;
	loadingText.value = '正在进行OTA升级，请稍等...';

	mqttStore.publish(`/req/${serialNumber}`, 'config-get');
	// 获取设备信息
	getDeviceInfo(serialNumber)
		.then(oldDeviceInfo => {
			console.log('设备信息: ', oldDeviceInfo);
			proxy.$modal
				.confirm('是否确认对设备编号为"' + row.serialNumber + '"的设备进行OTA升级？')
				.then(function () {
					if (deviceType == 'WIFI') {
						mqttStore.publish(`/req/${serialNumber}`, 'ota-http-cmd ota.chaosm.com');
						proxy.$modal.msgSuccess('OTA升级指令已发送，请等待设备升级！');
						// 监听OTA start消息
						const otaStartListener = (topic, message) => {
							console.log('🥵 ~ otaStartListener ~ topic, message: ', topic, message);
							if (topic === `/resp/${serialNumber}` && message.toString().includes('OTA start')) {
								return proxy.$modal.msgSuccess('设备开始OTA升级，请耐心等待升级完成！');
							}
							// OTA完成后我这里会收到一条设备信息
							if (topic === `/resp/${serialNumber}` && message.toString().includes('version')) {
								proxy.$modal.msgSuccess('设备OTA升级完成！');
								loading.value = false;
								loadingText.value = '正在加载中，请稍后...';
								// 升级完成后移除监听
								mqttStore.offMessage(otaStartListener);
							}
						};
						mqttStore.onMessage(otaStartListener);
					} else {
						proxy.$modal.msgWarning('4G设备不支持OTA升级操作！');
					}
				})
				.catch(() => {
					loading.value = false;
					loadingText.value = '正在加载中，请稍后...';
				});
		})
		.catch(() => {
			loading.value = false;
			loadingText.value = '正在加载中，请稍后...';
			proxy.$modal.msgError('获取设备信息失败，设备离线，无法进行OTA升级！');
		});
}
/** 获取设备信息 */
function getDeviceInfo(serialNumber) {
	return new Promise((resolve, reject) => {
		mqttStore.onMessage((topic, message) => {
			if (topic === `/resp/${serialNumber}`) {
				resolve(message.toString());
			}
		});
		// 超时处理，5秒后如果没有收到消息则拒绝
		setTimeout(() => {
			reject(new Error('获取设备信息超时'));
		}, 5000);
	});
}

/** 订阅所有wifi设备 */
function handleSubscribeAll() {
	// 循环订阅所有WIFI设备
	deviceList.value.forEach(item => {
		if (item.deviceType === 'WIFI') {
			console.log('订阅', `/resp/${item.serialNumber}`);
			mqttStore.subscribe(`/resp/${item.serialNumber}`);
		}
	});
}
/** 导出按钮操作 */
function handleExport() {
	proxy.download(
		'gf/device/export',
		{
			...queryParams.value,
		},
		`device_${new Date().getTime()}.xlsx`
	);
}
/** 上传成功 */
function updateSuccess(res) {
	if (res.code === 200) {
		proxy.$modal.msgSuccess('导入成功！');
		importDialog.value = false;
		getList();
	} else {
		proxy.$modal.msgError(res.msg || '导入失败！');
	}
}
// 获取省市区
const getLocation = async () => {
	try {
		const res = await getLocationApi();
		console.log('省市区数据: ', res.data);
		locationData.value = res.data;
		// 这里可以根据需要处理返回的数据
	} catch (error) {
		console.error('获取省市区失败: ', error);
	}
};
// 选择位置
const handleChangeLocation = value => {
	console.log('🥵 ~ handleChangeLocation ~ value: ', value);
	let address = value.map(item => item).join('/');
	console.log('🥵 ~ handleChangeLocation ~ address: ', address);
	queryParams.value.address = address;
	handleQuery();
};

// 检测是否为移动端
function checkMobile() {
	isMobile.value = window.innerWidth <= 768;
}

onMounted(() => {
	checkMobile();
	window.addEventListener('resize', checkMobile);
	mqttStore.connect();
	nextTick(() => {
		getList();
		getLocation();
	});
});
// 页面卸载时断开连接
onBeforeUnmount(() => {
	window.removeEventListener('resize', checkMobile);
	mqttStore.disconnect();
});
</script>
<style lang="scss">
.device_image {
	width: 150px;
}

/* 移动端适配 */
@media (max-width: 768px) {
	.app-container {
		padding: 8px !important;
	}

	.el-card {
		margin-top: 10px !important;
		margin-bottom: 10px !important;
	}

	.el-card__body {
		padding: 12px !important;
	}

	.el-form--inline .el-form-item {
		display: block;
		margin-right: 0;
		margin-bottom: 12px;
	}

	.el-form-item__label {
		// width: 100% !important;
		text-align: left !important;
		padding: 0 !important;
		margin-bottom: 5px;
	}

	.el-form-item__content {
		margin-left: 0 !important;
	}

	.el-row.mb8 {
		margin-bottom: 8px !important;
	}

	.el-col {
		margin-bottom: 8px;
	}

	.el-button {
		padding: 8px 12px;
		font-size: 13px;
	}

	.el-button-group {
		justify-content: center;
		width: 100%;
	}

	.el-button + .el-button {
		margin-left: 0;
	}

	.device_image {
		width: 80px;
	}

	.el-descriptions {
		font-size: 12px !important;
	}

	.el-descriptions__label,
	.el-descriptions__content {
		font-size: 11px !important;
		padding: 6px 8px !important;
	}

	.el-tag {
		font-size: 11px !important;
		padding: 2px 6px;
	}

	/* 顶部标题栏优化 */
	.el-card .el-row {
		flex-wrap: wrap;
	}

	svg-icon {
		font-size: 14px;
	}

	/* 分页器优化 */
	.pagination-container {
		padding: 10px !important;
	}

	.el-pagination {
		text-align: center;
	}

	.el-pagination .el-select .el-input {
		width: 90px !important;
	}

	/* 弹窗适配 */
	.el-dialog__body {
		padding: 15px !important;
	}

	.el-form-item {
		margin-bottom: 15px;
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
}
</style>

<style scoped lang="scss">
.device-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 18px; margin-top: 20px; }
.device-card { min-width: 0; padding: 20px; background: #fff; border: 1px solid #e5eaf0; border-radius: 12px; box-shadow: 0 3px 12px #182c4610; }
.device-card-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-bottom: 14px; border-bottom: 1px solid #f0f2f5; }
.device-department { font-size: 15px; font-weight: 600; color: #25354a; overflow-wrap: anywhere; }
.device-card-main { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 16px 0; }
.device-details { min-width: 0; }
.device-field-label { color: #8692a2; font-size: 12px; }
.device-serial { margin-top: 7px; font-size: 15px; font-weight: 600; font-family: monospace; color: #25354a; overflow-wrap: anywhere; }
.device-tags { display: flex; gap: 8px; margin-top: 12px; }
.device-thumbnail { width: 62px; height: 100px; flex-shrink: 0; }
.device-network, .device-created { display: grid; grid-template-columns: 64px minmax(0, 1fr); gap: 12px; font-size: 13px; line-height: 1.7; color: #4c5c70; }
.device-network { background: #f5f8fa; padding: 10px 12px; border-radius: 6px; }
.device-network span:last-child { overflow-wrap: anywhere; white-space: pre-wrap; }
.device-created { padding: 12px; }
.device-actions { display: flex; flex-wrap: wrap; gap: 8px; padding-top: 14px; border-top: 1px solid #f0f2f5; }
.device-actions .el-button { margin-left: 0; }
@media (max-width: 480px) { .device-grid { grid-template-columns: minmax(0, 1fr); } }
</style>
