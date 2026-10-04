import type { RouteRecordStringComponent } from '@vben/types';

import { baseRequestClient, requestClient } from '#/api/request';

/**
 * 后端返回的菜单节点类型
 * 注意：后端不再返回 component 和 icon 字段
 * - 图标由前端 iconMap 静态映射
 * - 组件路径由路由 path 去首斜杠后拼接 /index 自动生成
 */
export interface BackendMenuNode {
  children?: BackendMenuNode[];
  id: number;
  isFrame: number;
  menuName: string;
  menuType: 'C' | 'M';
  orderNum: number;
  parentId: number;
  path: string;
  permissions?: string[];
  status: number;
  visible: number;
}

/**
 * getUserPermission 接口返回结构
 */
export interface UserPermissionResult {
  /** 用户可访问的菜单树 */
  menus: BackendMenuNode[];
  /** 用户拥有的全部权限编码列表（去重，可用于按钮级权限判断） */
  permissions: string[];
}

/**
 * 获取用户所有菜单（保留旧接口兼容）
 */
export async function getAllMenusApi() {
  return requestClient.get<RouteRecordStringComponent[]>('/menu/all');
}

/**
 * 获取当前登录用户的菜单权限列表
 * 使用 baseRequestClient 避免 401 时触发全局 re-auth 导致登录死循环
 */
export async function getUserPermissionApi(): Promise<UserPermissionResult> {
  const response = await baseRequestClient.get<any>(
    '/system/user-permission/getUserPermission',
    { withCredentials: true },
  );
  // baseRequestClient 返回原始 AxiosResponse，需手动提取 data
  const body = response?.data ?? response;
  if (body.code !== 0) {
    throw new Error(body.msg || '获取用户权限失败');
  }
  return body.data as UserPermissionResult;
}

/**
 * 前端静态图标映射：根据路由路径匹配图标，不使用后端返回的 icon 字段
 * 同时支持后端返回的路径格式（/system/user）和前端路由格式（/manage/system/user）
 */
const iconMap: Record<string, string> = {
  // 后端接口返回的路径格式
  '/system': 'carbon:settings',
  '/system/user': 'carbon:user',
  '/system/role': 'carbon:user-role',
  '/system/menu': 'carbon:menu',
  '/system/menu-permission': 'carbon:password',
  '/system/operation-log': 'carbon:task',
  // 兼容带 /manage 前缀的路径
  '/manage/system': 'carbon:settings',
  '/manage/system/user': 'carbon:user',
  '/manage/system/role': 'carbon:user-role',
  '/manage/system/menu': 'carbon:menu',
  '/manage/system/menu-permission': 'carbon:password',
  '/manage/system/operation-log': 'carbon:task',
};

/**
 * 将后端菜单树转换为前端路由格式 (RouteRecordStringComponent[])
 */
export function convertBackendMenusToRoutes(
  menus: BackendMenuNode[],
): RouteRecordStringComponent[] {
  return menus.map((menu) => convertMenuToRoute(menu));
}

/**
 * 根据路由路径生成组件路径
 * 规则：去掉前导斜杠，拼接 /index
 * 例如：/system/user -> system/user/index
 */
function generateComponentPath(path: string): string {
  const stripped = path.replace(/^\//, '');
  return `${stripped}/index`;
}

function convertMenuToRoute(menu: BackendMenuNode): RouteRecordStringComponent {
  // 根据路径生成路由名称，如 /manage/system/user -> ManageSystemUser
  const name = menu.path
    .split('/')
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');

  const route: any = {
    name,
    path: menu.path,
    component:
      menu.menuType === 'M' ? 'BasicLayout' : generateComponentPath(menu.path),
    meta: {
      icon: iconMap[menu.path] || undefined,
      order: menu.orderNum,
      title: menu.menuName,
      hideInMenu: menu.visible === 0,
    },
  };

  // 递归处理子菜单
  if (menu.children && menu.children.length > 0) {
    route.children = menu.children.map((child) => convertMenuToRoute(child));
  }

  return route as RouteRecordStringComponent;
}
