// 后端日期不带时区时按其业务时区（北京时间）解析，避免浏览器时区影响判断。
export function parseReportTime(value) {
	if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
	if (typeof value !== 'string' || !value.trim()) return NaN;
	const text = value.trim();
	const local = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?$/;
	return Date.parse(local.test(text) ? text.replace(' ', 'T') + '+08:00' : text);
}

export function getDeviceStates(item, now, heartbeatSeconds) {
	const value = item.device?.lastReportTime;
	const reportTime = parseReportTime(value);
	const age = now - reportTime;
	// 安卓心跳间隔可配置；传统 WIFI/4G 沿用服务端的 30 秒间隔。
	const interval = item.deviceType === 'ANDROID' ? heartbeatSeconds : 30;
	let onlineState;
	if (!Number.isFinite(reportTime) || age < -5000) {
		onlineState = { label: '状态未知', type: 'info', detail: '缺少有效的最后心跳时间，无法确认在线状态' };
	} else if (!(interval >= 10 && interval <= 3600)) {
		onlineState = { label: '状态未知', type: 'info', detail: `最后心跳：${value}；未获取到心跳间隔配置，无法确认在线状态` };
	} else {
		const online = age < interval * 3 * 1000;
		onlineState = {
			label: online ? '在线' : '离线', type: online ? 'success' : 'info',
			detail: `最后心跳：${value}；连续 ${interval * 3} 秒未上报判为离线`,
		};
	}
	const bound = item.deptId != null && String(item.deptId) !== '' && String(item.deptId) !== '0';
	const states = { '1': { label: '运行中', type: 'success' }, '2': { label: '已停止', type: 'warning' }, '3': { label: '暂停中', type: 'warning' } };
	let runtimeState = !bound ? { label: '未绑定', type: 'info' } : states[String(item.runningState)] || { label: '状态未知', type: 'info' };
	if (bound && runtimeState.label !== '状态未知' && onlineState.label !== '在线') {
		runtimeState = { label: `最后状态：${runtimeState.label}`, type: 'info' };
	}
	return { onlineState, runtimeState };
}
