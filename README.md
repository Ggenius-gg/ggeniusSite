# ggenius.shop — сайт GGenius

React 19 + Vite 7 (JavaScript), `vite-react-ssg`, переводы ua/en (`public/locales`),
хостинг — GitHub Pages из ветки `gh-pages`.

Этот README написан для разработчика сайта. Здесь всё, что нужно, чтобы продолжать работу
без чужих подсказок: что изменилось, как устроен вход, какие данные отдаёт сервер, как
запустить и задеплоить.

---

## 1. Что изменилось и почему

**Старый PHP-сервер (`ggenius-api.onrender.com`) выключается.** Причины:

- 20–21.10.2026 опубликована уязвимость **PHP2Shell** (CVE-2026-109618 / CVE-2026-109619):
  выполнение чужого кода без входа. Исправлено в PHP 8.2.35 / 8.3.36 / 8.4.27 / 8.5.12.
  Сервер отдавал `x-powered-by: PHP/8.2.30` — уязвимая версия (проверено по заголовку,
  атакой не проверялось). В переменных окружения там лежали ключи бота, JWT, MooGold, Monobank.
- База, с которой работал PHP, мёртвая — данных платформы там нет.

**Теперь сайт ходит напрямую в API платформы GGenius** (FastAPI — тот же сервер, что
у бота и Mini App). Для сайта на сервере сделан отдельный набор адресов **`/api/site/*`**
со своими ответами: Mini App меняет свои ответы часто, а ответы `/api/site/*` специально
сделаны стабильными для сайта.

Что умеет сайт в этой версии (v1):

- **вход через нашего Telegram-бота** `@ggeniusgg_bot`;
- **свой профиль — «Витрина игрока»**: фото, ник, ранг MLBB, статистика, топ-герои,
  своя команда, свои турниры, кнопка «Відкрити в Telegram»;
- **турниры и лиги для всех без входа**: список турниров (`/Tourn`), страница турнира
  (`/tournament/<id>`: участники, сетка по раундам), список лиг (`/leagues`), страница
  лиги (`/league/<id>`) с таблицей сезона.

Сайт **ничего не пишет и ничего не продаёт**. Единственный POST — обмен подписи Telegram
на токен входа.

---

## 2. Как работает вход — по шагам

1. Человек жмёт «Увійти через Telegram» в шапке сайта
   (`src/widgets/Header/Header.jsx`) → открывается `https://t.me/ggeniusgg_bot?start=auth`.
2. Бот присылает сообщение с кнопкой «Увійти на сайт». Это кнопка типа **`login_url`**,
   её адрес — `https://ggenius.shop/auth/callback`.
3. Telegram открывает этот адрес и **сам дописывает в него поля входа** (query-строка):
   `id, first_name, last_name?, username?, photo_url?, auth_date, hash`.
   `hash` — подпись Telegram: `HMAC_SHA256(строка_полей, ключ = SHA256(токен_бота))`.
   ⚠️ Кнопка `login_url` работает, только если домен `ggenius.shop` привязан к боту
   (BotFather → `/setdomain`). Это делает владелец бота.
4. На GitHub Pages страницы `/auth/callback` физически нет → Pages отдаёт `404.html`.
   Он кладёт путь (вместе с `?…`) в `sessionStorage` и уходит на `/`, а `src/main.jsx`
   возвращает адрес обратно до старта роутера. Так работают все глубокие ссылки
   (`/tournament/<id>`, `/league/<id>`, `/auth/callback?…`).
5. `src/domains/auth/api/authCallback.jsx` берёт **все** поля из адреса (без фильтра —
   если Telegram добавит новое поле, оно тоже входит в подпись) и отправляет их как есть:
   `POST /api/auth/telegram/login`. Сервер проверяет подпись и свежесть (`auth_date` не
   старше суток) и отвечает:
   ```json
   { "access_token": "<JWT>", "token_type": "bearer", "expires_in": 604800 }
   ```
6. Токен кладётся в `localStorage` под ключом **`access_token`**, адрес очищается от полей
   (`history.replaceState`), переход на `/profile`.
