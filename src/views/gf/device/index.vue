<!--
 * @Author: 17630921248 1245634367@qq.com
 * @Date: 2025-08-04 13:05:59
 * @LastEditors: 17630921248 1245634367@qq.com
 * @LastEditTime: 2025-09-20 10:48:25
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
				<!-- <el-form-item label="运行状态" prop="status">
					<el-select v-model="queryParams.status" placeholder="请选择运行状态" clearable style="width: 200px;">
						<el-option key="1" label="未激活" :value="1" />
						<el-option key="2" label="在线" :value="2" />
						<el-option key="3" label="离线" :value="3" />
					</el-select>
				</el-form-item> -->
				<el-form-item label="绑定状态" prop="runningState">
					<el-select v-model="queryParams.runningState" placeholder="请选择绑定状态" clearable style="width: 200px">
						<el-option v-for="dict in gf_running_state" :key="dict.value" :label="dict.value == '0' ? '未绑定' : dict.label" :value="dict.value" />
					</el-select>
				</el-form-item>
				<el-form-item>
					<el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
					<el-button icon="Refresh" @click="resetQuery">重置</el-button>
				</el-form-item>

				<el-form-item style="float: right">
					<el-row :gutter="20" class="mb8">
						<el-col :span="1.5">
							<el-button type="primary" plain icon="Plus" @click="importDevice" v-hasPermi="['gf:device:add']">导入设备</el-button>
						</el-col>
						<el-col :span="1.5">
							<el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['gf:device:export']">导出</el-button>
						</el-col>
						<right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
					</el-row>
				</el-form-item>
			</el-form>
		</el-card>
		<el-card style="margin-top: 20px">
			<el-row :gutter="30" v-loading="loading" :element-loading-text="loadingText" element-loading-background="rgba(122, 122, 122, 0.8)">
				<el-col :xs="24" :sm="12" :md="12" :lg="8" :xl="6" v-for="(item, index) in deviceList" :key="index" style="margin-bottom: 30px; text-align: center">
					<el-card shadow="always">
						<el-row type="flex" :gutter="10" justify="space-between">
							<el-col :span="20" style="text-align: left">
								<svg-icon icon-class="device" />
								{{ item.deptId != 0 ? item.deptName : '尚未绑定' }}
							</el-col>
							<el-col :span="4">
								<div style="font-size: 28px; color: #ccc">
									<svg-icon v-if="item.device.status == 2" icon-class="wifi_4" />
									<svg-icon v-else icon-class="wifi_0" />
								</div>
							</el-col>
						</el-row>
						<el-row :gutter="10">
							<el-col :span="15">
								<el-descriptions :column="1" size="mini" style="white-space: nowrap">
									<!-- <el-descriptions-item label="设备名称">
										{{ item.device.deviceName }}
									</el-descriptions-item> -->
									<el-descriptions-item label="设备编号">
										{{ item.serialNumber }}
									</el-descriptions-item>
									<el-descriptions-item label="设备类型">
										<el-tag :type="item.deviceType == '4G' ? 'primary' : 'success'">{{ item.deviceType }}</el-tag>
									</el-descriptions-item>
									<el-descriptions-item label="设备状态">
										<!-- <dict-tag :options="gf_running_state" :value="item.runningState" style="display:inline-block;" /> -->
										<el-tag :type="item.runningState == 0 ? 'danger' : item.runningState == 1 ? 'success' : 'warning'">
											{{ item.runningState == 0 ? '未绑定' : item.runningState == 1 ? '运行中' : '已停止' }}
										</el-tag>
									</el-descriptions-item>
									<!-- <el-descriptions-item label="运行状态">
										<el-tag :type="item.status == 2 ? 'success' : 'danger'">{{ item.status == 2 ? '在线' :
											'离线' }}</el-tag>
									</el-descriptions-item> -->
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
							<el-button type="primary" size="mini" icon="edit" @click="handleUpdate(item)" v-hasPermi="['gf:device:edit']">绑定</el-button>
							<el-button v-if="item.deviceType == 'WIFI'" type="danger" size="mini" @click="handleReset(item)" v-hasPermi="['gf:device:remove']">重置配网</el-button>
							<el-button v-if="item.deviceType == 'WIFI'" type="info" size="mini" @click="handleReboot(item)" v-hasPermi="['gf:device:remove']">重启设备</el-button>
							<el-button v-if="item.deviceType == 'WIFI'" type="success" size="mini" @click="handleOTA(item)" v-hasPermi="['gf:device:remove']">OTA</el-button>
							<el-button type="warning" size="mini" icon="delete" @click="handleBind(item)" v-hasPermi="['gf:device:remove']">解绑</el-button>
						</el-button-group>
					</el-card>
				</el-col>
			</el-row>
			<el-empty description="暂无数据，请添加设备" v-if="total == 0"></el-empty>
		</el-card>

		<pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :pageSizes="[12, 24, 36, 60]" @pagination="getList" />

		<!-- 添加或修改GF设备管理对话框 -->
		<el-dialog :title="title" v-model="open" width="20%" append-to-body align-center style="margin-top: auto !important">
			<el-form ref="deviceRef" :model="form" :rules="rules" label-width="80px">
				<el-form-item label="绑定部门" prop="deptId">
					<el-tree-select
						v-model="form.deptId"
						:data="deptOptions"
						:props="{ value: 'id', label: 'label', children: 'children' }"
						value-key="id"
						placeholder="请选择归属部门"
						check-strictly
					/>
				</el-form-item>
			</el-form>
			<template #footer>
				<div class="dialog-footer">
					<el-button type="primary" @click="submitForm">确 定</el-button>
					<el-button @click="cancel">取 消</el-button>
				</div>
			</template>
		</el-dialog>
		<el-dialog title="导入设备" v-model="importDialog" width="20%" append-to-body align-center style="margin-top: auto !important">
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
	</div>
