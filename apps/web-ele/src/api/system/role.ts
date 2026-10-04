import { requestClient } from '#/api/request';

export namespace SystemRoleApi {
  /** 角色状态：0=停用，1=启用 */
  export type RoleStatus = 0 | 1;

  /** 角色列表项 */
  export interface SystemRole {
    roleId: number;
    roleName: string;
    roleStatus: RoleStatus;
    createTime?: string;
    updateTime?: string;
    createUser?: string;
    updateUser?: string;
  }

  /** 新增/修改角色参数 */
  export interface RoleParams {
    roleId?: number;
    roleName: string;
    roleStatus: RoleStatus;
  }
}

/** 角色列表（全量） */
export async function getRoleList() {
  return requestClient.get<SystemRoleApi.SystemRole[]>('/system/role/list');
}

/** 新增角色 */
export async function addRole(data: Omit<SystemRoleApi.RoleParams, 'roleId'>) {
  return requestClient.post('/system/role/add', data);
}

/** 修改角色 */
export async function updateRole(data: SystemRoleApi.RoleParams) {
  return requestClient.post('/system/role/update', data);
}

/** 删除角色（逻辑删除） */
export async function deleteRole(roleId: number) {
  return requestClient.post('/system/role/delete', null, {
    params: { roleId },
  });
}
