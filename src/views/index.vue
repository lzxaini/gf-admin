<template>
  <div class="home-page">
    <template v-if="activeHome === 'statistics'">
      <div class="home-switch-bar" v-hasPermi="['gf:map:view']">
        <el-button type="primary" plain icon="Switch" @click="activeHome = 'map'">切换到设备地图</el-button>
      </div>
      <div class="app-container statistics-home"><Statistics /></div>
    </template>
    <DeviceMap v-else @switch-home="activeHome = 'statistics'" />
  </div>
</template>
<script setup name="Index">
import { ref } from 'vue';
import Statistics from './gf/statistics/index.vue';
import DeviceMap from './gf/deviceMap/index.vue';
const activeHome = ref('statistics');
</script>
<style scoped>
.home-switch-bar { display: flex; justify-content: flex-end; padding: 12px 20px 0; }
.statistics-home { padding-top: 12px; }
</style>