7. Профиль берётся из `GET /api/site/me` с заголовком `Authorization: Bearer <JWT>`.
8. **JWT живёт 7 дней. Refresh-токенов нет.** Если сервер ответил 401 на запрос с токеном —
   токен стирается, человек видит кнопку входа и просто входит заново. Повторных
   запросов нет, зацикливания нет.

Если подпись неверная или устарела — на странице `/auth/callback` текст
«Не вдалося увійти…» и кнопка «Спробувати ще» (снова ведёт в бота).

Где это в коде:

| Файл | Что делает |
|---|---|
| `src/shared/api/http.js` | единственное место, где делается `fetch`: адрес из `VITE_API_BASE`, заголовок `ngrok-skip-browser-warning`, `Authorization`, обработка 401 |
| `src/shared/api/site.js` | все адреса API сайта и ссылки на бота |
| `src/domains/auth/useAuth.jsx` | `AuthProvider`: токен, свой профиль (`me`), `login`, `logout` |
| `src/domains/auth/api/authCallback.jsx` | страница `/auth/callback` |

`AuthProvider` подключён в `src/app/App.jsx`. Не переносите его в `main.jsx`: второй
аргумент `ViteReactSSG` — это setup-функция, а не обёртка, JSX оттуда не рисуется.

---

## 3. API сайта `/api/site/*`

Все адреса — только чтение (GET). Без входа видно всё, кроме `/api/site/me`.
Невидимое (черновики, отменённые турниры, неверный id) → **404**.
В ответах без входа **нет** `telegram_id`, `player_id`, балансов и любых других
персональных данных: участник — это ник + аватар (+ команда).

| Метод | Путь | Вход | Что отдаёт |
|---|---|---|---|
| POST | `/api/auth/telegram/login` | — | JWT по полям Telegram (см. раздел 2) |
| GET | `/api/site/tournaments?status=all\|active\|upcoming\|completed&limit=1..50&offset=0` | нет | список турниров |
| GET | `/api/site/tournaments/{id}` | нет | турнир + `description`, `has_bracket` |
| GET | `/api/site/tournaments/{id}/participants` | нет | участники |
| GET | `/api/site/tournaments/{id}/bracket` | нет | сетка: матчи + раунды |
| GET | `/api/site/leagues?page=1&per_page=1..50` | нет | список лиг |
| GET | `/api/site/leagues/{id}` | нет | лига + её турниры-этапы |
| GET | `/api/site/leagues/{id}/standings` | нет | таблица сезона + очки за место |
| GET | `/api/site/me` | **JWT** | свой профиль «Витрина игрока» |

Статусы турнира: `planned`, `registration_open`, `registration_closed`, `in_progress`,
`finished`, `archived` (`archived` = тот же завершённый, просто полежал 3 дня — показываем
как «Завершено»). Статусы лиги: `active`, `finished`. Статусы матча: `pending`,
`scheduled`, `in_progress`, `completed`.

Примеры ниже — настоящие ответы живого сервера от 24.10.2026 (списки укорочены до 1–2
элементов; турниры с пометкой «[ПРОБА]» — тестовые).

<details>
<summary><code>GET /api/site/tournaments</code></summary>

```json
{
  "items": [
    {
      "id": "80cf4348-004e-4f8b-ae35-7263562bc0bc",
      "public_id": "0339",
      "title": "[ПРОБА] Ліга Осінь · етап 4",
      "short_description": "Синтетичний турнір для візуальної перевірки. Прибрати cleanup.",
      "status": "registration_closed",
      "format": "1v1",
      "cover_image_url": "https://res.cloudinary.com/dyhjzhbtp/image/upload/heroes/belerick.jpg",
      "starts_at": "2026-10-11T15:00:00Z",
      "ends_at": null,
      "registration_opens_at": "2026-10-03T15:37:58.167898Z",
      "registration_closes_at": "2026-10-06T14:37:58.167898Z",
      "participants_count": 0,
      "max_participants": 16,
      "prize_fund": "1000 UAH",
      "league_id": "11111111-0000-4000-8000-000000000101",
      "league_name": "[ПРОБА] Ліга Осінь 1v1",
      "organizer_name": "Ночі Легенд",
      "organizer_logo_url": "https://res.cloudinary.com/dyhjzhbtp/image/upload/c_fill,g_auto,w_300,h_300/heroes/lunox.jpg"
    }
  ],
  "total": 48,
  "limit": 50,
  "offset": 0,
  "has_next": false
}
```
</details>

