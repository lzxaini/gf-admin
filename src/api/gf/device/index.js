import request from '@/utils/request'

// 查询GF设备管理列表
export function listDevice(query) {
  return request({
    url: '/gf/device/list',
    method: 'get',
    params: query
  })
}

// 查询GF设备管理详细
export function getDevice(id) {
  return request({
    url: '/gf/device/' + id,
    method: 'get'
  })
}

// 新增GF设备管理
export function addDevice(data) {
  return request({
    url: '/gf/device',
    method: 'post',
    data: data
  })
}

// 修改GF设备管理
export function updateDevice(data) {
  return request({
    url: '/gf/device',
    method: 'put',
    data: data
  })
}

// 删除GF设备管理
export function delDevice(id) {
  return request({
    url: '/gf/device/' + id,
    method: 'delete'
  })
}
