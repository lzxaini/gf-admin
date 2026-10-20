import request from '@/utils/request'

export function getAppConfig() {
  return request({ url: '/gf/appConfig', method: 'get' })
}

export function updateAppConfig(data) {
  return request({ url: '/gf/appConfig', method: 'put', data, headers: { repeatSubmit: false } })
}

export function controlAppDebug(data) {
  return request({ url: '/gf/appConfig/debug', method: 'put', data })
}
