/*
 * @Author: 17630921248 1245634367@qq.com
 * @Date: 2025-08-08 17:33:33
 * @LastEditors: 17630921248 1245634367@qq.com
 * @LastEditTime: 2026-06-29 08:14:06
 * @FilePath: \gf-admin\src\api\gf\serviceRecords\index.js
 * @Description: Fuck Bug
 * 微信：lizx2066
 */
import request from '@/utils/request'

// 查询服务记录列表
export function listServiceRecords(query) {
  return request({
    url: '/gf/serviceRecords/list',
    method: 'get',
    params: query
  })
}

// 查询服务记录详细
export function getServiceRecords(id) {
  return request({
    url: '/gf/serviceRecords/' + id,
    method: 'get'
  })
}

// 新增服务记录
export function addServiceRecords(data) {
  return request({
    url: '/gf/serviceRecords',
    method: 'post',
    data: data
  })
}

// 修改服务记录
export function updateServiceRecords(data) {
  return request({
    url: '/gf/serviceRecords',
    method: 'put',
    data: data
  })
}

// 删除服务记录
export function delServiceRecords(id) {
  return request({
    url: '/gf/serviceRecords/' + id,
    method: 'delete'
  })
}

// 查询服务会话列表（按sessionId聚合，同一50分钟周期合并为一条）
export function listServiceSession(query) {
  return request({
    url: '/gf/serviceRecords/sessionList',
    method: 'get',
    params: query
  })
}

// 查询某会话的详细记录（展开查看暂停/恢复明细）
export function getSessionDetail(sessionId) {
  return request({
    url: '/gf/serviceRecords/sessionDetail/' + sessionId,
    method: 'get'
  })
}
