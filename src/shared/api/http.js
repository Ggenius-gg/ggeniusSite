// Единственная точка, через которую сайт ходит в API GGenius (FastAPI).
// Адрес сервера — только из переменной VITE_API_BASE (.env.production / .env.development).
// Ни одного другого адреса API в коде быть не должно.

const API_BASE = String(import.meta.env.VITE_API_BASE || '').replace(/\/+$/, '');

// Ключ в localStorage, где лежит JWT (живёт 7 дней, refresh-токенов нет).
export const TOKEN_KEY = 'access_token';

// Старые ключи PHP-версии — чистим, чтобы не путались.
const LEGACY_KEYS = ['access', 'refresh', 'tg_user'];

export class ApiError extends Error {
  constructor(status, detail) {
    super(detail || `HTTP ${status}`);
    this.name = 'ApiError';
    // 0 — сеть недоступна (сервер выключен, нет интернета, CORS)
    this.status = status;
    this.detail = detail;
  }
}

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // приватный режим браузера — вход проживёт до перезагрузки
  }
};

export const clearToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
  } catch {
    // ignore
  }
};

// Кто хочет узнать, что токен протух (AuthProvider), подписывается здесь.
const unauthorizedListeners = new Set();
export const onUnauthorized = (listener) => {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
};

const request = async (method, path, { body, auth = false, signal } = {}) => {
  const headers = {
    // Пока сервер за ngrok: без этого заголовка ngrok отдаёт свою HTML-заглушку.
    'ngrok-skip-browser-warning': '1',
    Accept: 'application/json',
  };
  const token = auth ? getToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    throw new ApiError(0, 'network');
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    // 401 на запросе с токеном = токен протух или недействителен:
    // выходим (чистим токен) один раз и не повторяем запрос — без циклов.
    if (res.status === 401 && token) {
      clearToken();
      unauthorizedListeners.forEach((listener) => listener());
    }
    const detail = typeof data?.detail === 'string' ? data.detail : null;
    throw new ApiError(res.status, detail);
  }
  return data;
};

export const apiGet = (path, options) => request('GET', path, options);
export const apiPost = (path, body, options) => request('POST', path, { ...options, body });
