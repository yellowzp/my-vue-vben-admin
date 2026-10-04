<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus';

import type { SystemRoleApi } from '#/api/system/role';
import type { SystemUserApi } from '#/api/system/user';

import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElPagination,
  ElRadio,
  ElRadioGroup,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import { getRoleList } from '#/api/system/role';
import {
  addUser,
  deleteUser,
  getUserList,
  updateUser,
} from '#/api/system/user';

defineOptions({ name: 'SystemUser' });

/** 用户状态选项：0=禁用，1=正常，2=锁定，3=永久封禁 */
const STATUS_OPTIONS = [
  { label: '正常', value: 1, type: 'success' },
  { label: '禁用', value: 0, type: 'info' },
  { label: '锁定', value: 2, type: 'warning' },
  { label: '永久封禁', value: 3, type: 'danger' },
] as const;

function statusLabel(status: number) {
  return STATUS_OPTIONS.find((s) => s.value === status)?.label ?? '未知';
}
function statusType(status: number) {
  return STATUS_OPTIONS.find((s) => s.value === status)?.type ?? 'info';
}

const loading = ref(false);
const tableData = ref<SystemUserApi.SystemUser[]>([]);
const total = ref(0);
const roles = ref<SystemRoleApi.SystemRole[]>([]);

const query = reactive<SystemUserApi.UserListParams>({
  pageNum: 1,
  pageSize: 10,
  username: '',
  fullName: '',
  phone: '',
  userStatus: '',
});

function roleName(roleId?: number) {
  if (roleId === undefined || roleId === null) return '-';
  return roles.value.find((r) => r.roleId === roleId)?.roleName ?? roleId;
}

async function loadData() {
  loading.value = true;
  try {
    const res = await getUserList({ ...query });
    tableData.value = res.items;
    total.value = res.total;
  } catch (error: any) {
    ElMessage.error(error?.message || '加载用户列表失败');
  } finally {
    loading.value = false;
  }
}

async function loadRoles() {
  roles.value = (await getRoleList()) ?? [];
}

onMounted(async () => {
  await loadRoles();
  await loadData();
});

function handleSearch() {
  query.pageNum = 1;
  loadData();
}

function handleReset() {
  query.username = '';
  query.fullName = '';
  query.phone = '';
  query.userStatus = '';
  query.pageNum = 1;
  loadData();
}

function handlePageChange(page: number) {
  query.pageNum = page;
  loadData();
}

function handleSizeChange(size: number) {
  query.pageSize = size;
  query.pageNum = 1;
  loadData();
}

// ------- 新增 / 编辑 -------
const dialogVisible = ref(false);
const dialogTitle = ref('');
const submitting = ref(false);
const isEdit = ref(false);
const formRef = ref<FormInstance>();

interface UserForm {
  userUuid?: string;
  username: string;
  password: string;
  fullName: string;
  email: string;
  phone: string;
  userStatus: number;
  defaultRoleId?: number;
}

const form = reactive<UserForm>({
  userUuid: undefined,
  username: '',
  password: '',
  fullName: '',
  email: '',
  phone: '',
  userStatus: 1,
  defaultRoleId: undefined,
});

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    {
      validator: (_rule, value, callback) => {
        if (!isEdit.value && !value) {
          callback(new Error('请输入密码'));
        } else {
          callback();
        }
      },
      trigger: 'blur',
    },
  ],
};

function resetForm() {
  form.userUuid = undefined;
  form.username = '';
  form.password = '';
  form.fullName = '';
  form.email = '';
  form.phone = '';
  form.userStatus = 1;
  form.defaultRoleId = undefined;
}

function openCreate() {
  dialogTitle.value = '新增用户';
  isEdit.value = false;
  resetForm();
  dialogVisible.value = true;
}

function openEdit(row: SystemUserApi.SystemUser) {
  dialogTitle.value = '编辑用户';
  isEdit.value = true;
  resetForm();
  form.userUuid = row.userUuid;
  form.username = row.username;
  form.fullName = row.fullName ?? '';
  form.email = row.email ?? '';
  form.phone = row.phone ?? '';
  form.userStatus = row.userStatus;
  form.defaultRoleId = row.defaultRoleId;
  dialogVisible.value = true;
}

async function handleSubmit() {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    submitting.value = true;
    try {
      if (isEdit.value && form.userUuid) {
        const payload: SystemUserApi.UserUpdateParams = {
          userUuid: form.userUuid,
          username: form.username,
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          userStatus: form.userStatus as SystemUserApi.UserStatus,
          defaultRoleId: form.defaultRoleId,
        };
        // 仅在填写了新密码时才更新，密码明文提交
        if (form.password) {
          payload.password = form.password;
        }
        await updateUser(payload);
        ElMessage.success('修改成功');
      } else {
        await addUser({
          username: form.username,
          password: form.password,
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          userStatus: form.userStatus as SystemUserApi.UserStatus,
          defaultRoleId: form.defaultRoleId,
        });
        ElMessage.success('新增成功');
      }
      dialogVisible.value = false;
      await loadData();
    } finally {
      submitting.value = false;
    }
  });
}

