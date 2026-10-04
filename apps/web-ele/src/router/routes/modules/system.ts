import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'carbon:settings',
      order: 10,
      title: $t('page.system.title'),
    },
    name: 'System',
    path: '/manage/system',
    redirect: '/manage/system/user',
    children: [
      {
        name: 'SystemUser',
        path: '/manage/system/user',
        component: () => import('#/views/system/user/index.vue'),
        meta: {
          icon: 'carbon:user',
          title: $t('page.system.user'),
        },
      },
      {
        name: 'SystemRole',
        path: '/manage/system/role',
        component: () => import('#/views/system/role/index.vue'),
        meta: {
          icon: 'carbon:user-role',
          title: $t('page.system.role'),
        },
      },
      {
        name: 'SystemMenu',
        path: '/manage/system/menu',
        component: () => import('#/views/system/menu/index.vue'),
        meta: {
          icon: 'carbon:menu',
          title: $t('page.system.menu'),
        },
      },
      {
        name: 'SystemMenuPermission',
        path: '/manage/system/menu-permission',
        component: () => import('#/views/system/menu-permission/index.vue'),
        meta: {
          icon: 'carbon:password',
          title: $t('page.system.menuPermission'),
        },
      },
      {
        name: 'SystemOperLog',
        path: '/manage/system/operation-log',
        component: () => import('#/views/system/operation-log/index.vue'),
        meta: {
          icon: 'carbon:task',
          title: $t('page.system.operLog'),
        },
      },
    ],
  },
];

export default routes;
