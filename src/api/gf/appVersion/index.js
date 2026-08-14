/*
 * @Author: lzx 1245634367@qq.com
 * @Date: 2026-08-14 21:00:25
 * @LastEditors: lzx 1245634367@qq.com
 * @LastEditTime: 2026-08-14 21:00:26
 * @FilePath: \gf-serverd:\code\GF-code\gf-admin\src\api\gf\appVersion\index.js
 * @Description: Fuck Bug
 * 微信：lizx2066
 */
import request from '@/utils/request'

// 查询APP版本管理列表
export function listAppVersion(query) {
  return request({
    url: '/gf/appVersion/list',
    method: 'get',
    params: query
  })
}

// 查询APP版本管理详细
export function getAppVersion(id) {
  return request({
    url: '/gf/appVersion/' + id,
    method: 'get'
  })
}

// 新增APP版本管理
export function addAppVersion(data) {
  return request({
    url: '/gf/appVersion',
    method: 'post',
    data: data
  })
}

// 修改APP版本管理
export function updateAppVersion(data) {
  return request({
    url: '/gf/appVersion',
    method: 'put',
    data: data
  })
}

// 删除APP版本管理
export function delAppVersion(id) {
  return request({
    url: '/gf/appVersion/' + id,
    method: 'delete'
  })
}
