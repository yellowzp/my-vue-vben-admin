import type {
  ComponentRecordType,
  GenerateMenuAndRoutesOptions,
  RouteRecordStringComponent,
} from '@vben/types';

import { generateAccessible } from '@vben/access';
import { preferences } from '@vben/preferences';

import { ElMessage } from 'element-plus';

import {
  convertBackendMenusToRoutes,
  getUserPermissionApi,
} from '#/api/core/menu';
import { BasicLayout, IFrameView } from '#/layouts';
import { $t } from '#/locales';

const forbiddenComponent = () => import('#/views/_core/fallback/forbidden.vue');

/**
 * 静态路由：所有用户都可以看到，不受后端权限控制
 */
const staticMenuRoutes: RouteRecordStringComponent[] = [
  {
    name: 'Manage',
    path: '/manage',
    component: 'BasicLayout',
    redirect: '/manage/analytics',
    meta: {
      icon: 'lucide:layout-dashboard',
      order: -1,
      title: $t('page.dashboard.title'),
    },
    children: [
      {
        name: 'Analytics',
        path: '/manage/analytics',
        component: 'dashboard/analytics/index',
        meta: {
          affixTab: true,
          icon: 'lucide:area-chart',
          title: $t('page.dashboard.analytics'),
        },
      },
      {
        name: 'Workspace',
        path: '/manage/workspace',
        component: 'dashboard/workspace/index',
        meta: {
          icon: 'carbon:workspace',
          title: $t('page.dashboard.workspace'),
        },
      },
    ],
  },
];

async function generateAccess(options: GenerateMenuAndRoutesOptions) {
  const pageMap: ComponentRecordType = import.meta.glob('../views/**/*.vue');

  const layoutMap: ComponentRecordType = {
    BasicLayout,
    IFrameView,
  };

  // 缓存权限编码，供 guard 存储到 accessStore
  let userPermissions: string[] = [];

  const result = await generateAccessible(preferences.app.accessMode, {
    ...options,
    fetchMenuListAsync: async () => {
      ElMessage({
        duration: 1500,
        message: `${$t('common.loadingMenu')}...`,
      });
      try {
        const data = await getUserPermissionApi();
        // 保存权限编码
        userPermissions = data.permissions ?? [];
        // 将后端菜单树转换为前端路由格式，并合并静态路由
        const backendRoutes = convertBackendMenusToRoutes(data.menus ?? []);
        return [...staticMenuRoutes, ...backendRoutes];
      } catch (error) {
        console.error('获取用户菜单权限失败，降级为静态路由', error);
        // 接口失败时仅返回静态路由，不阻塞登录流程
        return [...staticMenuRoutes];
      }
    },
    // 可以指定没有权限跳转403页面
    forbiddenComponent,
    layoutMap,
    pageMap,
  });

  return { ...result, userPermissions };
}

export { generateAccess };
