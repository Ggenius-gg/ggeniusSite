// /auth/callback — сюда Telegram приводит человека после кнопки «Войти на сайт» в боте.
// Telegram дописывает в адрес поля входа: id, first_name, last_name?, username?,
// photo_url?, auth_date, hash. Мы отправляем их как есть на
// POST /api/auth/telegram/login, сервер проверяет подпись и выдаёт JWT.
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../useAuth';
import { useLang } from '../../../shared/i18n/hooks/useLang';
import { BOT_LOGIN_URL } from '../../../shared/api/site';
import ui from '../../../shared/styles/site.module.css';

const readTelegramFields = () => {
  const params = new URLSearchParams(window.location.search);
  const fields = {};
  // Все поля из адреса, без фильтра: Telegram может добавить новые,
  // и они тоже входят в подпись.
  params.forEach((value, key) => {
    fields[key] = value;
  });
  return fields;
};

const AuthCallback = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useLang();
  // Поля читаем один раз при открытии страницы
  const [fields] = useState(readTelegramFields);
  const [error, setError] = useState(() => (!fields.hash || !fields.id ? 'authErrorNoData' : null));
  const started = useRef(false);

  useEffect(() => {
    // React StrictMode/повторный рендер не должен слать вход дважды
    if (started.current) return;
    started.current = true;

    // Поля входа больше не нужны в адресной строке (и в истории браузера)
    window.history.replaceState(null, '', window.location.pathname);
    if (!fields.hash || !fields.id) return;

    login(fields)
      .then(() => navigate('/profile', { replace: true }))
      .catch((err) => {
        if (err?.status === 401) setError('authErrorSignature');
        else if (err?.status === 0) setError('authErrorNetwork');
        else setError('authErrorServer');
      });
  }, [fields, login, navigate]);

  if (!error) {
    return (
      <section className={ui.page}>
        <div className={ui.container}>
          <p className={ui.muted}>{t('authLoading')}</p>
        </div>
      </section>
    );
  }

  return (
    <section className={ui.page}>
      <div className={ui.container}>
        <div className={ui.card}>
          <h1 className={ui.cardTitle}>{t('authErrorTitle')}</h1>
          <p className={ui.text}>{t(error)}</p>
          <a className={ui.btnPrimary} href={BOT_LOGIN_URL}>
            {t('authRetry')}
          </a>
        </div>
      </div>
    </section>
  );
};

export default AuthCallback;