<details>
<summary><code>GET /api/site/tournaments/{id}</code></summary>

```json
{
  "id": "92ef050d-bac2-45bd-a267-8cd00739cdc1",
  "public_id": "0292",
  "title": "[ПРОБА] First Blood 3",
  "short_description": "Синтетичний турнір для візуальної перевірки. Прибрати cleanup.",
  "status": "in_progress",
  "format": "1v1",
  "cover_image_url": "https://res.cloudinary.com/dyhjzhbtp/image/upload/heroes/suyou.jpg",
  "starts_at": "2026-09-11T10:53:56.358674Z",
  "ends_at": null,
  "registration_opens_at": "2026-09-09T08:53:56.358674Z",
  "registration_closes_at": "2026-09-11T09:53:56.358674Z",
  "participants_count": 16,
  "max_participants": 16,
  "prize_fund": "1000 UAH",
  "league_id": null,
  "league_name": null,
  "organizer_name": "Початок Легенди",
  "organizer_logo_url": "https://res.cloudinary.com/dyhjzhbtp/image/upload/v1787756401/organizer_logos/8d11815440634cc795b07a47489a6707.jpg",
  "description": "Синтетичний турнір для візуальної перевірки. Прибрати cleanup.",
  "has_bracket": true
}
```
</details>

<details>
<summary><code>GET /api/site/tournaments/{id}/participants</code></summary>

`type` — `player` (1v1) или `team` (5v5; тогда `nickname`/`avatar_url` — капитана).

```json
{
  "items": [
    {
      "type": "player",
      "nickname": "Проба 01",
      "avatar_url": null,
      "team_name": null,
      "team_tag": null,
      "team_logo_url": null,
      "is_checked_in": false,
      "registered_at": "2026-09-11T08:53:56.593679Z"
    }
  ],
  "total": 16
}
```
</details>

<details>
<summary><code>GET /api/site/tournaments/{id}/bracket</code></summary>

`bracket_side`: `L` / `R` — левая и правая половины сетки, `F` — финал,
`B` — матч за 3 место. `winner_slot`: 1, 2 или `null` (победила сторона 1 или 2).

```json
{
  "tournament_id": "92ef050d-bac2-45bd-a267-8cd00739cdc1",
  "tournament_name": "[ПРОБА] First Blood 3",
  "format": "1v1",
  "bracket_state": "in_progress",
  "matches": [
    {
      "id": "2af8bccb-f368-4927-ac17-af78416ab592",
      "round_number": 1,
      "match_number": 1,
      "round_label": "Раунд 1",
      "bracket_side": "L",
      "match_kind": null,
      "status": "completed",
      "best_of": 1,
      "participant1": { "type": "player", "name": "Проба 09", "tag": null, "logo_url": null, "is_bye": false },
      "participant2": { "type": "player", "name": "Проба 03", "tag": null, "logo_url": null, "is_bye": false },
      "score1": 0,
      "score2": 1,
      "winner_slot": 2,
      "next_match_id": "1951b070-ee9d-44ae-baf7-25300e38afed",
      "scheduled_at": "2026-09-11T10:53:56.358674Z",
      "completed_at": "2026-09-17T01:01:53.393479Z"
    }
  ],
  "rounds": [
    { "round_number": 1, "label": "Раунд 1", "best_of": 1, "total_matches": 8, "completed_matches": 8 },
    { "round_number": 2, "label": "1/4 Фіналу", "best_of": 1, "total_matches": 4, "completed_matches": 1 }
  ]
}
```
</details>

<details>
<summary><code>GET /api/site/leagues</code></summary>

