<!--
 * @Author: 17630921248 1245634367@qq.com
 * @Date: 2026-01-06 16:57:32
 * @LastEditors: 17630921248 1245634367@qq.com
 * @LastEditTime: 2026-01-06 17:09:54
 * @FilePath: \ryv3\src\views\gf\mqtt\4G.vue
 * @Description: 4G模块通信对话框
 * 微信:lizx2066
-->
<template>
	<el-dialog v-model="dialogVisible" :title="`4G模块通信 - ${clientId}`" width="800px" :close-on-click-modal="false" @close="handleClose">
		<!-- 快捷指令按钮 -->
		<div class="command-buttons">
			<el-button v-for="cmd in commands" :key="cmd.command" :type="cmd.type" size="small" @click="sendCommand(cmd.command)">
				{{ cmd.label }}
			</el-button>
		</div>

		<!-- 聊天消息区域 -->
		<div ref="messageContainer" class="message-container">
			<div v-for="(msg, index) in messages" :key="index" class="message-item" :class="msg.type">
				<div class="message-time">{{ msg.time }}</div>
				<div class="message-bubble">
					<div class="message-label">{{ msg.label }}</div>
					<div class="message-content">{{ msg.content }}</div>
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
	{ label: '设备重启', command: 'AT+RESET\\r\\n', type: 'danger' },
	{ label: '获取IMEI', command: 'AT+IMEI\\r\\n', type: 'info' },
	{ label: '信号强度', command: 'AT+CSQ\\r\\n', type: 'primary' },
	{ label: 'UTC时间', command: 'AT+UTC\\r\\n', type: 'success' },
	{ label: '基站定位', command: 'AT+LBS\\r\\n', type: 'warning' },
	{ label: '网络状态', command: 'AT+ISLINK\\r\\n', type: 'info' },
	{ label: '注册状态', command: 'AT+CEREG\\r\\n', type: 'info' },
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

// 处理MQTT消息
function handleMqttMessage(topic, message) {
	if (topic === `/resp/${props.clientId}`) {
		const content = message.toString();
		addMessage({
			type: 'receive',
			label: '收到响应',
			content: content,
		});
		sending.value = false;
	}
}

// 发送指令
function sendCommand(command) {
	if (!props.clientId) {
		proxy.$modal.msgError('设备ID不存在');
		return;
	}

	if (sending.value) {
		proxy.$modal.msgWarning('请等待上一条指令响应');
		return;
	}

	// 转义处理：将 \\r\\n 转换为实际的 \r\n
	const actualCommand = command.replace(/\\r/g, '\r').replace(/\\n/g, '\n');
	
	sending.value = true;
	const requestTopic = `/req/${props.clientId}`;
	
	// 添加发送消息
	addMessage({
		type: 'send',
		label: '发送指令',
		content: command,
	});

	// 发送MQTT消息
	mqttStore.publish(requestTopic, actualCommand);

	// 5秒超时处理
	setTimeout(() => {
		if (sending.value) {
			sending.value = false;
			addMessage({
				type: 'system',
				label: '系统提示',
				content: '指令超时，未收到设备响应',
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

	sendCommand(customCommand.value);
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
