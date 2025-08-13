<!--
 * @Author: 17630921248 1245634367@qq.com
 * @Date: 2025-08-13 11:14:53
 * @LastEditors: 17630921248 1245634367@qq.com
 * @LastEditTime: 2025-08-13 11:50:19
 * @FilePath: \ryv3\src\views\system\dept\selectUser.vue
 * @Description: Fuck Bug
 * 微信：lizx2066
-->
<template>
   <!-- 授权用户 -->
   <el-dialog title="选择用户" v-model="visible" width="800px" top="5vh" append-to-body>
      <el-form :model="queryParams" ref="queryRef" :inline="true">
         <el-form-item label="用户名称" prop="userName">
            <el-input v-model="queryParams.userName" placeholder="请输入用户名称" clearable style="width: 200px"
               @keyup.enter="handleQuery" />
         </el-form-item>
         <el-form-item label="手机号码" prop="phonenumber">
            <el-input v-model="queryParams.phonenumber" placeholder="请输入手机号码" clearable style="width: 200px"
               @keyup.enter="handleQuery" />
         </el-form-item>
         <el-form-item>
            <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
         </el-form-item>
      </el-form>
      <el-row>
         <el-table ref="refTable" :data="userList" height="260px" @row-click="clickRow">
            <el-table-column label="选择" width="60" align="center">
               <template #default="scope">
                  <el-radio :model-value="selectedUserId" :value="scope.row.userId"
                     @change="handleRadioChange(scope.row)" />
               </template>
            </el-table-column>
            <el-table-column label="用户名称" prop="userName" :show-overflow-tooltip="true" />
            <el-table-column label="用户昵称" prop="nickName" :show-overflow-tooltip="true" />
            <el-table-column label="邮箱" prop="email" :show-overflow-tooltip="true" />
            <el-table-column label="手机" prop="phonenumber" :show-overflow-tooltip="true" />
            <el-table-column label="状态" align="center" prop="status">
               <template #default="scope">
                  <dict-tag :options="sys_normal_disable" :value="scope.row.status" />
               </template>
            </el-table-column>
            <el-table-column label="创建时间" align="center" prop="createTime" width="180">
               <template #default="scope">
                  <span>{{ parseTime(scope.row.createTime) }}</span>
               </template>
            </el-table-column>
         </el-table>
         <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
            v-model:limit="queryParams.pageSize" @pagination="getList" />
      </el-row>
      <template #footer>
         <div class="dialog-footer">
            <el-button type="primary" @click="handleSelectUser">确 定</el-button>
            <el-button @click="visible = false">取 消</el-button>
         </div>
      </template>
   </el-dialog>
</template>

<script setup name="SelectUser">
import { authUserSelectAll } from "@/api/system/role";
import { listUser } from "@/api/system/user";

const props = defineProps({
   roleId: {
      type: [Number, String]
   }
});

const { proxy } = getCurrentInstance();
const { sys_normal_disable } = proxy.useDict("sys_normal_disable");

const userList = ref([]);
const visible = ref(false);
const total = ref(0);

const selectedUserId = ref(null); // 单选ID
const selectedUser = ref(null); // 单选行数据

const queryParams = reactive({
   pageNum: 1,
   pageSize: 10,
   roleId: undefined,
   userName: undefined,
   phonenumber: undefined
});

// 显示弹框
function show() {
   queryParams.roleId = props.roleId;
   getList();
   visible.value = true;
}
// 隐藏弹框
function hide() {
   console.log('ces', )
   selectedUserId.value = null
   selectedUser.value = null
   queryParams.pageNum = 1;
   emit("ok");
   visible.value = false;
}
// 点击行时选中
function clickRow(row) {
   selectedUserId.value = row.userId;
   selectedUser.value = row;
}
// Radio 改变事件
function handleRadioChange(row) {
   selectedUserId.value = row.userId;
   selectedUser.value = row;
}

// 查询表数据
function getList() {
   listUser(queryParams).then(res => {
      userList.value = res.rows;
      total.value = res.total;
   });
}
/** 搜索按钮操作 */
function handleQuery() {
   queryParams.pageNum = 1;
   getList();
}
/** 重置按钮操作 */
function resetQuery() {
   proxy.resetForm("queryRef");
   handleQuery();
}
const emit = defineEmits(["setUserInfo"]);
/** 选择授权用户操作 */
function handleSelectUser() {
   const uId = selectedUserId.value;
   const userInfo = selectedUser.value
   if (!uId) {
      proxy.$modal.msgError("请选择的用户");
      return;
   }
   emit("setUserInfo", userInfo);
}

defineExpose({
   show,
   hide
});
</script>
