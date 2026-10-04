<script lang="ts" setup>
import type { OperLogApi } from '#/api/system/operation-log';

import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  ElButton,
  ElDatePicker,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElPagination,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import { getOperLogList } from '#/api/system/operation-log';

defineOptions({ name: 'SystemOperLog' });

const STATUS_OPTIONS = [
  { label: '成功', value: 1, type: 'success' },
  { label: '失败', value: 0, type: 'danger' },
] as const;

function statusLabel(status?: number) {
  return STATUS_OPTIONS.find((s) => s.value === status)?.label ?? '未知';
}
function statusType(status?: number) {
  return STATUS_OPTIONS.find((s) => s.value === status)?.type ?? 'info';
}

const loading = ref(false);
const tableData = ref<OperLogApi.OperLog[]>([]);
const total = ref(0);

const query = reactive<OperLogApi.OperLogListParams>({
  pageNum: 1,
  pageSize: 10,
  operationName: '',
  operationTimeStart: '',
  operationTimeEnd: '',
});

const dateRange = ref<[string, string] | null>(null);

async function loadData() {
  loading.value = true;
  try {
    if (dateRange.value) {
      query.operationTimeStart = `${dateRange.value[0]}T00:00:00`;
      query.operationTimeEnd = `${dateRange.value[1]}T23:59:59`;
    } else {
      query.operationTimeStart = '';
      query.operationTimeEnd = '';
    }
    const res = await getOperLogList({ ...query });
    tableData.value = res.items;
    total.value = res.total;
  } catch (error: any) {
    ElMessage.error(error?.message || '加载操作日志失败');
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadData();
});

function handleSearch() {
  query.pageNum = 1;
  loadData();
}

function handleReset() {
  query.operationName = '';
  query.operationTimeStart = '';
  query.operationTimeEnd = '';
  dateRange.value = null;
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
</script>

<template>
  <Page auto-content-height>
    <div class="flex h-full flex-col gap-3">
      <ElForm :inline="true" :model="query" class="flex flex-wrap items-center">
        <ElFormItem label="操作名称">
          <ElInput
            v-model="query.operationName"
            clearable
            placeholder="请输入操作名称"
            style="width: 180px"
          />
        </ElFormItem>
        <ElFormItem label="操作时间">
          <ElDatePicker
            v-model="dateRange"
            end-placeholder="结束日期"
            start-placeholder="开始日期"
            style="width: 240px"
            type="daterange"
            value-format="YYYY-MM-DD"
          />
        </ElFormItem>
        <ElFormItem>
          <ElButton type="primary" @click="handleSearch">查询</ElButton>
          <ElButton @click="handleReset">重置</ElButton>
        </ElFormItem>
      </ElForm>

      <div class="flex items-center justify-between">
        <span class="text-base font-medium">操作日志列表</span>
      </div>

      <ElTable v-loading="loading" :data="tableData" border stripe>
        <ElTableColumn label="ID" prop="id" width="80" />
        <ElTableColumn
          label="用户名"
          min-width="120"
          prop="userName"
          show-overflow-tooltip
        />
        <ElTableColumn label="操作名称" min-width="130" prop="operationName" />
        <ElTableColumn label="请求方法" width="100" prop="requestMethod" />
        <ElTableColumn
          label="请求地址"
          min-width="200"
          prop="requestUrl"
          show-overflow-tooltip
        />
        <ElTableColumn label="请求IP" min-width="130" prop="requestIp" />
        <ElTableColumn label="响应码" prop="responseCode" width="90" />
        <ElTableColumn label="状态" width="90">
          <template #default="{ row }">
            <ElTag :type="statusType(row.operationStatus)">
              {{ statusLabel(row.operationStatus) }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn
          label="错误信息"
          min-width="160"
          prop="errorMsg"
          show-overflow-tooltip
        />
        <ElTableColumn label="操作时间" prop="operationTime" width="180" />
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
  </Page>
</template>