```json
{
  "items": [
    {
      "id": "00afec4f-7f27-4853-8509-6733da08628a",
      "name": "Comeback",
      "description": "Comeback flow league",
      "status": "active",
      "starts_at": "2026-08-13T00:00:00Z",
      "ends_at": "2026-10-13T00:00:00Z",
      "logo_url": "https://res.cloudinary.com/dyhjzhbtp/image/upload/v1789113259/league_logos/e61d3d6f3fd44d60b3d7af543a678b33.jpg",
      "cover_url": "https://res.cloudinary.com/dyhjzhbtp/image/upload/v1790923064/league_covers/8ef448ca82fa423d86e31b89b524b7dc.jpg",
      "participant_format": "1v1",
      "tournaments_count": 20,
      "organizer_name": "Початок Легенди",
      "organizer_logo_url": "https://res.cloudinary.com/dyhjzhbtp/image/upload/v1787756401/organizer_logos/8d11815440634cc795b07a47489a6707.jpg",
      "season_state": "awaiting_results",
      "stages_played": 20,
      "leader": { "display_name": "Проба 05", "avatar_url": null, "points": 950 }
    }
  ],
  "total": 6,
  "page": 1,
  "per_page": 20,
  "has_next": false
}
```
</details>

<details>
<summary><code>GET /api/site/leagues/{id}</code></summary>

Те же поля, что у элемента списка, плюс `tournaments` — этапы сезона
(здесь часть полей пропущена ради краткости):

```json
{
  "id": "11111111-0000-4000-8000-000000000101",
  "name": "[ПРОБА] Ліга Осінь 1v1",
  "status": "active",
  "season_state": "running",
  "stages_played": 2,
  "tournaments_count": 4,
  "tournaments": [
    {
      "id": "a0ee8e55-c7f5-4d32-87d9-cc816961054b",
      "title": "[ПРОБА] Ліга Осінь · етап 1",
      "status": "archived",
      "starts_at": "2026-09-20T14:00:00Z",
      "participants_count": 8,
      "participants_max": 8,
      "logo_url": "https://res.cloudinary.com/dyhjzhbtp/image/upload/heroes/odette.jpg",
      "stage_weight": 1.0
    }
  ]
}
```
</details>

<details>
<summary><code>GET /api/site/leagues/{id}/standings</code></summary>

Строки таблицы различаются по `position` (id игрока сайт не получает).

```json
{
  "league_id": "11111111-0000-4000-8000-000000000101",
  "rows": [
    {
      "position": 1,
      "participant_type": "player",
      "display_name": "Drakon",
      "avatar_url": null,
      "points": 250,
      "stages_played": 2,
      "first_places": 2,
      "second_places": 0,
      "third_places": 0,
      "is_champion": false,
      "breakdown": [
        { "tournament_id": "a0ee8e55-c7f5-4d32-87d9-cc816961054b", "tournament_name": "[ПРОБА] Ліга Осінь · етап 1", "place_label": "1 місце", "points": 100 }
      ]
    }
  ],
  "scoring": [
    { "place_from": 1, "place_to": 1, "points": 100, "label": "1 місце" },
    { "place_from": 2, "place_to": 2, "points": 70, "label": "2 місце" }
  ]
}
```
</details>

<details>
<summary><code>GET /api/site/me</code> (нужен JWT)</summary>

Пример — тестовый пользователь без игрового профиля MLBB (`mlbb_registered: false`).
У такого человека статистика пустая (`null`), а `register_in_bot_url` ведёт на регистрацию
в боте. У игрока с профилем MLBB заполнены `mlbb`, `stats`, `top_heroes`, `squad`,
`tournaments`, а `register_in_bot_url` = `null`. `win_rate`, `mvp_rate_pct`,
`teamfight_participation_rate` — проценты 0..100.

