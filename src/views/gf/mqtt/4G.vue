<!--
 * @Author: 17630921248 1245634367@qq.com
 * @Date: 2026-01-06 16:57:32
 * @LastEditors: 17630921248 1245634367@qq.com
 * @LastEditTime: 2026-01-16 14:22:40
 * @FilePath: \ryv3\src\views\gf\mqtt\4G.vue
 * @Description: 4G模块通信对话框
 * 微信:lizx2066
-->
<template>
	<el-dialog v-model="dialogVisible" :title="`4G模块通信 - ${clientId}`" width="800px" :close-on-click-modal="false" @close="handleClose">
		<!-- 快捷指令按钮 -->
		<div class="command-buttons">
			<el-button v-for="cmd in commands" :key="cmd.command" :type="cmd.type" size="small" @click="handleCommandClick(cmd)">
				{{ cmd.label }}
			</el-button>
		</div>

		<!-- 聊天消息区域 -->
		<div ref="messageContainer" class="message-container">
			<div v-for="(msg, index) in messages" :key="index" class="message-item" :class="msg.type">
				<div class="message-time">{{ msg.time }}</div>
				<div class="message-bubble">
					<div class="message-label">
						{{ msg.label }}
						<el-button 
							v-if="msg.location" 
							type="primary" 
							size="small" 
							link 
							@click="openBaiduMap(msg.location)"
							style="margin-left: 8px;"
						>
							<el-icon><Location /></el-icon>
							查看基站位置（非设备位置）
						</el-button>
					</div>
					<div class="message-content" v-if="msg.isJson">
						<pre>{{ msg.content }}</pre>
					</div>
					<div class="message-content" v-else>{{ msg.content }}</div>
				</div>
			</div>
			<div v-if="messages.length === 0" class="empty-message">
				<el-empty description="暂无消息，请选择指令发送" />
			</div>
		</div>

		<!-- 自定义指令输入 -->
		<div class="custom-input">
			<el-input v-model="customCommand" placeholder="输入自定义指令，如：AT+CSQ\r\n" @keyup.enter="sendCustomCommand">
				<template #append>
					<el-button type="primary" @click="sendCustomCommand" :loading="sending">发送</el-button>
				</template>
			</el-input>
		</div>

		<template #footer>
			<el-button @click="clearMessages" icon="Delete">清空消息</el-button>
			<el-button @click="handleClose">关闭</el-button>
		</template>
	</el-dialog>
</template>

<script setup>
import { ref, nextTick, watch } from 'vue';
import { useMQTTStore } from '@/store/modules/useMQTTStore';
import dayjs from 'dayjs';
import { Location } from '@element-plus/icons-vue';

const mqttStore = useMQTTStore();
const { proxy } = getCurrentInstance();

// Props
const props = defineProps({
	modelValue: {
		type: Boolean,
		default: false,
	},
	clientId: {
		type: String,
		default: '',
	},
});

// Emits
const emit = defineEmits(['update:modelValue']);

// Data
const dialogVisible = ref(false);
const messages = ref([]);
const customCommand = ref('');
const sending = ref(false);
const messageContainer = ref(null);

// 预定义指令列表
const commands = [
	{ label: '设备重启', command: 'AT+RESET\\r\\n', type: 'danger', isHex: false, needConfirm: true },
	{ label: '获取IMEI', command: 'AT+IMEI\\r\\n', type: 'info', isHex: false, needConfirm: false },
	{ label: '信号强度', command: 'AT+CSQ\\r\\n', type: 'primary', isHex: false, needConfirm: false },
	// { label: 'UTC时间', command: 'AT+UTC\\r\\n', type: 'success', isHex: false, needConfirm: false },
	{ label: '基站定位', command: 'AT+LBS\\r\\n', type: 'warning', isHex: false, needConfirm: false },
	{ label: '网络状态', command: 'AT+ISLINK\\r\\n', type: 'info', isHex: false, needConfirm: false },
	{ label: '注册状态', command: 'AT+CEREG\\r\\n', type: 'info', isHex: false, needConfirm: false },
	{ label: '远程开启', command: '06000001', type: 'success', isHex: true, needConfirm: true },
	{ label: '强制结束', command: '05000002', type: 'danger', isHex: true, needConfirm: true },
];

