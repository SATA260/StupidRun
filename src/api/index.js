import { AppApiClient } from './client';
import { AutorunClient } from './autorun';
import { appConfig } from '../config';
import { getToken, notifyAuthFailure } from '../session/token';

export const api = new AppApiClient({
  baseURL: appConfig.api.baseUrl,
  appVersion: appConfig.appVersion,
  appKey: appConfig.auth.appKey,
  appSecret: appConfig.auth.appSecret,
  tokenProvider: getToken,
  onAuthFailure: () => notifyAuthFailure(),
});

export const autorun = new AutorunClient({
  baseURL: appConfig.autorun.baseUrl,
});

export { AppApiClient, AutorunClient };
