import { requestClient } from '#/api/request';

export namespace SystemMenuPermissionApi {
  /** 权限类型：F=按钮 */
  export type PermissionType = 'F';

  /** 菜单权限列表项 */
  export interface MenuPermission {
    id: number;
    menuId: number;
    permissionCode: string;
    menuType: PermissionType;
    /** 状态：0=禁用，1=启用 */
    status: number;
    remark?: string;
    createBy?: string;
    createTime?: string;
    updateBy?: string;
    updateTime?: string;
  }

  /** 新增/修改菜单权限参数 */
  export interface MenuPermissionParams {
    id?: number;
    menuId: number;
    permissionCode: string;
    menuType: PermissionType;
    status: number;
    remark?: string;
  }
}

/** 菜单权限列表（全量） */
export async function getMenuPermissionList() {
  return requestClient.get<SystemMenuPermissionApi.MenuPermission[]>(
    '/system/menu-permission/list',
  );
}

/** 根据菜单ID获取权限列表 */
export async function getMenuPermissionListByMenu(menuId: number) {
  return requestClient.get<SystemMenuPermissionApi.MenuPermission[]>(
    '/system/menu-permission/listByMenu',
    { params: { menuId } },
  );
}

/** 新增菜单权限 */
export async function addMenuPermission(
  data: Omit<SystemMenuPermissionApi.MenuPermissionParams, 'id'>,
) {
  return requestClient.post('/system/menu-permission/add', data);
}

/** 修改菜单权限 */
export async function updateMenuPermission(
  data: SystemMenuPermissionApi.MenuPermissionParams,
) {
  return requestClient.post('/system/menu-permission/update', data);
}

/** 删除菜单权限（逻辑删除） */
export async function deleteMenuPermission(id: number) {
  return requestClient.post('/system/menu-permission/delete', null, {
    params: { id },
  });
}
