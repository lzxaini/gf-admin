/*
 * @Author: 17630921248 1245634367@qq.com
 * @Date: 2024-07-30 10:33:50
 * @LastEditors: 17630921248 1245634367@qq.com
 * @LastEditTime: 2024-07-30 10:36:02
 * @FilePath: \ryv3\src\utils\tools.js
 * @Description: Fuck Bug
 * 微信：My-World-40
 */
import { dayjs } from 'element-plus'
export function getNowTimes() {
  return dayjs().format('YYYY-MM-DD HH:mm:ss')
}