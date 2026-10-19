let token = '';
const authListeners = new Set();

export function getToken() {
  return token;
}

export function setToken(value) {
  token = value || '';
}

export function onAuthFailure(listener) {
  authListeners.add(listener);
  return () => authListeners.delete(listener);
}

export function notifyAuthFailure() {
  authListeners.forEach((listener) => listener());
}