async function handleDelete(row: SystemUserApi.SystemUser) {
  try {
    await ElMessageBox.confirm(
      `确认删除用户「${row.username}」吗？`,
      '删除确认',
      { type: 'warning' },
    );
  } catch {
    return;
  }
  await deleteUser(row.userUuid);
  ElMessage.success('删除成功');
  await loadData();
}
</script>

<template>
  <Page auto-content-height>
    <div class="flex h-full flex-col gap-3">
      <ElForm :inline="true" :model="query" class="flex flex-wrap items-center">
        <ElFormItem label="用户名">
          <ElInput
            v-model="query.username"
            clearable
            placeholder="请输入用户名"
            style="width: 160px"
          />
        </ElFormItem>
        <ElFormItem label="姓名">
          <ElInput
            v-model="query.fullName"
            clearable
            placeholder="请输入姓名"
            style="width: 160px"
          />
        </ElFormItem>
        <ElFormItem label="手机号">
          <ElInput
            v-model="query.phone"
            clearable
            placeholder="请输入手机号"
            style="width: 160px"
          />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect
            v-model="query.userStatus"
            clearable
            placeholder="全部"
            style="width: 130px"
          >
            <ElOption
              v-for="s in STATUS_OPTIONS"
              :key="s.value"
              :label="s.label"
              :value="String(s.value)"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem>
          <ElButton type="primary" @click="handleSearch">查询</ElButton>
          <ElButton @click="handleReset">重置</ElButton>
        </ElFormItem>
      </ElForm>

      <div class="flex items-center justify-between">
        <span class="text-base font-medium">用户列表</span>
        <ElButton type="primary" @click="openCreate">新增用户</ElButton>
      </div>

      <ElTable v-loading="loading" :data="tableData" border stripe>
        <ElTableColumn label="用户名" min-width="120" prop="username" />
        <ElTableColumn label="姓名" min-width="120" prop="fullName" />
        <ElTableColumn label="邮箱" min-width="180" prop="email" />
        <ElTableColumn label="手机号" min-width="130" prop="phone" />
        <ElTableColumn label="默认角色" min-width="120">
          <template #default="{ row }">
            {{ roleName(row.defaultRoleId) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="状态" width="110">
          <template #default="{ row }">
            <ElTag :type="statusType(row.userStatus)">
              {{ statusLabel(row.userStatus) }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="创建时间" prop="createTime" width="180" />
        <ElTableColumn fixed="right" label="操作" width="150">
          <template #default="{ row }">
            <ElButton link type="primary" @click="openEdit(row)">编辑</ElButton>
            <ElButton link type="danger" @click="handleDelete(row)">
              删除
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>

      <div class="flex justify-end">
        <ElPagination
          :current-page="query.pageNum"
          :page-size="query.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          background
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </div>

    <ElDialog v-model="dialogVisible" :title="dialogTitle" width="560px">
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="90px">
        <ElFormItem label="用户名" prop="username">
          <ElInput v-model="form.username" placeholder="请输入用户名" />
        </ElFormItem>
        <ElFormItem label="密码" prop="password">
          <ElInput
            v-model="form.password"
            :placeholder="isEdit ? '不修改请留空' : '请输入密码'"
            show-password
            type="password"
          />
        </ElFormItem>
        <ElFormItem label="姓名">
          <ElInput v-model="form.fullName" placeholder="请输入姓名" />
        </ElFormItem>
        <ElFormItem label="邮箱">
          <ElInput v-model="form.email" placeholder="请输入邮箱" />
        </ElFormItem>
        <ElFormItem label="手机号">
          <ElInput v-model="form.phone" placeholder="请输入手机号" />
        </ElFormItem>
        <ElFormItem label="默认角色">
          <ElSelect
            v-model="form.defaultRoleId"
            clearable
            placeholder="请选择默认角色"
            style="width: 100%"
          >
            <ElOption
              v-for="r in roles"
              :key="r.roleId"
              :label="r.roleName"
              :value="r.roleId"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="状态">
          <ElRadioGroup v-model="form.userStatus">
            <ElRadio
              v-for="s in STATUS_OPTIONS"
              :key="s.value"
              :value="s.value"
            >
              {{ s.label }}
            </ElRadio>
          </ElRadioGroup>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton :loading="submitting" type="primary" @click="handleSubmit">
          确定
        </ElButton>
      </template>
    </ElDialog>
  </Page>
</template>
