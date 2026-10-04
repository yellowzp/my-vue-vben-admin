import { requestClient } from '#/api/request';

export namespace SystemMenuApi {
  /** 菜单类型：M=目录，C=菜单 */
  export type MenuType = 'C' | 'M';

  /** 菜单列表项 */
  export interface SystemMenu {
    id: number;
    parentId: number;
    menuName: string;
    menuType: MenuType;
    path?: string;
    orderNum?: number;
    /** 是否外链：0=否，1=是 */
    isFrame?: number;
    /** 菜单可见性：0=隐藏，1=显示 */
    visible?: number;
    /** 菜单状态：0=停用，1=正常 */
    status?: number;
    createBy?: string;
    createTime?: string;
    updateBy?: string;
    updateTime?: string;
    remark?: string;
    /** 前端构建树形结构使用 */
    children?: SystemMenu[];
  }

  /** 新增/修改菜单参数 */
  export interface MenuParams {
    id?: number;
    parentId: number;
    menuName: string;
    menuType: MenuType;
    path?: string;
    orderNum?: number;
    isFrame?: number;
    visible?: number;
    status?: number;
    remark?: string;
  }
}

/** 菜单列表（全量，扁平结构） */
export async function getMenuList() {
  return requestClient.get<SystemMenuApi.SystemMenu[]>('/system/menu/list');
}

/** 新增菜单 */
export async function addMenu(data: Omit<SystemMenuApi.MenuParams, 'id'>) {
  return requestClient.post('/system/menu/add', data);
}

/** 修改菜单 */
export async function updateMenu(data: SystemMenuApi.MenuParams) {
  return requestClient.post('/system/menu/update', data);
}

/** 删除菜单（逻辑删除） */
export async function deleteMenu(id: number) {
  return requestClient.post('/system/menu/delete', null, {
    params: { id },
  });
}

/** 设置菜单状态：0=停用，1=正常 */
export async function setMenuStatus(id: number, status: number) {
  return requestClient.post('/system/menu/status', null, {
    params: { id, status },
  });
}