```json
{
  "identity": {
    "display_name": "Гравець",
    "nickname": null,
    "avatar_url": null,
    "telegram_username": "probe_site_b",
    "mlbb_registered": false
  },
  "mlbb": { "player_id": null, "server_id": null, "current_rank": null, "highest_rank": null, "main_roles": null },
  "stats": {
    "total_matches": null, "win_rate": null, "kda_ratio": null, "mvp_count": null, "mvp_rate_pct": null,
    "longest_win_streak": null, "legendary_count": null, "maniac_count": null, "savage_count": null,
    "double_kill_count": null, "triple_kill_count": null, "first_blood_count": null,
    "teamfight_participation_rate": null, "avg_gold_per_min": null, "avg_hero_dmg_per_min": null,
    "avg_deaths_per_match": null, "avg_turret_dmg_per_match": null
  },
  "top_heroes": [],
  "squad": null,
  "tournaments": { "total_tournaments": null, "active_tournaments": null, "completed_tournaments": null, "recent": [] },
  "open_in_telegram_url": "https://t.me/ggeniusgg_bot?startapp",
  "register_in_bot_url": "https://t.me/ggeniusgg_bot?start=register"
}
```

Элемент `top_heroes`: `{ slot, name, matches, win_rate, power, image_url }`.
`squad`: `{ name, tag, logo_url, member_count, user_role }`.
`tournaments.recent` (до 10, свежие первыми): `{ id, title, status, format, start_time, logo_url }`.
</details>

Полное описание на стороне сервера — `mini_apps/backend/API_REFERENCE.md`, раздел 19h,
в репозитории платформы (доступ — через основателя).

---

## 4. Как запустить и как задеплоить

Адрес сервера задаётся **одной переменной** `VITE_API_BASE`:

- `.env.development` — для `npm run dev`;
- `.env.production` — для `npm run build` / `npm run deploy`;
- свой адрес локально — в `.env.development.local` (такие файлы в `.gitignore`).

Сейчас сервер работает на ноутбуке основателя за ngrok:
`https://federal-unstuck-cupid.ngrok-free.dev`. Поэтому каждый запрос несёт заголовок
`ngrok-skip-browser-warning: 1` (без него ngrok отдаёт свою HTML-страницу вместо JSON) —
это уже делает `src/shared/api/http.js`, руками добавлять не нужно.

```bash
npm ci
npm run dev                       # http://localhost:5173 — сервер разрешает CORS для этого адреса
npm run build                     # сборка в dist/
npm run preview -- --port 5173    # посмотреть собранный dist (порт 5173 — из-за CORS)
```

Проверить сервер руками:

```bash
curl -H "ngrok-skip-browser-warning: 1" "https://federal-unstuck-cupid.ngrok-free.dev/api/site/tournaments?limit=1"
```

Деплой — как раньше: `npm run deploy` (собирает и выкладывает `dist/` в ветку `gh-pages`).
**`CNAME` теперь лежит в `public/`**, поэтому попадает в `dist/` и больше не пропадает
после каждого деплоя (коммиты «Create CNAME» руками больше не нужны). `.nojekyll` в ветке
`gh-pages` лежит с июля 2025 и переживал все прошлые деплои.

Стили: старые страницы — как раньше (`index.module.scss` → скомпилированный
`index.module.css`). Новые страницы (турниры, лиги, вход, вкладки профиля) используют
обычный CSS-модуль `src/shared/styles/site.module.css` — его компилировать не нужно.
Отступ сверху у этих страниц (`.page`) считается от **реальной высоты шапки**:
`Header.jsx` меряет шапку (`ResizeObserver`) и ставит на `:root` переменные
`--header-h` (высота) и `--header-overlap` (высота, если шапка `position: fixed` —
на экранах ≤580px, иначе `0px`). Старые страницы этой переменной не пользуются.
Из `index.module.scss` убраны импорты удалённых страниц магазина; в уже
скомпилированном `index.module.css` их старые правила ещё лежат (ни на что не влияют)
и исчезнут при следующей компиляции SCSS.

---

## 5. Что убрано и почему

