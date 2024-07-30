/*
 * @Author: 17630921248 1245634367@qq.com
 * @Date: 2024-05-25 16:30:54
 * @LastEditors: 17630921248 1245634367@qq.com
 * @LastEditTime: 2024-07-19 09:38:10
 * @FilePath: \RuoYi-Vue3\src\store\modules\useSocketStore.js
 * @Description: Fuck Bug
 * 微信：My-World-40
 */
import { defineStore } from 'pinia';
import { reactive } from 'vue';
import { getUserName } from '@/utils/auth'
import { dayjs } from 'element-plus'
import { getToken } from '@/utils/auth'
export const useSocketStore = defineStore('socket', () => {
  const state = reactive({
    socketUrl: import.meta.env.VITE_APP_SOCKET_SERVER_URL, // socket地址
    websocket: null, // websocket 实例
    heartTime: null, // 心跳定时器实例
    socketHeartFrequency: 3, // 心跳次数
    socketHeart: 0, // 心跳已发次数
    heartTimeOut: 3000, // 心跳超时时间
    socketError: 0, // 错误次数
  });
  const getNowDateTime = () => {
    return dayjs(new Date()).format('YYYY-MM-DD HH:mm')
  }
  // 初始化socket
  const initWebSocket = (url) => {
    // 初始化 websocket
    state.websocket = new WebSocket(state.socketUrl, getToken());
    websocketonopen();
    websocketonmessage();
    sendSocketHeart()
  };

  // socket 连接成功
  const websocketonopen = () => {
    state.websocket.onopen = function (e) {
      console.log("连接 websocket 成功", getNowDateTime(), e);
      resetHeart();
    };
  };

  // socket 连接失败
  const websocketonerror = () => {
    state.websocket.onerror = function (e) {
      console.log("连接 websocket 失败", getNowDateTime(), e);
    };
  };

  // socket 断开链接
  const websocketclose = () => {
    state.websocket.onclose = function (e) {
      console.log("断开连接", getNowDateTime(), e);
    };
  };

  // socket 接收数据
  const websocketonmessage = () => {
    state.websocket.onmessage = function (e) {
      let msg = JSON.parse(e.data);
      if (msg.type === 'heartbeat') {
        resetHeart()
        console.log("心跳", getNowDateTime());
      }
      // console.log("收到socket消息", JSON.parse(e.data));
      // test(msg) // 测试数据
    };
  };

  // socket 发送数据
  const sendMsg = (data) => {
    state.websocket.send(data);
  };

  // socket 错误
  const websocketError = () => {
    state.websocket.onerror = function (e) {
      console.log("socket 错误", getNowDateTime(), e);
    };
  };

  // socket 重置心跳
  const resetHeart = () => {
    state.socketHeart = 0;
    state.socketError = 0;
    clearInterval(state.heartTime);
    sendSocketHeart();
  };

  // socket心跳发送
  const sendSocketHeart = () => {
    state.heartTime = setInterval(() => {
      if (state.socketHeart < state.socketHeartFrequency) {
        console.log("心跳发送：", getNowDateTime(), state.socketHeart);
        state.websocket.send(
          JSON.stringify({
            content: "",
            requestId: getUserName(),
            type: "heartbeat"
          })
        );
        state.socketHeart = state.socketHeart + 1;
      } else {
        reconnect()
      }
    }, state.heartTimeOut);
  };

  // socket重连
  const reconnect = () => {
    if (state.socketError <= 2) {
      clearInterval(state.heartTime);
      initWebSocket(state.socketUrl);
      state.socketError = state.socketError + 1;
      console.log("socket重连", getNowDateTime(), state.socketError);
    } else {
      console.log("重试次数已用完的逻辑", getNowDateTime(), state.socketError);
      clearInterval(state.heartTime);
    }
  };

  // 测试收到消息传递
  const test = (msg) => {
    switch (msg.type) {
      case 'heartbeat': //加入会议
        mitts.emit('heartbeat', msg)
        break;
    }
  }

  return {
    state,
    initWebSocket,
    websocketonmessage,
    sendMsg,
    websocketonopen,
    websocketonerror,
    websocketclose,
    websocketError,
    resetHeart,
    sendSocketHeart,
    reconnect,
  };
});
