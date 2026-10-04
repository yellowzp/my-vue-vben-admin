import type { Recordable, UserInfo } from '@vben/types';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { resetAllStores, useAccessStore, useUserStore } from '@vben/stores';

import { ElNotification } from 'element-plus';
import { defineStore } from 'pinia';

import { loginApi, logoutApi } from '#/api';
import { DEFAULT_HOME_PATH, LOGIN_PATH } from '#/constants';
import { $t } from '#/locales';

/**
 * Session 认证模式下的客户端登录态标记。
 * 后端使用 JSESSIONID Cookie 维持会话，不再下发 accessToken；
 * 该标记仅用于路由守卫判断是否已登录，并非真实的鉴权凭证。
 */
const SESSION_LOGIN_FLAG = 'session-authenticated';

export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const router = useRouter();

  const loginLoading = ref(false);

  /**
   * 异步处理登录操作
   * Asynchronously handle the login process
   * @param params 登录表单数据
   */
  async function authLogin(
    params: Recordable<any>,
    onSuccess?: () => Promise<void> | void,
  ) {
    // 后端采用 Session(JSESSIONID Cookie) 认证，登录成功后不再返回 accessToken。
    // 只要 loginApi 未抛出异常（响应码为 0），即视为登录成功，会话由 Cookie 维持。
    let userInfo: null | UserInfo = null;
    try {
      loginLoading.value = true;
      const loginResult = await loginApi(params);

      // 标记客户端登录态，供路由守卫判断（真实鉴权依赖 JSESSIONID Cookie，此值非 JWT）
      accessStore.setAccessToken(SESSION_LOGIN_FLAG);

      // 直接使用登录接口返回的用户信息，不再请求 /user/info 与 /auth/codes
      userInfo = {
        avatar: '',
        realName: loginResult.username ?? '',
        userId: loginResult.userUuid ?? '',
        username: loginResult.username ?? '',
      } as UserInfo;
      userStore.setUserInfo(userInfo);

      if (accessStore.loginExpired) {
        accessStore.setLoginExpired(false);
      } else {
        onSuccess
          ? await onSuccess?.()
          : await router.push(userInfo.homePath || DEFAULT_HOME_PATH);
      }

      if (userInfo?.realName) {
        ElNotification({
          message: `${$t('authentication.loginSuccessDesc')}:${userInfo?.realName}`,
          title: $t('authentication.loginSuccess'),
          type: 'success',
        });
      }
    } finally {
      loginLoading.value = false;
    }

    return {
      userInfo,
    };
  }

  async function logout(redirect: boolean = true) {
    try {
      await logoutApi();
    } catch {
      // 不做任何处理
    }
    resetAllStores();
    accessStore.setLoginExpired(false);

    // 回登录页带上当前路由地址
    await router.replace({
      path: LOGIN_PATH,
      query: redirect
        ? {
            redirect: encodeURIComponent(router.currentRoute.value.fullPath),
          }
        : {},
    });
  }

  function $reset() {
    loginLoading.value = false;
  }

  return {
    $reset,
    authLogin,
    loginLoading,
    logout,
  };
});
