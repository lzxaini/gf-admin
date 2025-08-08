/*
 * @Author: 17630921248 1245634367@qq.com
 * @Date: 2025-08-08 17:49:11
 * @LastEditors: 17630921248 1245634367@qq.com
 * @LastEditTime: 2025-08-08 17:49:14
 * @FilePath: \ryv3\src\api\gf\rechargeRecords\index.js
 * @Description: Fuck Bug
 * 微信：lizx2066
 */
import request from '@/utils/request'

// 查询充值记录列表
export function listRechargeRecords(query) {
  return request({
    url: '/gf/rechargeRecords/list',
    method: 'get',
    params: query
  })
}

// 查询充值记录详细
export function getRechargeRecords(id) {
  return request({
    url: '/gf/rechargeRecords/' + id,
    method: 'get'
  })
}

// 新增充值记录
export function addRechargeRecords(data) {
  return request({
    url: '/gf/rechargeRecords',
    method: 'post',
    data: data
  })
}

// 修改充值记录
export function updateRechargeRecords(data) {
  return request({
    url: '/gf/rechargeRecords',
    method: 'put',
    data: data
  })
}

// 删除充值记录
export function delRechargeRecords(id) {
  return request({
    url: '/gf/rechargeRecords/' + id,
    method: 'delete'
  })
}
