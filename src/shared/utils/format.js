// Мелкие помощники для страниц с данными API.

// "2026-09-11T10:53:56Z" → "11 вер. 2026, 13:53" (по времени браузера)
export const formatDateTime = (iso, lang = 'ua') => {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(lang === 'en' ? 'en-GB' : 'uk-UA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDate = (iso, lang = 'ua') => {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(lang === 'en' ? 'en-GB' : 'uk-UA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

// Пустое значение статистики → «—»
export const orDash = (value, digits) => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'number' && digits !== undefined) return value.toFixed(digits);
  return value;
};

// Процент 0..100 для полосок (CSS-переменная --value)
export const clampPercent = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
};

// Статус турнира с сервера → ключ перевода и цвет бейджа
// planned | registration_open | registration_closed | in_progress | finished | archived
export const TOURNAMENT_STATUS = {
  planned: { key: 'statusPlanned', tone: 'open' },
  registration_open: { key: 'statusRegistrationOpen', tone: 'open' },
  registration_closed: { key: 'statusRegistrationClosed', tone: 'open' },
  in_progress: { key: 'statusInProgress', tone: 'live' },
  // archived — это тот же завершённый турнир, просто полежавший 3 дня
  finished: { key: 'statusFinished', tone: 'done' },
  archived: { key: 'statusFinished', tone: 'done' },
};

// Статус матча в сетке
export const MATCH_STATUS = {
  pending: 'matchPending',
  scheduled: 'matchScheduled',
  in_progress: 'matchLive',
  completed: 'matchCompleted',
};
