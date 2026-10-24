// Вход на сайт: JWT нашего API в localStorage + свой профиль из /api/site/me.
// Refresh-токенов нет: JWT живёт 7 дней, протух — человек снова жмёт «Войти».
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { clearToken, getToken, onUnauthorized, setToken } from '../../shared/api/http';
import { getMe, loginWithTelegram } from '../../shared/api/site';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setTokenState] = useState(() => getToken());
  // me — ответ /api/site/me (SiteMeResponse) или null
  const [me, setMe] = useState(null);
  // idle — не вошёл; loading — грузим профиль; ready — профиль есть; error — сервер недоступен
  const [status, setStatus] = useState(() => (getToken() ? 'loading' : 'idle'));

  const logout = useCallback(() => {
    clearToken();
    setTokenState(null);
    setMe(null);
    setStatus('idle');
  }, []);

  // Любой 401 на запросе с токеном (см. shared/api/http.js) = выход.
  useEffect(() => onUnauthorized(logout), [logout]);

  // Загрузка своего профиля. 401 уже обработан в http.js (logout);
  // остальное — сервер недоступен: токен не трогаем, показываем «Спробувати ще».
  const fetchMe = useCallback(
    () =>
      getMe()
        .then((data) => {
          setMe(data);
          setStatus('ready');
        })
        .catch((err) => {
          if (err?.status !== 401) setStatus('error');
        }),
    [],
  );

  // Кнопка «Спробувати ще» на профиле
  const loadMe = useCallback(() => {
    if (!getToken()) return;
    setStatus('loading');
    fetchMe();
  }, [fetchMe]);

  // Есть токен (после входа или из localStorage) — подтягиваем профиль
  useEffect(() => {
    if (token) fetchMe();
  }, [token, fetchMe]);

  // fields — поля Telegram из адреса /auth/callback
  const login = useCallback(async (fields) => {
    const data = await loginWithTelegram(fields);
    setToken(data.access_token);
    setStatus('loading');
    setTokenState(data.access_token);
    return data;
  }, []);

  return (
    <AuthContext.Provider value={{ token, me, status, login, logout, reload: loadMe }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
