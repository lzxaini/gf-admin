<!--
 * @Author: 17630921248 1245634367@qq.com
 * @Date: 2026-08-14
 * @LastEditors: 17630921248 1245634367@qq.com
 * @LastEditTime: 2026-08-14
 * @FilePath: \gf-admin\src\views\gf\appVersion\index.vue
 * @Description: APP版本管理
 * 微信：lizx2066
-->
<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="版本号" prop="version">
        <el-input
          v-model="queryParams.version"
          placeholder="请输入版本号"
          clearable
          style="width: 200px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="强制更新" prop="forceUpdate">
        <el-select v-model="queryParams.forceUpdate" placeholder="是否强制更新" clearable style="width: 120px">
          <el-option label="否" :value="0" />
          <el-option label="是" :value="1" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="Plus"
          @click="handleAdd"
          v-hasPermi="['gf:appVersion:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['gf:appVersion:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['gf:appVersion:remove']"
        >删除</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="appVersionList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="版本号" align="center" prop="version" width="140" />
      <el-table-column label="是否强制更新" align="center" width="110">
        <template #default="scope">
          <el-tag :type="scope.row.forceUpdate === 1 ? 'danger' : 'info'">
            {{ scope.row.forceUpdate === 1 ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="WGET更新" align="center" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.wgetUpdate === 1 ? 'warning' : 'info'">
            {{ scope.row.wgetUpdate === 1 ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="安装包大小" align="center" prop="fileSize" width="110" />
      <el-table-column label="下载链接" align="center" min-width="220">
        <template #default="scope">
          <el-link v-if="scope.row.downloadUrl" type="primary" :href="scope.row.downloadUrl" target="_blank" :underline="false">
            {{ scope.row.downloadUrl }}
          </el-link>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="更新说明" align="center" prop="updateMessage" min-width="200" show-overflow-tooltip />
      <el-table-column label="创建时间" align="center" prop="createTime" width="170" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['gf:appVersion:edit']">修改</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['gf:appVersion:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加或修改APP版本对话框 -->
    <el-dialog :title="title" v-model="open" width="620px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="版本号" prop="version">
          <el-input v-model="form.version" placeholder="请输入版本号，如 2.0.0" />
        </el-form-item>
        <el-form-item label="强制更新" prop="forceUpdate">
          <el-radio-group v-model="form.forceUpdate">
            <el-radio :label="0">否</el-radio>
            <el-radio :label="1">是</el-radio>
          </el-radio-group>
          <div class="el-form-item-tip">开启后，APP 检测到新版本将不允许取消，必须升级</div>
        </el-form-item>
        <el-form-item label="WGET更新" prop="wgetUpdate">
          <el-radio-group v-model="form.wgetUpdate">
            <el-radio :label="0">否</el-radio>
            <el-radio :label="1">是</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="更新说明" prop="updateMessage">
          <el-input
            v-model="form.updateMessage"
            type="textarea"
            :rows="4"
            placeholder="请输入本次更新的说明内容"
          />
        </el-form-item>
        <el-form-item label="安装包上传" prop="downloadUrl">
          <el-upload
            ref="uploadRef"
            :action="baseUrl + '/gf/appVersion/upload'"
            :headers="headers"
            :show-file-list="false"
            :before-upload="handleBeforeUpload"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :limit="1"
          >
            <el-button type="primary" icon="Upload">上传安装包</el-button>
          </el-upload>
          <div class="el-form-item-tip">支持 apk / ipa / aab 格式，单个文件不超过 500MB；上传成功后自动填充下载链接与大小</div>
        </el-form-item>
        <el-form-item label="下载链接" prop="downloadUrl">
          <el-input v-model="form.downloadUrl" placeholder="可手动填写，或通过上方上传安装包自动生成" clearable />
        </el-form-item>
        <el-form-item label="安装包大小" prop="fileSize">
          <el-input v-model="form.fileSize" placeholder="上传安装包后自动填充" clearable />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="AppVersion">
import { listAppVersion, getAppVersion, addAppVersion, updateAppVersion, delAppVersion } from "@/api/gf/appVersion";
import { getToken } from "@/utils/auth";

const { proxy } = getCurrentInstance();

const appVersionList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");

const baseUrl = import.meta.env.VITE_APP_BASE_API;
const headers = ref({ Authorization: "Bearer " + getToken() });
const uploadRef = ref(null);

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    version: null,
    forceUpdate: null,
  },
  rules: {
    version: [{ required: true, message: "版本号不能为空", trigger: "blur" }],
    forceUpdate: [{ required: true, message: "请选择是否强制更新", trigger: "change" }],
    wgetUpdate: [{ required: true, message: "请选择是否WGET更新", trigger: "change" }],
    downloadUrl: [{ required: true, message: "下载链接不能为空", trigger: "blur" }],
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询APP版本管理列表 */
function getList() {
  loading.value = true;
  listAppVersion(queryParams.value).then(response => {
    appVersionList.value = response.data.rows;
    total.value = response.data.total;
    loading.value = false;
  });
}

/** 取消按钮 */
function cancel() {
  open.value = false;
  reset();
}

/** 表单重置 */
function reset() {
  form.value = {
    id: null,
    version: null,
    forceUpdate: 0,
    wgetUpdate: 0,
    updateMessage: null,
    downloadUrl: null,
    fileSize: null,
    remark: null,
  };
  proxy.resetForm("formRef");
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm("queryRef");
  handleQuery();
}

/** 多选框选中数据 */
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.id);
  single.value = selection.length !== 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加APP版本";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const id = row.id || ids.value;
  getAppVersion(id).then(response => {
    form.value = response.data;
    open.value = true;
    title.value = "修改APP版本";
  });
}

/** 上传前校验 */
function handleBeforeUpload(file) {
  const fileName = file.name.split(".");
  const fileExt = fileName[fileName.length - 1].toLowerCase();
  if (!["apk", "ipa", "aab"].includes(fileExt)) {
    proxy.$modal.msgError(`文件格式不正确，请上传 apk/ipa/aab 格式安装包！`);
    return false;
  }
  const isLt = file.size / 1024 / 1024 < 500;
  if (!isLt) {
    proxy.$modal.msgError("上传安装包大小不能超过 500MB！");
    return false;
  }
  proxy.$modal.loading("正在上传安装包，请稍候...");
  return true;
}

/** 上传成功回调 */
function handleUploadSuccess(res, file) {
  proxy.$modal.closeLoading();
  if (res.code === 200) {
    form.value.downloadUrl = res.url;
    form.value.fileSize = Number(res.fileSize).toFixed(2) + "MB";
    proxy.$modal.msgSuccess("安装包上传成功");
  } else {
    proxy.$modal.msgError(res.msg || "上传失败");
  }
  uploadRef.value && uploadRef.value.clearFiles();
}

/** 上传失败回调 */
function handleUploadError(err) {
  proxy.$modal.closeLoading();
  proxy.$modal.msgError("上传失败，请稍后重试");
  uploadRef.value && uploadRef.value.clearFiles();
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["formRef"].validate(valid => {
    if (valid) {
      if (form.value.id != null) {
        updateAppVersion(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addAppVersion(form.value).then(response => {
          proxy.$modal.msgSuccess("新增成功");
          open.value = false;
          getList();
        });
      }
    }
  });
}

/** 删除按钮操作 */
function handleDelete(row) {
  const versionIds = row.id || ids.value;
  proxy.$modal.confirm('是否确认删除APP版本编号为"' + versionIds + '"的数据项？').then(function () {
    return delAppVersion(versionIds);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}

getList();
</script>

<style scoped>
.el-form-item-tip {
  width: 100%;
  line-height: 1.5;
  font-size: 12px;
  color: #909399;
}
</style>
