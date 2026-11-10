<template>
  <div ref="pageContainer" class="app-container device-command-center" :style="{ height: pageHeight }">
    <div class="toolbar"><div><div class="eyebrow">禾壹净 · 设备管理</div><h2>设备分布</h2></div><div class="home-actions"><el-button icon="Switch" @click="emit('switch-home')">切换到数据统计</el-button><el-button :loading="loading" @click="loadDevices">刷新设备 ↻</el-button></div></div>
    <div class="overview-grid">
      <div class="overview-card"><span>接入设备</span><strong>{{ devices.length }}<small>台</small></strong></div>
      <div class="overview-card online"><span>在线设备</span><strong>{{ devices.filter(d => d.onlineState.label === '在线').length }}<small>台</small></strong></div>
      <div class="overview-card"><span>已定位设备</span><strong>{{ located.length }}<small>台</small></strong></div>
      <div class="overview-card pending"><span>待定位设备</span><strong>{{ devices.length - located.length }}<small>台</small></strong></div>
    </div>
    <div class="filters"><department-select v-model="deptId" placeholder="归属部门" /><el-input v-model="keyword" clearable placeholder="搜索设备编号、部门" /><el-select v-model="status" clearable placeholder="全部状态"><el-option label="在线" value="online" /><el-option label="离线" value="offline" /><el-option label="状态未知" value="unknown" /></el-select><el-button @click="resetFilters">重置</el-button><el-button @click="fitView">查看全部点位</el-button></div>
    <el-alert v-if="error" :title="error" type="warning" :closable="false" />
    <div class="map-layout" v-loading="loading"><aside><div class="fleet-heading"><span>设备清单</span><small>{{ filtered.length }} 台</small></div><div v-for="item in filtered" :key="item.id" class="device-row" @click="focus(item)"><el-tag :type="item.onlineState.type" :title="item.onlineState.detail" size="small">{{ item.onlineState.label }}</el-tag><strong>{{ item.deptName || '尚未绑定' }}</strong><p>{{ item.serialNumber }}</p><p><el-tag :type="item.runtimeState.type" size="small">{{ item.runtimeState.label }}</el-tag></p><small>{{ item.device?.networkAddress || '暂无网络地址' }}</small><p v-if="!position(item)">暂无有效坐标</p></div><el-empty v-if="!filtered.length" description="暂无设备" /></aside><div ref="container" class="map"><div v-if="!ready" class="placeholder">{{ error || '地图加载中…' }}</div></div></div>
  </div>
