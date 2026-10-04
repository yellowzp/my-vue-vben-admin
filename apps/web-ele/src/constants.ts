/**
 * web-ele 应用级常量
 */

/**
 * 后台默认首页路径（概览 - 工作台）
 * 覆盖 @vben/constants 中的全局默认值，避免影响 monorepo 内其他应用
 */
export const DEFAULT_HOME_PATH = '/manage/workspace';

/**
 * 登录页路径
 * 覆盖 @vben/constants 中的全局默认值（/auth/login），避免影响 monorepo 内其他应用
 */
export const LOGIN_PATH = '/manage/login';
