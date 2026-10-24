// Все запросы сайта к /api/site/* и вход. Описание ответов — в README.md.
import { apiGet, apiPost } from './http';

const id = (value) => encodeURIComponent(String(value));

// ---------- Вход ----------
// fields — поля, которые Telegram дописал в адрес /auth/callback (id, first_name, …, hash).
// Отправляем как есть, без изменений: каждое поле входит в подпись.
export const loginWithTelegram = (fields) => apiPost('/api/auth/telegram/login', fields);

// ---------- Свой профиль (нужен вход) ----------
export const getMe = (options) => apiGet('/api/site/me', { ...options, auth: true });

// ---------- Турниры (без входа) ----------
// status: all | active | upcoming | completed
export const getTournaments = ({ status = 'all', limit = 20, offset = 0 } = {}, options) =>
  apiGet(`/api/site/tournaments?status=${status}&limit=${limit}&offset=${offset}`, options);
export const getTournament = (tournamentId, options) =>
  apiGet(`/api/site/tournaments/${id(tournamentId)}`, options);
export const getTournamentParticipants = (tournamentId, options) =>
  apiGet(`/api/site/tournaments/${id(tournamentId)}/participants`, options);
export const getTournamentBracket = (tournamentId, options) =>
  apiGet(`/api/site/tournaments/${id(tournamentId)}/bracket`, options);

// ---------- Лиги (без входа) ----------
export const getLeagues = ({ page = 1, perPage = 20 } = {}, options) =>
  apiGet(`/api/site/leagues?page=${page}&per_page=${perPage}`, options);
export const getLeague = (leagueId, options) => apiGet(`/api/site/leagues/${id(leagueId)}`, options);
export const getLeagueStandings = (leagueId, options) =>
  apiGet(`/api/site/leagues/${id(leagueId)}/standings`, options);

// ---------- Ссылки в Telegram ----------
export const BOT_URL = 'https://t.me/ggeniusgg_bot';
// Кнопка «Войти»: бот присылает кнопку входа, она ведёт на /auth/callback.
export const BOT_LOGIN_URL = `${BOT_URL}?start=auth`;
// Регистрация игрового профиля MLBB в боте.
export const BOT_REGISTER_URL = `${BOT_URL}?start=register`;
// Открыть Mini App. Отдельной ссылки «сразу на турнир» в Mini App пока нет —
// см. README, раздел «Известные ограничения».
export const MINI_APP_URL = `${BOT_URL}?startapp`;