| Что | Почему |
|---|---|
| Страницы **Donate, Products, PaymentSuccess, PaymentFail**, формы MooGold/VIPayment, пункт меню «Пакет алмазів» | Сайт ничего не продаёт (решение основателя). Старые адреса `/Donate`, `/Products/…`, `/payment-…` ведут на главную (`src/pages/Error/NotFound.jsx`), отдельных маршрутов у них нет. |
| Баланс VIPayment, история заказов и «админка» в профиле, `WHITE_LIST` | Профиль — только витрина игрока, без денег. `WHITE_LIST` давал доступ к балансу по одному захардкоженному id. |
| Refresh-токены, таймер обновления раз в минуту, `refresh.php` | JWT нашего сервера живёт 7 дней; протух — человек входит заново. |
| `tg_user` в `localStorage` | Профиль всегда берётся с сервера (`/api/site/me`). Старые ключи `access`, `refresh`, `tg_user` стираются при выходе. |
| Все адреса `localhost:8000`, `ggenius-api.onrender.com`, `*.php`, тестовый бот `TestAuthBotb_bot`, чужой ngrok и proxy в `vite.config.js` | PHP-сервера больше нет. Все запросы — через `src/shared/api/http.js`. |
| Запросы заказов/транзакций в `App.jsx` (с выводом в консоль) | Это были чужие данные в консоли браузера. |

Мелкие исправления по пути: латинская «T» в заголовке «Турніри», «урон» в
«Економіка та шкода», язык `uk` вместо `ua` в `LanguageProvider` (папки `uk` нет —
был 404 на `translate.json`), ссылка на профиль в шапке была относительной
(`profile/` → `/profile`).

---

## 6. Известные ограничения

- **Сервер на ноутбуке** до переезда на Google Cloud: когда ноутбук спит — сайт показывает
  «Сервер GGenius зараз недоступний». Адрес ngrok может смениться при перезапуске —
  тогда поменять `VITE_API_BASE` в `.env.production` и пересобрать.
- **Ссылки «сразу на турнир» в Mini App пока нет.** Кнопка на странице турнира
  («Зареєструватися в Telegram» при открытой регистрации, иначе «Відкрити в Telegram»)
  открывает Mini App (`https://t.me/ggeniusgg_bot?startapp`), а под ней подсказка — код
  турнира, по которому его найти в «Змагання». Когда в Mini App появится такой
  параметр, поменять ссылку в `src/domains/tournaments/TournamentPage.jsx`.
- **Имя из Telegram**: для человека без профиля MLBB сервер сейчас отдаёт
  `display_name: "Гравець"`; имени из Telegram (`first_name`) в ответе нет — показываем
  «Гравець» и `@username`.
- В профиле нет полей «максимум за матч» (`highest_*`, `most_assists_in_one_game`,
  `mvp_loss_count`) и «локации» — их нет в данных платформы. На этих местах теперь
  процент побед, MVP-матчи, участие в боях, Savage и команда.
- Тексты на украинском — черновые, их ещё вычитают. Английские переводы новых строк есть,
  но тоже не вычитаны.
- В консоли браузера на каждой странице есть `Minified React error #418` — это было и до
  этих изменений: `vite-react-ssg` в продакшене всегда «гидрирует» пустой `#app`
  (сборка идёт через `vite build`, а не `vite-react-ssg build`). React сам перерисовывает
  страницу, на работу не влияет.
- На ширине окна 1401–1689 px старый `.container` (1680 px) шире окна — шапка
  обрезается справа. Это тоже было до изменений; новые страницы используют свой контейнер.
- Блок «Досягнення» профиля — прокручиваемый список высотой 250 px со скрытой полосой
  прокрутки (старые стили, не менялось): сразу видны 3 из 7 строк, остальные — прокруткой.

---

## 7. Как попросить новое поле или новый адрес API

Через основателя проекта: опишите, какое поле или какой адрес нужен и на какой странице
он будет показан. Контракт `/api/site/*` сервер **не ломает без предупреждения**:
поля не переименовываются и не удаляются молча, новые — только добавляются. Если ответу
чего-то не хватает — не обходите это на сайте (не парсите адреса Mini App, не храните
данные в `localStorage`), а попросите поле.
