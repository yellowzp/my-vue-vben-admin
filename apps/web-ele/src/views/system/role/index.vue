<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus';

import type { SystemRoleApi } from '#/api';

import { computed, onMounted, reactive, ref } from 'vue';

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
  ElRadio,
  ElRadioGroup,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import {
  addRole,
  deleteRole,
  getRoleList,
  updateRole,
} from '#/api/system/role';

defineOptions({ name: 'SystemRole' });

const loading = ref(false);
const tableData = ref<SystemRoleApi.SystemRole[]>([]);

// 查询条件
const query = reactive<{ roleName?: string; roleStatus?: number | string }>({
  roleName: '',
  roleStatus: '',
});

const filteredData = computed(() => {
  return tableData.value.filter((item) => {
    const matchName = query.roleName
      ? item.roleName?.includes(query.roleName)
      : true;
    const matchStatus =
      query.roleStatus === '' || query.roleStatus === undefined
        ? true
        : item.roleStatus === Number(query.roleStatus);
    return matchName && matchStatus;
  });
});

async function loadData() {
  loading.value = true;
  try {
    tableData.value = (await getRoleList()) ?? [];
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);

function handleSearch() {
  // 前端过滤，computed 自动响应
}

function handleReset() {
  query.roleName = '';
  query.roleStatus = '';
}

// ------- 新增 / 编辑 -------
const dialogVisible = ref(false);
const dialogTitle = ref('');
const submitting = ref(false);
const formRef = ref<FormInstance>();
const form = reactive<SystemRoleApi.RoleParams>({
  roleId: undefined,
  roleName: '',
  roleStatus: 1,
});

const rules: FormRules = {
  roleName: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  roleStatus: [
    { required: true, message: '请选择角色状态', trigger: 'change' },
  ],
};

function openCreate() {
  dialogTitle.value = '新增角色';
  form.roleId = undefined;
  form.roleName = '';
  form.roleStatus = 1;
  dialogVisible.value = true;
}

function openEdit(row: SystemRoleApi.SystemRole) {
  dialogTitle.value = '编辑角色';
  form.roleId = row.roleId;
  form.roleName = row.roleName;
  form.roleStatus = row.roleStatus;
  dialogVisible.value = true;
}

async function handleSubmit() {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    submitting.value = true;
    try {
      if (form.roleId === undefined) {
        await addRole({ roleName: form.roleName, roleStatus: form.roleStatus });
        ElMessage.success('新增成功');
      } else {
        await updateRole({
          roleId: form.roleId,
          roleName: form.roleName,
          roleStatus: form.roleStatus,
        });
        ElMessage.success('修改成功');
      }
      dialogVisible.value = false;
      await loadData();
    } finally {
      submitting.value = false;
    }
  });
}

async function handleDelete(row: SystemRoleApi.SystemRole) {
  try {
    await ElMessageBox.confirm(
      `确认删除角色「${row.roleName}」吗？`,
      '删除确认',
      { type: 'warning' },
    );
  } catch {
    return;
  }
  await deleteRole(row.roleId);
  ElMessage.success('删除成功');
  await loadData();
}
</script>

<template>
  <Page auto-content-height>
    <div class="flex h-full flex-col gap-3">
      <!-- 查询区 -->
      <ElForm :inline="true" :model="query" class="flex flex-wrap items-center">
        <ElFormItem label="角色名称">
          <ElInput
            v-model="query.roleName"
            clearable
            placeholder="请输入角色名称"
            style="width: 200px"
          />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect
            v-model="query.roleStatus"
            clearable
            placeholder="全部"
            style="width: 140px"
          >
            <ElOption :value="1" label="启用" />
            <ElOption :value="0" label="停用" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem>
          <ElButton type="primary" @click="handleSearch">查询</ElButton>
          <ElButton @click="handleReset">重置</ElButton>
        </ElFormItem>
      </ElForm>

      <!-- 工具栏 -->
      <div class="flex items-center justify-between">
        <span class="text-base font-medium">角色列表</span>
        <ElButton type="primary" @click="openCreate">新增角色</ElButton>
      </div>

      <!-- 表格 -->
      <ElTable v-loading="loading" :data="filteredData" border stripe>
        <ElTableColumn label="角色ID" prop="roleId" width="90" />
        <ElTableColumn label="角色名称" prop="roleName" min-width="160" />
        <ElTableColumn label="状态" width="100">
          <template #default="{ row }">
            <ElTag :type="row.roleStatus === 1 ? 'success' : 'info'">
              {{ row.roleStatus === 1 ? '启用' : '停用' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="创建人" prop="createUser" width="120" />
        <ElTableColumn label="创建时间" prop="createTime" width="180" />
        <ElTableColumn label="更新时间" prop="updateTime" width="180" />
        <ElTableColumn fixed="right" label="操作" width="150">
          <template #default="{ row }">
            <ElButton link type="primary" @click="openEdit(row)">编辑</ElButton>
            <ElButton link type="danger" @click="handleDelete(row)">
              删除
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </div>

    <!-- 新增/编辑弹窗 -->
    <ElDialog v-model="dialogVisible" :title="dialogTitle" width="480px">
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="90px">
        <ElFormItem label="角色名称" prop="roleName">
          <ElInput v-model="form.roleName" placeholder="请输入角色名称" />
        </ElFormItem>
        <ElFormItem label="状态" prop="roleStatus">
          <ElRadioGroup v-model="form.roleStatus">
            <ElRadio :value="1">启用</ElRadio>
            <ElRadio :value="0">停用</ElRadio>
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