</template>
<script setup name="DeviceMap">
import { ref, computed, watch, onMounted, onBeforeUnmount, onActivated, onDeactivated } from 'vue';
import { listDevice } from '@/api/gf/device';
import { getDeviceStates } from '../device/deviceStatus';
const deviceRows = ref([]), statusNow = ref(Date.now());
const devices = computed(() => deviceRows.value.map(item => ({ ...item, ...getDeviceStates(item, statusNow.value) })));
let active = true, selectedId = null, fetchingDevices = false;
const emit = defineEmits(['switch-home']);
const deptId = ref(null), keyword = ref(''), status = ref(''), loading = ref(false), error = ref(''), ready = ref(false), container = ref(null);
const pageContainer = ref(null);
const pageHeight = ref('calc(100dvh - 84px)');
function resizePage() {
  if (pageContainer.value) {
    pageHeight.value = Math.max(0, window.innerHeight - pageContainer.value.getBoundingClientRect().top) + 'px';
  }
  requestAnimationFrame(() => map?.resize());
}
let map, markers = [], info, disposed = false;
function position(item) {
  const { longitude, latitude } = item.device || {};
  if (longitude == null || latitude == null || longitude === '' || latitude === '') return null;
  const lng = Number(longitude), lat = Number(latitude);
  return Number.isFinite(lng) && Number.isFinite(lat) && Math.abs(lng) <= 180 && Math.abs(lat) <= 90 && (lng !== 0 || lat !== 0) ? [lng, lat] : null;
}
const located = computed(() => devices.value.filter(position));
const filtered = computed(() => devices.value.filter(d => (!status.value || ({ '在线': 'online', '离线': 'offline', '状态未知': 'unknown' }[d.onlineState.label]) === status.value) && `${d.serialNumber || ''} ${d.deptName || ''}`.toLowerCase().includes(keyword.value.trim().toLowerCase())));
async function loadDevices(silent = false) {
  silent = silent === true;
  if (fetchingDevices) return;
  fetchingDevices = true;
  if (!silent) loading.value = true;
  const requestedDeptId = deptId.value;
  try {
    const rows = []; let pageNum = 1;
    while (true) {
      const res = await listDevice({ pageNum, pageSize: 100, deptId: requestedDeptId });
      const data = res.data;
      if (!data || !Array.isArray(data.rows)) throw new Error('设备列表响应格式异常');
      const batch = data.rows; rows.push(...batch);
      if (!batch.length || rows.length >= Number(data.total)) break;
      pageNum++;
    }
    if (!disposed && active && requestedDeptId === deptId.value) { deviceRows.value = rows; statusNow.value = Date.now(); }
  } catch (_) { error.value = '设备加载失败，请刷新重试'; }
  finally { loading.value = false; fetchingDevices = false; if (!disposed && active && requestedDeptId !== deptId.value) loadDevices(); }
}
function resetFilters() {
  keyword.value = '';
  status.value = '';
  if (deptId.value == null || deptId.value === '') {
    loadDevices();
  } else {
    deptId.value = null;
  }
}
function fitView() { if (map && markers.length) map.setFitView(markers, false, [60, 60, 60, 60], 15); }
function focus(item) {
  const point = position(item); if (!point || !map) return;
  selectedId = item.id;
  info.close();
  // 先同步定位到设备，再以设备坐标为中心放大，避免大范围缩放时中心点仍在过渡。
  map.setCenter(point, true);
  map.setZoomAndCenter(Math.max(map.getZoom(), 15), point, true);
  const content = document.createElement('section');
  content.className = 'device-map-popup';
  const header = document.createElement('header');
  header.className = 'device-map-popup__header';
  const title = document.createElement('strong');
  title.textContent = item.deptName || '尚未绑定';
  const badge = document.createElement('span');
  const online = item.onlineState.label === '在线';
  badge.className = `device-map-popup__status ${online ? 'is-online' : ''}`;
  badge.textContent = item.onlineState.label;
  badge.title = item.onlineState.detail;
  const closeButton = document.createElement('button');
  closeButton.className = 'device-map-popup__close';
  closeButton.type = 'button';
  closeButton.setAttribute('aria-label', '关闭设备信息');
  closeButton.textContent = '×';
  closeButton.onclick = event => { event.stopPropagation(); selectedId = null; info.close(); };
  header.append(title, badge, closeButton); content.appendChild(header);
  const fields = [
    ['设备编号', item.serialNumber || '—'],
    ['运行状态', item.runtimeState.label],
    ['最后心跳', item.device?.lastReportTime || '暂无心跳'],
    ['网络地址', item.device?.networkAddress || '暂无网络地址'],
    ['经纬度', `${point[0]}, ${point[1]}`],
  ];
  fields.forEach(([label, value]) => {
    const row = document.createElement('div'); row.className = 'device-map-popup__field';
    const caption = document.createElement('span'); caption.textContent = label;
    const text = document.createElement('div'); text.textContent = value;
    row.append(caption, text); content.appendChild(row);
  });
  info.setContent(content); info.open(map, point);
}
function draw() {
  if (!map) return;
  const firstDraw = !markers.length;
  info.close(); map.remove(markers);
  markers = filtered.value.filter(position).map(item => {
    const marker = new window.AMap.CircleMarker({ center: position(item), radius: 9, fillColor: item.onlineState.label === '在线' ? '#20b486' : item.onlineState.label === '离线' ? '#8995a5' : '#e6a23c', fillOpacity: 0.9, strokeColor: '#fff', strokeWeight: 2, bubble: false, cursor: 'pointer' });
    marker.on('click', () => focus(item)); return marker;
  });
  map.add(markers);
  if (firstDraw) fitView();
  const selected = filtered.value.find(item => item.id === selectedId);
  if (selected) focus(selected);
}
async function initMap() {
  const key = import.meta.env.VITE_APP_AMAP_KEY;
  if (!key) { error.value = '请配置高德地图 VITE_APP_AMAP_KEY 和安全密钥或安全代理后重启前端'; return; }
  try {
    if (!window.AMap) await new Promise((resolve, reject) => {
      const serviceHost = import.meta.env.VITE_APP_AMAP_SERVICE_HOST;
      window._AMapSecurityConfig = serviceHost ? { serviceHost } : { securityJsCode: import.meta.env.VITE_APP_AMAP_SECURITY_CODE };
      const script = document.createElement('script');
      const timer = setTimeout(() => { script.remove(); reject(new Error('timeout')); }, 15000);
      script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(key)}`;
      script.onload = () => { clearTimeout(timer); resolve(); };
      script.onerror = () => { clearTimeout(timer); script.remove(); reject(new Error('load')); };
      document.head.appendChild(script);
    });
    if (disposed) return;
    map = new window.AMap.Map(container.value, { zoom: 4, center: [104.2, 35.8], resizeEnable: true });
    info = new window.AMap.InfoWindow({ closeWhenClickMap: true, autoMove: false });
    map.on('click', () => { selectedId = null; info.close(); });
    ready.value = true; draw();
  } catch (_) { error.value = '地图加载失败，请检查高德配置和网络后重新打开首页'; }
}
watch(deptId, loadDevices); watch(filtered, draw);
onMounted(() => { resizePage(); window.addEventListener('resize', resizePage); loadDevices(); initMap(); });
onActivated(() => { active = true; requestAnimationFrame(resizePage); });
onDeactivated(() => { active = false; });
onBeforeUnmount(() => { window.removeEventListener('resize', resizePage); disposed = true; map?.destroy(); map = null; });
</script>
<style scoped>
.toolbar { display: flex; justify-content: space-between; align-items: center; }h2 { margin: 0; color: #23364b; }.toolbar p { color: #8491a0; }
.filters { display: flex; flex-wrap: wrap; gap: 12px; margin: 18px 0; }.filters > * { width: 220px; }.filters .el-button { width: auto; }
.map-layout { display: grid; grid-template-columns: 300px minmax(0, 1fr); height: calc(100vh - 300px); min-height: 500px; margin-top: 16px; border: 1px solid #e6ebf1; border-radius: 12px; overflow: hidden; }aside { overflow: auto; background: #fff; }
.device-row { padding: 20px; border-bottom: 1px solid #edf0f4; cursor: pointer; }.device-row:hover { background: #f0faf8; }.device-row .el-tag { float: right; }.device-row p { font-size: 13px; }.device-row p .el-tag { float: none; }.device-row small { color: #8a97a6; line-height: 1.8; }.map { min-width: 0; }.placeholder { height: 100%; display: grid; place-items: center; background: #edf2f6; color: #7c899a; padding: 24px; }
@media(max-width:768px) { .map-layout { grid-template-columns: 1fr; height: auto; }.map { grid-row: 1; height: 450px; }aside { max-height: 300px; } }
</style>
<style>
.device-map-popup { width: 300px; max-width: calc(100vw - 100px); padding: 6px 8px; color: #304358; font-family: inherit; }
.device-map-popup__header { display: flex; align-items: center; gap: 16px; justify-content: space-between; padding: 4px 0 16px; border-bottom: 1px solid #edf0f4; }
.device-map-popup__header strong { font-size: 16px; line-height: 1.5; overflow-wrap: anywhere; }
.device-map-popup__status { flex-shrink: 0; padding: 3px 10px; border-radius: 20px; background: #f0f2f5; color: #8692a2; font-size: 12px; }
.device-map-popup__status.is-online { color: #119b73; background: #e6f7f0; }
.device-map-popup__field { display: grid; grid-template-columns: 58px minmax(0, 1fr); gap: 12px; margin-top: 14px; font-size: 13px; line-height: 1.7; }
.device-map-popup__field > span { color: #929dad; font-size: 12px; }
.device-map-popup__field > div { overflow-wrap: anywhere; }
</style>
<style>
.device-map-popup__close { flex-shrink: 0; border: 0; background: #f3f5f7; color: #718096; width: 28px; height: 28px; border-radius: 50%; font-size: 22px; cursor: pointer; line-height: 1; }
.device-map-popup__close:hover { background: #e6ebf0; color: #23364b; }
.device-map-popup__header strong { flex: 1; }
</style>

<style scoped>
.device-command-center { background: #f3f7f6; color: #233e39; padding: clamp(14px, 2vw, 32px); }
.eyebrow { font-size: 12px; color: #52756b; margin-bottom: 6px; }
.toolbar h2 { font-size: 26px; color: #203f37; }
.overview-grid { margin: 18px 0; display: grid; grid-template-columns: repeat(4, 1fr); background: white; border: 1px solid #dbe6e1; border-radius: 14px; overflow: hidden; }
.overview-card { display: grid; align-content: center; gap: 5px; padding: 14px 24px; border-right: 1px solid #e3ebe7; }
.overview-card:first-child { background: #e1f2eb; }
.overview-card:last-child { border: 0; }
.overview-card span { font-size: 13px; color: #50665e; }
.overview-card strong { font-size: 29px; font-variant-numeric: tabular-nums; }
.overview-card small { font-size: 12px; font-weight: 400; margin-left: 7px; }
.online strong { color: #137453; }.pending strong { color: #996027; }
.filters { padding: 4px 0; }
.map-layout { background: white; border-color: #d8e4df; box-shadow: 0 5px 18px #24493e0c; height: calc(100vh - 345px); }
.map-layout aside { padding: 0; margin: 0; line-height: normal; color: #263d35; border-right: 1px solid #dce7e1; }
.fleet-heading { position: sticky; top: 0; z-index: 1; display: flex; align-items: center; justify-content: space-between; background: #edf5f1; padding: 15px 18px; font-weight: 600; }
.fleet-heading small { font-size: 12px; color: #4c7062; }
.device-row { padding: 14px 18px; }.device-row p { margin: 6px 0; color: #495e56; }.device-row small { color: #586e64; }.device-row:hover { background: #edf7f2; }
@media(max-width:768px) { .overview-grid { grid-template-columns: repeat(2,1fr); }.overview-card { padding: 12px 16px; }.map-layout { height: auto; } }
</style>
<style scoped>
.device-command-center { box-sizing: border-box; display: flex; flex-direction: column; min-height: 0; overflow: hidden; padding: 18px 22px; gap: 12px; }
.toolbar, .overview-grid, .filters, .device-command-center > .el-alert { flex-shrink: 0; }
.overview-grid { margin: 0; }
.filters { margin: 0; padding: 0; }
.map-layout { flex: 1; height: auto; min-height: 0; margin-top: 0; grid-template-rows: minmax(0, 1fr); }
.map-layout aside { min-height: 0; max-height: none; overflow-y: auto; }
.map { height: 100%; min-height: 0; overflow: hidden; }
@media(max-width:768px) {
  .device-command-center { padding: 10px; gap: 8px; }
  .overview-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .overview-card { padding: 8px; }.overview-card span { font-size: 11px; }.overview-card strong { font-size: 22px; }
  .filters { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; }.filters > * { width: 100%; min-width: 0; }
  .map-layout { grid-template-columns: 1fr; grid-template-rows: minmax(0, 2fr) minmax(0, 1fr); }
  .map { grid-row: 1; height: 100%; }.map-layout aside { grid-row: 2; }
}
@media(max-height:650px) {
  .device-command-center { padding: 8px 14px; gap: 6px; }.eyebrow { display: none; }.toolbar h2 { font-size: 20px; }.overview-card { padding: 6px 16px; }.overview-card strong { font-size: 22px; }
}
</style>
<style scoped>
.home-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; }.home-actions .el-button { margin-left: 0; }
</style>