</template>

<script setup name="Device">
import { listDevice, getDevice, delDevice, addDevice, updateDevice } from '@/api/gf/device';
import { deptTreeSelect } from '@/api/system/user';
import deviceImg from '@/assets/images/device.png';
import { useMQTTStore } from '@/store/modules/useMQTTStore';
import { set } from 'nprogress';
import { nextTick } from 'vue';
const mqttStore = useMQTTStore();

const { proxy } = getCurrentInstance();
const { gf_running_state } = proxy.useDict('gf_running_state');

const deviceList = ref([]);
const open = ref(false);
const importDialog = ref(false);
const loading = ref(true);
const loadingText = ref('正在加载中，请稍后...');
const showSearch = ref(true);
const total = ref(0);
const title = ref('');
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
		deviceId: [{ required: true, message: '设备id不能为空', trigger: 'blur' }],
		serialNumber: [{ required: true, message: '设备识别号不能为空', trigger: 'blur' }],
	},
});

const { queryParams, form, rules } = toRefs(data);

/** 查询GF设备管理列表 */
function getList() {
	loading.value = true;
	listDevice(queryParams.value).then(response => {
		response.data.rows.forEach(item => {
			item.deviceType = item.serialNumber && item.serialNumber.includes('GF-') ? 'WIFI' : '4G';
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
/** 重置配网 */
function handleReset(row) {
	let { deviceType, serialNumber } = row;
	// 将serialNumber转换为wifi-去掉冒号的mac地址
	loading.value = true;
	let deviceId = deviceTransform(serialNumber);
	mqttStore.publish(`/req/wifi-${deviceId}`, 'config-get');
	// 获取设备信息
	getDeviceInfo(deviceId)
		.then(deviceInfo => {
			console.log('设备信息: ', deviceInfo);
			loading.value = false;
			proxy.$modal
				.confirm('是否确认重置配网设备编号为"' + row.serialNumber + '"的数据项？')
				.then(function () {
					if (deviceType == 'WIFI') {
						mqttStore.publish(`/req/wifi-${deviceId}`, 'network-reset');
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
	// 将serialNumber转换为wifi-去掉冒号的mac地址
	loading.value = true;
	let deviceId = deviceTransform(serialNumber);
	mqttStore.publish(`/req/wifi-${deviceId}`, 'config-get');
	// 获取设备信息
	getDeviceInfo(deviceId)
		.then(deviceInfo => {
			console.log('设备信息: ', deviceInfo);
			loading.value = false;
			proxy.$modal
				.confirm('是否确认重启设备编号为"' + row.serialNumber + '"的设备？')
				.then(function () {
					if (deviceType == 'WIFI') {
						mqttStore.publish(`/req/wifi-${deviceId}`, 'system-reboot');
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
	// 将serialNumber转换为wifi-去掉冒号的mac地址
	loading.value = true;
	loadingText.value = '正在进行OTA升级，请稍等...';
	let deviceId = deviceTransform(serialNumber);
	mqttStore.publish(`/req/wifi-${deviceId}`, 'config-get');
	// 获取设备信息
	getDeviceInfo(deviceId)
		.then(oldDeviceInfo => {
			console.log('设备信息: ', oldDeviceInfo);
			proxy.$modal
				.confirm('是否确认对设备编号为"' + row.serialNumber + '"的设备进行OTA升级？')
				.then(function () {
					if (deviceType == 'WIFI') {
						mqttStore.publish(`/req/wifi-${deviceId}`, 'ota-http-cmd ota.guangfkm.cn');
						proxy.$modal.msgSuccess('OTA升级指令已发送，请等待设备升级！');
						// 监听OTA start消息
						const otaStartListener = (topic, message) => {
							console.log('🥵 ~ otaStartListener ~ topic, message: ', topic, message);
							if (topic === `/resp/wifi-${deviceId}` && message.toString().includes('OTA start')) {
								return proxy.$modal.msgSuccess('设备开始OTA升级，请耐心等待升级完成！');
							}
							// OTA完成后我这里会收到一条设备信息
							if (topic === `/resp/wifi-${deviceId}` && message.toString().includes('"version": "1.0.0",')) {
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
function getDeviceInfo(deviceId) {
	return new Promise((resolve, reject) => {
		mqttStore.onMessage((topic, message) => {
			if (topic === `/resp/wifi-${deviceId}`) {
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
			let deviceId = deviceTransform(item.serialNumber);
			console.log('订阅', `/resp/wifi-${deviceId}`);
			mqttStore.subscribe(`/resp/wifi-${deviceId}`);
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
/** 查询部门下拉树结构 */
function getDeptTree() {
	deptTreeSelect().then(response => {
		deptOptions.value = response.data;
	});
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
const deviceTransform = serialNumber => {
	// 将serialNumber:GF-B4C2E0E6EFDC转换为去掉GF-
	let deviceId = serialNumber.replace('GF-', '');
	console.log('🥵 ~ deviceTransform ~ deviceId: ', deviceId);
	return deviceId;
};
getDeptTree();
onMounted(() => {
	mqttStore.connect();
	nextTick(() => {
		getList();
	});
});
// 页面卸载时断开连接
onBeforeUnmount(() => {
	mqttStore.disconnect();
});
</script>
<style lang="scss">
.device_image {
	width: 150px;
}
</style>
