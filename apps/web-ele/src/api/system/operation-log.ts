import { requestClient } from '#/api/request';

export namespace OperLogApi {
  /** 操作日志记录 */
  export interface OperLog {
    id: number;
    /** 链路追踪ID */
    traceId?: string;
    /** 操作人UUID */
    userUuid?: string;
    /** 操作人用户名（后端关联 sys_user.username 得到） */
    userName?: string;
    /** 菜单ID */
    menuId?: number;
    /** 操作名称 */
    operationName?: string;
    /** 浏览器/设备标识 */
    userAgent?: string;
    /** 请求方法（POST/GET等） */
    requestMethod?: string;
    /** 请求URL */
    requestUrl?: string;
    /** 请求IP */
    requestIp?: string;
    /** 请求参数（JSON字符串） */
    requestParams?: string;
    /** 响应HTTP状态码：成功=200，异常=500 */
    responseCode?: number;
    /** 操作时间 */
    operationTime?: string;
    /** 操作状态：0=失败，1=成功 */
    operationStatus?: number;
    /** 失败时的错误信息 */
    errorMsg?: string;
    /** 异常堆栈详情 */
    errorStack?: string;
  }

  /** 分页查询参数 */
  export interface OperLogListParams {
    pageNum: number;
    pageSize: number;
    /** 操作人UUID（可选） */
    userUuid?: string;
    /** 操作名称（模糊查询，可选） */
    operationName?: string;
    /** 操作时间范围-开始，格式 yyyy-MM-ddTHH:mm:ss */
    operationTimeStart?: string;
    /** 操作时间范围-结束，格式 yyyy-MM-ddTHH:mm:ss */
    operationTimeEnd?: string;
  }

  /** 分页结果 */
  export interface PageResult<T> {
    items: T[];
    total: number;
  }
}

/**
 * 操作日志列表（分页）
 */
export async function getOperLogList(
  params: OperLogApi.OperLogListParams,
): Promise<OperLogApi.PageResult<OperLogApi.OperLog>> {
  const body = await requestClient.post<any>(
    '/system/operation-log/list',
    params,
    { responseReturn: 'body' },
  );
  if (body?.code !== 0) {
    throw new Error(body?.msg || '请求失败');
  }
  return {
    items: (body.data ?? []) as OperLogApi.OperLog[],
    total: body.total ?? 0,
  };
}
