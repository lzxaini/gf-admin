/*
 * @Author: 17630921248 1245634367@qq.com
 * @Date: 2026-04-13 15:25:24
 * @LastEditors: 17630921248 1245634367@qq.com
 * @LastEditTime: 2026-04-13 15:25:26
 * @FilePath: \ryv3\src\utils\lua.js
 * @Description: Fuck Bug
 * 微信：lizx2066
 */
--  第一版透传指令
local sys = require("sys")

------------------------------------------------
-- MQTT → 串口：自动追加 \n
------------------------------------------------
sys.reg_net(1, "net_callback")

function net_callback(channel_id, event, type, topic, data)
    -- 只处理下发数据
    if event == 2 then
        sys.net_write("6", {data, "\n"})
    end
    return 1  -- 拦截，不透传
end

------------------------------------------------
-- 串口 → MQTT：直接透传
------------------------------------------------
function uart1_callback_string(data)
    -- 去掉回车和换行（有就去，没有就不动）
    data = data:gsub("[\r\n]", "")
    sys.net_write("1", data)
    return 1  -- 拦截，不透传
end

sys.reg_uart(1, "uart1_callback_string", 2)