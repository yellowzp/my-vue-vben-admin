<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus';

import type { SystemMenuApi } from '#/api/system/menu';
import type { SystemMenuPermissionApi } from '#/api/system/menu-permission';

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

import { getMenuList } from '#/api/system/menu';
import {
  addMenuPermission,
  deleteMenuPermission,
  getMenuPermissionList,
  updateMenuPermission,
} from '#/api/system/menu-permission';

defineOptions({ name: 'SystemMenuPermission' });

const loading = ref(false);
const tableData = ref<SystemMenuPermissionApi.MenuPermission[]>([]);
const menus = ref<SystemMenuApi.SystemMenu[]>([]);

const menuNameMap = computed(() => {
  const map = new Map<number, string>();
  menus.value.forEach((m) => map.set(m.id, m.menuName));
  return map;
});

const query = reactive<{ menuId?: number | string; permissionCode?: string }>({
  menuId: '',
  permissionCode: '',
});

const filteredData = computed(() => {
  return tableData.value.filter((item) => {
    const matchMenu =
      query.menuId === '' || query.menuId === undefined
        ? true
        : item.menuId === Number(query.menuId);
    const matchCode = query.permissionCode
      ? item.permissionCode?.includes(query.permissionCode)
      : true;
    return matchMenu && matchCode;
  });
});

async function loadData() {
  loading.value = true;
  try {
    const [perms, menuList] = await Promise.all([
      getMenuPermissionList(),
      getMenuList(),
    ]);
    tableData.value = perms ?? [];
    menus.value = menuList ?? [];
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);

function handleReset() {
  query.menuId = '';
  query.permissionCode = '';
}

// ------- 新增 / 编辑 -------
const dialogVisible = ref(false);
const dialogTitle = ref('');
const submitting = ref(false);
const formRef = ref<FormInstance>();
const form = reactive<SystemMenuPermissionApi.MenuPermissionParams>({
  id: undefined,
  menuId: undefined as unknown as number,
  permissionCode: '',
  menuType: 'F',
  status: 1,
  remark: '',
});

const rules: FormRules = {
  menuId: [{ required: true, message: '请选择所属菜单', trigger: 'change' }],
  permissionCode: [
    { required: true, message: '请输入权限编码', trigger: 'blur' },
  ],
};

function resetForm() {
  form.id = undefined;
  form.menuId = undefined as unknown as number;
  form.permissionCode = '';
  form.menuType = 'F';
  form.status = 1;
  form.remark = '';
}

function openCreate() {
  dialogTitle.value = '新增菜单权限';
  resetForm();
  dialogVisible.value = true;
}

function openEdit(row: SystemMenuPermissionApi.MenuPermission) {
  dialogTitle.value = '编辑菜单权限';
  form.id = row.id;
  form.menuId = row.menuId;
  form.permissionCode = row.permissionCode;
  form.menuType = row.menuType;
  form.status = row.status;
  form.remark = row.remark ?? '';
  dialogVisible.value = true;
}

async function handleSubmit() {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    submitting.value = true;
    try {
      const payload = {
        menuId: form.menuId,
        permissionCode: form.permissionCode,
        menuType: form.menuType,
        status: form.status,
        remark: form.remark,
      };
      if (form.id === undefined) {
        await addMenuPermission(payload);
        ElMessage.success('新增成功');
      } else {
        await updateMenuPermission({ ...payload, id: form.id });
        ElMessage.success('修改成功');
      }
      dialogVisible.value = false;
      await loadData();
    } finally {
      submitting.value = false;
    }
  });
}

async function handleDelete(row: SystemMenuPermissionApi.MenuPermission) {
  try {
    await ElMessageBox.confirm(
      `确认删除权限「${row.permissionCode}」吗？`,
      '删除确认',
      { type: 'warning' },
    );
  } catch {
    return;
  }
  await deleteMenuPermission(row.id);
  ElMessage.success('删除成功');
  await loadData();
}
</script>

<template>
  <Page auto-content-height>
    <div class="flex h-full flex-col gap-3">
      <ElForm :inline="true" :model="query" class="flex flex-wrap items-center">
        <ElFormItem label="所属菜单">
          <ElSelect
            v-model="query.menuId"
            clearable
            filterable
            placeholder="全部"
            style="width: 200px"
          >
            <ElOption
              v-for="m in menus"
              :key="m.id"
              :label="m.menuName"
              :value="m.id"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="权限编码">
          <ElInput
            v-model="query.permissionCode"
            clearable
            placeholder="请输入权限编码"
            style="width: 200px"
          />
        </ElFormItem>
        <ElFormItem>
          <ElButton type="primary">查询</ElButton>
          <ElButton @click="handleReset">重置</ElButton>
        </ElFormItem>
      </ElForm>

      <div class="flex items-center justify-between">
        <span class="text-base font-medium">菜单权限列表</span>
        <ElButton type="primary" @click="openCreate">新增权限</ElButton>
      </div>

      <ElTable v-loading="loading" :data="filteredData" border stripe>
        <ElTableColumn label="ID" prop="id" width="80" />
        <ElTableColumn label="所属菜单" width="160">
          <template #default="{ row }">
            {{ menuNameMap.get(row.menuId) ?? row.menuId }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="权限编码" prop="permissionCode" min-width="180" />
        <ElTableColumn label="类型" width="90">
          <template #default="{ row }">
            <ElTag>{{ row.menuType === 'F' ? '按钮' : row.menuType }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="状态" width="90">
          <template #default="{ row }">
            <ElTag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="备注" prop="remark" min-width="160" />
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
    </div>

    <ElDialog v-model="dialogVisible" :title="dialogTitle" width="520px">
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="100px">
        <ElFormItem label="所属菜单" prop="menuId">
          <ElSelect
            v-model="form.menuId"
            filterable
            placeholder="请选择所属菜单"
            style="width: 100%"
          >
            <ElOption
              v-for="m in menus"
              :key="m.id"
              :label="m.menuName"
              :value="m.id"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="权限编码" prop="permissionCode">
          <ElInput
            v-model="form.permissionCode"
            placeholder="如 sys:user:add"
          />
        </ElFormItem>
        <ElFormItem label="类型">
          <ElRadioGroup v-model="form.menuType">
            <ElRadio value="F">按钮</ElRadio>
          </ElRadioGroup>
        </ElFormItem>
        <ElFormItem label="状态">
          <ElRadioGroup v-model="form.status">
            <ElRadio :value="1">启用</ElRadio>
            <ElRadio :value="0">禁用</ElRadio>
          </ElRadioGroup>
        </ElFormItem>
        <ElFormItem label="备注">
          <ElInput
            v-model="form.remark"
            :maxlength="500"
            :rows="2"
            placeholder="请输入备注"
            type="textarea"
          />
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
