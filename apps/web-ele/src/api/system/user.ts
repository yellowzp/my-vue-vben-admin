import { requestClient } from '#/api/request';

export namespace SystemUserApi {
  /** 用户状态：0=禁用，1=正常，2=锁定，3=永久封禁 */
  export type UserStatus = 0 | 1 | 2 | 3;

  /** 用户列表项 */
  export interface SystemUser {
    userUuid: string;
    username: string;
    fullName?: string;
    email?: string;
    phone?: string;
    userStatus: UserStatus;
    createTime?: string;
    updateTime?: string;
    defaultRoleId?: number;
  }

  /** 分页查询参数 */
  export interface UserListParams {
    pageNum: number;
    pageSize: number;
    username?: string;
    fullName?: string;
    phone?: string;
    userStatus?: string;
  }

  /** 新增用户参数 */
  export interface UserAddParams {
    username: string;
    /** 密码（明文） */
    password: string;
    fullName?: string;
    email?: string;
    phone?: string;
    userStatus?: UserStatus;
    defaultRoleId?: number;
    passwordExpirationTime?: string;
    lockedEndTime?: string;
  }

  /** 修改用户参数 */
  export interface UserUpdateParams {
    userUuid: string;
    username?: string;
    /** 密码（明文），不传则不修改密码 */
    password?: string;
    fullName?: string;
    email?: string;
    phone?: string;
    userStatus?: UserStatus;
    defaultRoleId?: number;
    passwordExpirationTime?: string;
    lockedEndTime?: string;
  }

  /** 分页结果 */
  export interface PageResult<T> {
    items: T[];
    total: number;
  }
}

/**
 * 用户列表（分页）
 * 后端分页接口在响应体顶层返回 total，需以 body 模式读取完整响应
 */
export async function getUserList(
  params: SystemUserApi.UserListParams,
): Promise<SystemUserApi.PageResult<SystemUserApi.SystemUser>> {
  const body = await requestClient.post<any>('/system/user/list', params, {
    responseReturn: 'body',
  });
  if (body?.code !== 0) {
    throw new Error(body?.msg || '请求失败');
  }
  return {
    items: (body.data ?? []) as SystemUserApi.SystemUser[],
    total: body.total ?? 0,
  };
}

/** 新增用户 */
export async function addUser(data: SystemUserApi.UserAddParams) {
  return requestClient.post('/system/user/add', data);
}

/** 修改用户 */
export async function updateUser(data: SystemUserApi.UserUpdateParams) {
  return requestClient.post('/system/user/update', data);
}

/** 删除用户（逻辑删除） */
export async function deleteUser(userUuid: string) {
  return requestClient.post('/system/user/delete', null, {
    params: { userUuid },
  });
}
