import { baseRequestClient, requestClient } from '#/api/request';

export namespace AuthApi {
  /** 登录接口参数 */
  export interface LoginParams {
    password?: string;
    username?: string;
  }

  /**
   * 登录接口返回值
   * 后端采用 Session(JSESSIONID Cookie) 认证，登录成功后不再下发 accessToken，
   * 仅返回基础用户标识信息，会话由 Cookie 维持。
   */
  export interface LoginResult {
    userStatus?: number;
    userUuid?: string;
    username?: string;
  }

  export interface RefreshTokenResult {
    data: string;
    status: number;
  }
}

/**
 * 登录
 * withCredentials 确保浏览器保存并回传 JSESSIONID Cookie，以维持会话
 */
export async function loginApi(data: AuthApi.LoginParams) {
  return requestClient.post<AuthApi.LoginResult>('/auth/login', data, {
    withCredentials: true,
  });
}

/**
 * 刷新accessToken
 */
export async function refreshTokenApi() {
  return baseRequestClient.post<AuthApi.RefreshTokenResult>('/auth/refresh', {
    withCredentials: true,
  });
}

/**
 * 退出登录
 */
export async function logoutApi() {
  return baseRequestClient.post('/auth/logout', {
    withCredentials: true,
  });
}
