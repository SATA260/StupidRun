import AsyncStorage from '@react-native-async-storage/async-storage';

import { api } from '../api';
import { hydrateCustomMaps, setCustomMapStorage } from '../domain/map';
import { getToken, onAuthFailure, setToken } from './token';

const APP_STATE_KEY = 'byerun.app_state';

let state = {
  userInfo: null,
  runInfo: null,
  runStandard: null,
  activityInfo: null,
};

const listeners = new Set();

function snapshot() {
  const userInfo = state.userInfo;
  return {
    userInfo,
    runInfo: state.runInfo,
    runStandard: state.runStandard,
    activityInfo: state.activityInfo,
    token: getToken(),
    userId: userInfo?.userId || null,
    studentId: userInfo?.studentId || null,
    schoolId: userInfo?.schoolId || null,
  };
}

function emit() {
  const value = snapshot();
  listeners.forEach((listener) => listener(value));
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot() {
  return snapshot();
}

async function persist() {
  await AsyncStorage.setItem(
    APP_STATE_KEY,
    JSON.stringify({
      userInfo: state.userInfo,
      runInfo: state.runInfo,
      runStandard: state.runStandard,
      activityInfo: state.activityInfo,
    }),
  );
}

export async function clearSession() {
  state = {
    userInfo: null,
    runInfo: null,
    runStandard: null,
    activityInfo: null,
  };
  setToken('');
  await AsyncStorage.removeItem(APP_STATE_KEY);
  emit();
}

function applyUser(userInfo) {
  state.userInfo = userInfo || null;
  setToken(userInfo?.oauthToken?.token || '');
}

export async function hydrate() {
  setCustomMapStorage({
    setItem: (key, value) => AsyncStorage.setItem(key, value),
  });
  await hydrateCustomMaps((key) => AsyncStorage.getItem(key));

  try {
    const raw = await AsyncStorage.getItem(APP_STATE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === 'object') {
      state = {
        userInfo: parsed.userInfo || null,
        runInfo: parsed.runInfo || null,
        runStandard: parsed.runStandard || null,
        activityInfo: parsed.activityInfo || null,
      };
      setToken(state.userInfo?.oauthToken?.token || '');
    }
  } catch (error) {
    console.error('hydrate session failed:', error);
  }

  emit();
  if (getToken()) {
    refresh().catch(() => {});
  }
}

export async function refresh() {
  try {
    const userRes = await api.getToken();
    if (Number(userRes.data?.code) !== 10000) {
      return { ok: false, message: userRes.data?.msg || '登录状态校验失败' };
    }

    applyUser(userRes.data.response);
    const { schoolId, userId, studentId } = state.userInfo || {};
    const [standardRes, activityRes] = await Promise.all([
      api.getRunStandard(schoolId).catch(() => null),
      api.getJoinNum(schoolId, studentId).catch(() => null),
    ]);

    if (Number(standardRes?.data?.code) === 10000) {
      state.runStandard = standardRes.data.response;
      const semesterFromStandard = state.runStandard?.semesterYear;
      const now = new Date();
      const finalSemester =
        semesterFromStandard || `${now.getFullYear()}${now.getMonth() + 1 < 8 ? '1' : '2'}`;
      const runInfoRes = await api.getRunInfo(Number(userId), finalSemester).catch(() => null);
      if (Number(runInfoRes?.data?.code) === 10000) {
        state.runInfo = runInfoRes.data.response;
      }
    }

    if (Number(activityRes?.data?.code) === 10000) {
      state.activityInfo = activityRes.data.response;
    }

    await persist();
    emit();
    return { ok: true, message: '' };
  } catch (error) {
    console.error('Fetch data failed:', error);
    const responseData = error?.response?.data;
    const message = responseData?.msg || responseData?.message || error?.message || '用户数据加载失败';
    return { ok: false, message: String(message) };
  }
}

export async function login(phone, password) {
  const { data } = await api.login(String(phone || '').trim(), password, '');
  if (Number(data?.code) !== 10000) {
    return { ok: false, message: data?.msg || data?.message || '登录失败' };
  }

  applyUser(data.response);
  await persist();
  emit();
  const refreshed = await refresh();
  if (!refreshed.ok && refreshed.message) {
    return { ok: true, message: refreshed.message };
  }
  return { ok: true, message: '' };
}

export async function logout() {
  await clearSession();
}

onAuthFailure(() => {
  clearSession().catch(() => {});
});
