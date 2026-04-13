/*
 * @Author: 17630921248 1245634367@qq.com
 * @Date: 2026-04-13 15:25:24
 * @LastEditors: 17630921248 1245634367@qq.com
 * @LastEditTime: 2026-04-13 15:25:26
 * @FilePath: \ryv3\src\utils\lua.js
 * @Description: Fuck Bug
 * 微信：lizx2066
 */
local sys = require("sys")

------------------------------------------------
-- 版本号（新增）
------------------------------------------------
local VERSION = "1.0.57"

------------------------------------------------
-- MQTT → 串口：自动追加 \n
------------------------------------------------
sys.reg_net(1, "net_callback")

function net_callback(channel_id, event, type, topic, data)
    -- 去掉回车换行
    data = data:gsub("[\r\n]", "")

    -- 只处理下发数据
    if event == 2 then
        
        -- ===== 新增：GVI 版本查询 =====
        if data == "GVI" then
            sys.net_write("1", VERSION .. "\n")
            return 1
        end

        -- 原逻辑：透传串口（追加换行）
        sys.net_write("6", {data, "\n"})
    end
    return 1  -- 拦截，不透传
end

------------------------------------------------
-- 串口 → MQTT：直接透传
------------------------------------------------
function uart1_callback_string(data)

    -- 去掉回车换行
    data = data:gsub("[\r\n]", "")

    -- ===== 新增：GVI 版本查询 =====
    if data == "GVI" then
        sys.net_write("6", VERSION .. "\n")
        return 1
    end

    -- 原逻辑：串口 → MQTT
    sys.net_write("1", data)
    return 1
end

sys.reg_uart(1, "uart1_callback_string", 2)