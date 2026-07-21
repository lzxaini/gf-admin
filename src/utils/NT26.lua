--[[
Author: 17630921248 1245634367@qq.com
Date: 2026-07-09
LastEditors: 17630921248 1245634367@qq.com
LastEditTime: 2026-07-09
FilePath: \gf-admin\src\utils\NT26.lua
Description: 双向透传 — MQTT ⇔ 串口（基于NT26文档API）
微信：lizx2066
--]]

local rt   = require("rt")
local rtu  = require("rtu")
local uart = require("uart")

------------------------------------------------
-- 版本号
------------------------------------------------
local VERSION = "1.0.60"

------------------------------------------------
-- MQTT → 串口（下行透传）
-- 文档：rtu.reg_chcb / rtu.option / rtu.write
------------------------------------------------
-- 注册回调前先关闭系统内置下行透传（回调接管后由我们手动转发）
rtu.option("pass_down", false)

-- 注册网络通道1回调：拦截 MQTT 下发数据
rtu.reg_chcb(1, function(ch_id, data, meta)
    if not data then return end
    data = data:gsub("[\r\n]", "")
    if data == "" then return end

    -- GVI：返回版本号到 MQTT
    if data == "GVI" then
        rtu.write("1", VERSION .. "\n")
        return
    end

    -- 透传串口（追加换行）
    uart.write(uart.UART1, data .. "\n")
end)

------------------------------------------------
-- 串口 → MQTT（上行透传）
-- 文档：uart.reg / uart.write / rtu.write
------------------------------------------------
uart.reg(uart.UART1, function(id, data, meta)
    if not data then return end
    data = data:gsub("[\r\n]", "")
    if data == "" then return end

    -- GVI：返回版本号到串口，不转发 MQTT（系统 pass_up 不会转发 GVI）
    if data == "GVI" then
        uart.write(uart.UART1, VERSION .. "\n")
        return
    end

    -- 普通数据由系统上行透传（pass_up）自动转发到 MQTT，回调不再重复发送
end)

------------------------------------------------
-- 主循环（必须存在）
------------------------------------------------
while true do
    rt.delay(5000)
end