// Watch modelValue
watch(
	() => props.modelValue,
	val => {
		dialogVisible.value = val;
		if (val) {
			// 对话框打开时订阅消息
			subscribeMessages();
		}
	},
	{ immediate: true }
);

watch(dialogVisible, val => {
	emit('update:modelValue', val);
});

// 订阅MQTT消息
function subscribeMessages() {
	if (!props.clientId) return;

	const responseTopic = `/resp/${props.clientId}`;
	mqttStore.subscribe(responseTopic);

	// 监听消息
	mqttStore.onMessage(handleMqttMessage);
}

// 处理按钮点击
function handleCommandClick(cmd) {
	if (cmd.needConfirm) {
		const actionText = cmd.isHex ? `发送HEX指令 ${cmd.command}` : `执行 ${cmd.label}`;
		proxy.$modal
			.confirm(`确认要${actionText}吗？此操作可能会影响设备状态。`)
			.then(() => {
				sendCommand(cmd.command, cmd.isHex);
			})
			.catch(() => {});
	} else {
		sendCommand(cmd.command, cmd.isHex);
	}
}

// 处理MQTT消息
function handleMqttMessage(topic, message) {
	if (topic === `/resp/${props.clientId}`) {
		let displayContent = '';
		let isHexResponse = false;
		let hexLabel = '收到响应';
		
		// 首先检查是否为二进制数据，且首字节是06或05
		let shouldDisplayAsHex = false;
		if (message instanceof Uint8Array || message instanceof ArrayBuffer) {
			const bytes = message instanceof ArrayBuffer ? new Uint8Array(message) : message;
			// 只有06和05开头的显示为HEX
			if (bytes.length > 0 && (bytes[0] === 0x06 || bytes[0] === 0x05)) {
				shouldDisplayAsHex = true;
				displayContent = Array.from(bytes).map(byte => byte.toString(16).padStart(2, '0').toUpperCase()).join(' ');
				isHexResponse = true;
				
				if (bytes[0] === 0x06) {
					hexLabel = '收到响应 (HEX) - 开启设备';
				} else if (bytes[0] === 0x05) {
					hexLabel = '收到响应 (HEX) - 设备心跳';
				}
			}
		}
		// 如果不需要显示为HEX，则作为字符串处理
		if (!shouldDisplayAsHex) {
			const content = message.toString();
			displayContent = content;
			
			// 尝试解析JSON
			try {
				const jsonObj = JSON.parse(content);
				displayContent = JSON.stringify(jsonObj, null, 2);
				isHexResponse = false;
			} catch (e) {
				// 不是JSON，保持原样
			}
		}
		
		// 检查是否为LBS基站定位响应，提取经纬度
		let location = null;
		if (displayContent.includes('+LBS:')) {
			// 匹配格式: +LBS: "120.690005","31.128406"
			const lbsMatch = displayContent.match(/\+LBS:\s*"([^"]+)"\s*,\s*"([^"]+)"/);
			if (lbsMatch) {
				const lng = lbsMatch[1]; // 经度
				const lat = lbsMatch[2]; // 纬度
				location = { lng, lat };
			}
		}
		
		addMessage({
			type: 'receive',
			label: isHexResponse ? hexLabel : '收到响应',
			content: displayContent,
			isJson: !isHexResponse && displayContent.includes('{'),
			location: location,
		});
		sending.value = false;
	}
}

// 发送指令
function sendCommand(command, isHex = false) {
	if (!props.clientId) {
		proxy.$modal.msgError('设备ID不存在');
		return;
	}

	if (sending.value) {
		proxy.$modal.msgWarning('请等待上一条指令响应');
		return;
	}

	sending.value = true;
	const requestTopic = `/req/${props.clientId}`;
	
	// 添加发送消息
	addMessage({
		type: 'send',
		label: '发送指令',
		content: command + (isHex ? ' (HEX)' : ''),
		isJson: false,
	});

	// 根据是否为HEX格式处理消息
	let messageToSend = command;
	if (isHex) {
		// 将HEX字符串转换为Uint8Array
		// 例如: '060000010A' -> Uint8Array [06, 00, 00, 01, 0A]
		const hexString = command.replace(/\s/g, ''); // 移除空格
		const buffer = new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
		messageToSend = buffer;
	} else {
		// 转义处理：将 \\r\\n 转换为实际的 \r\n
		messageToSend = command.replace(/\\r/g, '\r').replace(/\\n/g, '\n');
	}

	// 发送MQTT消息
	mqttStore.publish(requestTopic, messageToSend);

	// 5秒超时处理
	setTimeout(() => {
		if (sending.value) {
			sending.value = false;
			addMessage({
				type: 'system',
				label: '系统提示',
				content: '指令超时，未收到设备响应',
				isJson: false,
			});
		}
	}, 5000);
}

