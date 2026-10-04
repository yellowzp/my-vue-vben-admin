<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus';

import type { SystemMenuApi } from '#/api/system/menu';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElMessageBox,
  ElRadio,
  ElRadioGroup,
  ElSwitch,
  ElTable,
  ElTableColumn,
  ElTag,
  ElTreeSelect,
} from 'element-plus';

import {
  addMenu,
  deleteMenu,
  getMenuList,
  setMenuStatus,
  updateMenu,
} from '#/api/system/menu';

defineOptions({ name: 'SystemMenu' });

const loading = ref(false);
const flatMenus = ref<SystemMenuApi.SystemMenu[]>([]);

/** 将扁平菜单构建为树形结构 */
function buildTree(list: SystemMenuApi.SystemMenu[]) {
  const map = new Map<number, SystemMenuApi.SystemMenu>();
  const roots: SystemMenuApi.SystemMenu[] = [];
  list.forEach((item) => map.set(item.id, { ...item, children: [] }));
  map.forEach((item) => {
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId)!.children!.push(item);
    } else {
      roots.push(item);
    }
  });
  return roots;
}

const treeData = computed(() => buildTree(flatMenus.value));

/** 父级菜单下拉树数据（含“顶级菜单”根节点） */
const parentTreeData = computed(() => [
  {
    id: 0,
    menuName: '顶级菜单',
    children: treeData.value,
  },
]);

async function loadData() {
  loading.value = true;
  try {
    flatMenus.value = (await getMenuList()) ?? [];
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);

// ------- 新增 / 编辑 -------
const dialogVisible = ref(false);
const dialogTitle = ref('');
const submitting = ref(false);
const formRef = ref<FormInstance>();

function defaultForm(): SystemMenuApi.MenuParams {
  return {
    id: undefined,
    parentId: 0,
    menuName: '',
    menuType: 'C',
    path: '',
    orderNum: 0,
    isFrame: 0,
    visible: 1,
    status: 1,
    remark: '',
  };
}

const form = reactive<SystemMenuApi.MenuParams>(defaultForm());

const rules: FormRules = {
  menuName: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
  menuType: [{ required: true, message: '请选择菜单类型', trigger: 'change' }],
};

function openCreate(parentId = 0) {
  dialogTitle.value = '新增菜单';
  Object.assign(form, defaultForm(), { parentId });
  dialogVisible.value = true;
}

function openEdit(row: SystemMenuApi.SystemMenu) {
  dialogTitle.value = '编辑菜单';
  Object.assign(form, defaultForm(), {
    id: row.id,
    parentId: row.parentId,
    menuName: row.menuName,
    menuType: row.menuType,
    path: row.path ?? '',
    orderNum: row.orderNum ?? 0,
    isFrame: row.isFrame ?? 0,
    visible: row.visible ?? 1,
    status: row.status ?? 1,
    remark: row.remark ?? '',
  });
  dialogVisible.value = true;
}

async function handleSubmit() {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    submitting.value = true;
    try {
      const { id, ...rest } = form;
      if (id === undefined) {
        await addMenu(rest as Omit<SystemMenuApi.MenuParams, 'id'>);
        ElMessage.success('新增成功');
      } else {
        await updateMenu({ ...rest, id });
        ElMessage.success('修改成功');
      }
      dialogVisible.value = false;
      await loadData();
    } finally {
      submitting.value = false;
    }
  });
}

async function handleDelete(row: SystemMenuApi.SystemMenu) {
  const hasChildren = flatMenus.value.some((m) => m.parentId === row.id);
  try {
    await ElMessageBox.confirm(
      hasChildren
        ? `菜单「${row.menuName}」下存在子菜单，确认一并删除吗？`
        : `确认删除菜单「${row.menuName}」吗？`,
      '删除确认',
      { type: 'warning' },
    );
  } catch {
    return;
  }
  await deleteMenu(row.id);
  ElMessage.success('删除成功');
  await loadData();
}

