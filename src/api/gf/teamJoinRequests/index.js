/*
 * @Author: 17630921248 1245634367@qq.com
 * @Date: 2025-08-09 09:36:13
 * @LastEditors: 17630921248 1245634367@qq.com
 * @LastEditTime: 2025-08-09 09:36:19
 * @FilePath: \ryv3\src\api\gf\teamJoinRequests\index.js
 * @Description: Fuck Bug
 * 微信：lizx2066
 */
import request from '@/utils/request'

// 查询团队加入申请列表
export function listTeamJoinRequests(query) {
  return request({
    url: '/gf/teamJoinRequests/list',
    method: 'get',
    params: query
  })
}

// 查询团队加入申请详细
export function getTeamJoinRequests(id) {
  return request({
    url: '/gf/teamJoinRequests/' + id,
    method: 'get'
  })
}

// 新增团队加入申请
export function addTeamJoinRequests(data) {
  return request({
    url: '/gf/teamJoinRequests',
    method: 'post',
    data: data
  })
}

// 修改团队加入申请
export function updateTeamJoinRequests(data) {
  return request({
    url: '/gf/teamJoinRequests',
    method: 'put',
    data: data
  })
}

// 删除团队加入申请
export function delTeamJoinRequests(id) {
  return request({
    url: '/gf/teamJoinRequests/' + id,
    method: 'delete'
  })
}

// 同意团队加入申请
export function agreeJoinTeamApi(data) {
  return request({
    url: `/gf/teamJoinRequests/${data.id}/${data.status}`,
    method: 'put'
  })
}