// 发送自定义指令
function sendCustomCommand() {
	if (!customCommand.value.trim()) {
		proxy.$modal.msgWarning('请输入指令');
		return;
	}

	sendCommand(customCommand.value, false);
	customCommand.value = '';
}

// 添加消息
function addMessage(msg) {
	messages.value.push({
		...msg,
		time: dayjs().format('HH:mm:ss'),
	});

	// 滚动到底部
	nextTick(() => {
		if (messageContainer.value) {
			messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
		}
	});
}

// 清空消息
function clearMessages() {
	messages.value = [];
}

// 打开百度地图查看位置
function openBaiduMap(location) {
	if (!location || !location.lng || !location.lat) {
		proxy.$modal.msgError('无法获取位置信息');
		return;
	}
	
	// 百度地图URL格式: https://api.map.baidu.com/marker?location=纬度,经度&title=标题&content=内容&output=html
	const url = `https://api.map.baidu.com/marker?location=${location.lat},${location.lng}&title=设备位置&content=经度:${location.lng},纬度:${location.lat}&output=html&src=webapp.baidu.openAPIdemo`;
	
	// 在新窗口打开
	window.open(url, '_blank');
}

// 关闭对话框
function handleClose() {
	dialogVisible.value = false;
	// 取消订阅
	if (props.clientId) {
		mqttStore.offMessage(handleMqttMessage);
	}
}
</script>

<style scoped>
.command-buttons {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	margin-bottom: 16px;
	padding-bottom: 16px;
	border-bottom: 1px solid #ebeef5;
}

.message-container {
	height: 400px;
	overflow-y: auto;
	padding: 16px;
	background: #f5f7fa;
	border-radius: 4px;
	margin-bottom: 16px;
}

.message-item {
	margin-bottom: 16px;
	animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
	from {
		opacity: 0;
		transform: translateY(10px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

.message-time {
	text-align: center;
	font-size: 12px;
	color: #909399;
	margin-bottom: 8px;
}

.message-bubble {
	max-width: 70%;
	padding: 12px;
	border-radius: 8px;
	word-break: break-all;
}

.message-bubble pre {
	margin: 0;
	white-space: pre-wrap;
	word-wrap: break-word;
	font-family: 'Courier New', monospace;
	font-size: 13px;
}

/* 发送消息样式 */
.message-item.send .message-bubble {
	margin-left: auto;
	background: #409eff;
	color: white;
}

.message-item.send .message-label {
	font-size: 12px;
	margin-bottom: 4px;
	opacity: 0.9;
}

.message-item.send .message-content {
	font-size: 14px;
	line-height: 1.5;
}

/* 接收消息样式 */
.message-item.receive .message-bubble {
	background: white;
	color: #303133;
	border: 1px solid #ebeef5;
}

.message-item.receive .message-label {
	font-size: 12px;
	color: #67c23a;
	margin-bottom: 4px;
	font-weight: 600;
	display: flex;
	align-items: center;
	flex-wrap: wrap;
}

.message-item.receive .message-content {
	font-size: 14px;
	line-height: 1.5;
}

/* 系统消息样式 */
.message-item.system .message-bubble {
	margin: 0 auto;
	background: #f4f4f5;
	color: #909399;
	text-align: center;
	border: 1px dashed #dcdfe6;
}

.message-item.system .message-label {
	font-size: 12px;
	margin-bottom: 4px;
}

.message-item.system .message-content {
	font-size: 13px;
}

.empty-message {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 100%;
}

.custom-input {
	margin-top: 16px;
}

/* 滚动条样式 */
.message-container::-webkit-scrollbar {
	width: 6px;
}

.message-container::-webkit-scrollbar-thumb {
	background: #dcdfe6;
	border-radius: 3px;
}

.message-container::-webkit-scrollbar-thumb:hover {
	background: #c0c4cc;
}
</style>