/** 状态开关切换前调用，返回 false 阻止切换 */
async function handleStatusChange(row: SystemMenuApi.SystemMenu) {
  const nextStatus = row.status === 1 ? 0 : 1;
  try {
    await setMenuStatus(row.id, nextStatus);
    row.status = nextStatus;
    ElMessage.success(nextStatus === 1 ? '已启用' : '已停用');
    return true;
  } catch {
    return false;
  }
}
</script>

<template>
  <Page auto-content-height>
    <div class="flex h-full flex-col gap-3">
      <div class="flex items-center justify-between">
        <span class="text-base font-medium">菜单列表</span>
        <div class="flex gap-2">
          <ElButton @click="loadData">刷新</ElButton>
          <ElButton type="primary" @click="openCreate(0)">新增菜单</ElButton>
        </div>
      </div>

      <ElTable
        v-loading="loading"
        :data="treeData"
        :tree-props="{ children: 'children' }"
        border
        default-expand-all
        row-key="id"
      >
        <ElTableColumn label="菜单名称" min-width="180" prop="menuName" />
        <ElTableColumn label="类型" width="90">
          <template #default="{ row }">
            <ElTag :type="row.menuType === 'M' ? 'warning' : 'primary'">
              {{ row.menuType === 'M' ? '目录' : '菜单' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="路由路径" min-width="160" prop="path" />
        <ElTableColumn label="排序" prop="orderNum" width="80" />
        <ElTableColumn label="可见" width="80">
          <template #default="{ row }">
            <ElTag :type="row.visible === 1 ? 'success' : 'info'">
              {{ row.visible === 1 ? '显示' : '隐藏' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="状态" width="90">
          <template #default="{ row }">
            <ElSwitch
              :before-change="() => handleStatusChange(row)"
              :model-value="row.status === 1"
            />
          </template>
        </ElTableColumn>
        <ElTableColumn fixed="right" label="操作" width="210">
          <template #default="{ row }">
            <ElButton link type="primary" @click="openCreate(row.id)">
              新增下级
            </ElButton>
            <ElButton link type="primary" @click="openEdit(row)">编辑</ElButton>
            <ElButton link type="danger" @click="handleDelete(row)">
              删除
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </div>

    <ElDialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="100px">
        <ElFormItem label="上级菜单">
          <ElTreeSelect
            v-model="form.parentId"
            :data="parentTreeData"
            :props="{ label: 'menuName', children: 'children' }"
            :render-after-expand="false"
            check-strictly
            default-expand-all
            node-key="id"
            style="width: 100%"
          />
        </ElFormItem>
        <ElFormItem label="菜单类型" prop="menuType">
          <ElRadioGroup v-model="form.menuType">
            <ElRadio value="M">目录</ElRadio>
            <ElRadio value="C">菜单</ElRadio>
          </ElRadioGroup>
        </ElFormItem>
        <ElFormItem label="菜单名称" prop="menuName">
          <ElInput v-model="form.menuName" placeholder="请输入菜单名称" />
        </ElFormItem>
        <ElFormItem label="路由路径">
          <ElInput v-model="form.path" placeholder="如 /system/user" />
        </ElFormItem>
        <ElFormItem label="显示排序">
          <ElInputNumber v-model="form.orderNum" :min="0" />
        </ElFormItem>
        <ElFormItem label="是否外链">
          <ElRadioGroup v-model="form.isFrame">
            <ElRadio :value="0">否</ElRadio>
            <ElRadio :value="1">是</ElRadio>
          </ElRadioGroup>
        </ElFormItem>
        <ElFormItem label="菜单可见">
          <ElRadioGroup v-model="form.visible">
            <ElRadio :value="1">显示</ElRadio>
            <ElRadio :value="0">隐藏</ElRadio>
          </ElRadioGroup>
        </ElFormItem>
        <ElFormItem label="菜单状态">
          <ElRadioGroup v-model="form.status">
            <ElRadio :value="1">正常</ElRadio>
            <ElRadio :value="0">停用</ElRadio>
          </ElRadioGroup>
        </ElFormItem>
        <ElFormItem label="备注">
          <ElInput
            v-model="form.remark"
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
