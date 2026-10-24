// /tournament/:id — страница турнира (без входа).
// Данные: GET /api/site/tournaments/{id}, …/participants, …/bracket
import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import ui from '../../shared/styles/site.module.css';
import { useLang } from '../../shared/i18n/hooks/useLang';
import { useApi } from '../../shared/hooks/useApi';
import {
  MINI_APP_URL,
  getTournament,
  getTournamentBracket,
  getTournamentParticipants,
} from '../../shared/api/site';
import { MATCH_STATUS, formatDateTime } from '../../shared/utils/format';
import StatusBadge from '../../shared/components/StatusBadge';
import LoadState from '../../shared/components/LoadState';
import Avatar from '../../shared/components/Avatar';

// Порядок частей сетки внутри раунда: левая, правая, финал, матч за 3 место
const SIDE_ORDER = { L: 0, R: 1, F: 2, B: 3 };

// Матчи → группы по раундам. Матч за 3 место — отдельная группа со своим названием.
const groupByRound = (matches, rounds) => {
  const roundLabel = new Map((rounds || []).map((r) => [r.round_number, r.label]));
  const sorted = [...(matches || [])].sort(
    (a, b) =>
      a.round_number - b.round_number ||
      (SIDE_ORDER[a.bracket_side] ?? 9) - (SIDE_ORDER[b.bracket_side] ?? 9) ||
      a.match_number - b.match_number,
  );
  const groups = [];
  const byKey = new Map();
  sorted.forEach((m) => {
    const label = m.round_label || roundLabel.get(m.round_number) || `${m.round_number}`;
    const key = `${m.round_number}|${label}`;
    if (!byKey.has(key)) {
      const group = { key, label, matches: [] };
      byKey.set(key, group);
      groups.push(group);
    }
    byKey.get(key).matches.push(m);
  });
  return groups;
};

const Side = ({ side, score, isWinner, showScore }) => {
  const { t } = useLang();
  const name = side ? (side.is_bye ? t('bracketBye') : side.name) : t('bracketTbd');
  return (
    <div className={isWinner ? ui.sideWinner : ui.side}>
      <span className={ui.sideName}>
        <Avatar small src={side?.logo_url} name={name} />
        {name}
        {side?.tag ? ` [${side.tag}]` : ''}
      </span>
      {showScore && <span className={ui.score}>{score}</span>}
    </div>
  );
};

const Match = ({ match }) => {
  const { t, i18n } = useLang();
  const statusKey = MATCH_STATUS[match.status];
  const showScore = match.status === 'completed' || match.status === 'in_progress';
  const when = formatDateTime(match.completed_at || match.scheduled_at, i18n.language);
  return (
    <div className={ui.match}>
      <div className={ui.matchHead}>
        <span>
          #{match.match_number} · {statusKey ? t(statusKey) : match.status}
          {match.best_of > 1 ? ` · Bo${match.best_of}` : ''}
        </span>
        {when && <span>{when}</span>}
      </div>
      <Side side={match.participant1} score={match.score1} isWinner={match.winner_slot === 1} showScore={showScore} />
      <Side side={match.participant2} score={match.score2} isWinner={match.winner_slot === 2} showScore={showScore} />
    </div>
  );
};

const Bracket = ({ tournamentId }) => {
  const { t } = useLang();
  const { data, error, loading } = useApi((signal) => getTournamentBracket(tournamentId, { signal }), [tournamentId]);
  const groups = useMemo(() => groupByRound(data?.matches, data?.rounds), [data]);

  if (loading || error) return <LoadState loading={loading} error={error} />;
  if (!groups.length) return <p className={ui.muted}>{t('bracketEmpty')}</p>;

  return (
    <div className={ui.rounds}>
      {groups.map((group) => {
        const done = group.matches.filter((m) => m.status === 'completed').length;
        return (
          <div key={group.key}>
            <h3 className={ui.roundTitle}>
              {group.label}
              <span className={ui.muted}>
                {done} / {group.matches.length}
              </span>
            </h3>
            <div className={ui.matches}>
              {group.matches.map((m) => (
                <Match key={m.id} match={m} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Participants = ({ tournamentId }) => {
  const { t } = useLang();
  const { data, error, loading } = useApi(
    (signal) => getTournamentParticipants(tournamentId, { signal }),
    [tournamentId],
  );

  if (loading || error) return <LoadState loading={loading} error={error} />;
  if (!data?.items?.length) return <p className={ui.muted}>{t('participantsEmpty')}</p>;

  return (
    <div className={ui.people}>
      {data.items.map((p, index) => {
        // Команда (5v5): показываем команду; игрок (1v1): ник
        const isTeam = p.type === 'team';
        const name = isTeam ? p.team_name || p.nickname : p.nickname;
        const image = isTeam ? p.team_logo_url || p.avatar_url : p.avatar_url;
        return (
          <div className={ui.person} key={`${name}-${index}`}>
            <Avatar src={image} name={name} />
            <div style={{ minWidth: 0 }}>
              <div className={ui.personName}>
                {name || '—'}
                {isTeam && p.team_tag ? ` [${p.team_tag}]` : ''}
              </div>
              {isTeam && p.nickname && (
                <div className={ui.muted}>
                  {t('captain')}: {p.nickname}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Fact = ({ label, value }) =>
  value === null || value === undefined || value === '' ? null : (
    <div className={ui.fact}>
      <span className={ui.factLabel}>{label}</span>
      <span className={ui.factValue}>{value}</span>
    </div>
  );

const TournamentPage = () => {
  const { id } = useParams();
  const { t, i18n } = useLang();
  const { data: tour, error, loading } = useApi((signal) => getTournament(id, { signal }), [id]);
  const lang = i18n.language;

  if (loading || error) {
    return (
      <section className={ui.page}>
        <div className={ui.container}>
          <LoadState loading={loading} error={error} />
          {error && (
            <div className={ui.actions}>
              <Link className={ui.btnGhost} to="/Tourn">
                {t('backToTournaments')}
              </Link>
            </div>
          )}
        </div>
      </section>
    );
  }

  const registrationOpen = tour.status === 'registration_open';

  return (
    <section className={ui.page}>
      <div className={ui.container}>
        <div className={ui.hero}>
          {tour.cover_image_url ? (
            <img className={ui.heroCover} src={tour.cover_image_url} alt="" />
          ) : (
            <div className={ui.heroCover} />
          )}
          <div>
            <StatusBadge status={tour.status} />
            <h1 className={ui.pageTitle} style={{ marginTop: 12 }}>
              {tour.title}
            </h1>
            {tour.organizer_name && (
              <div className={ui.organizer}>
                <Avatar small src={tour.organizer_logo_url} name={tour.organizer_name} />
                {t('organizer')}: {tour.organizer_name}
              </div>
            )}
            {tour.league_id && tour.league_name && (
              <div className={ui.organizer}>
                {t('league')}: <Link to={`/league/${tour.league_id}`}>{tour.league_name}</Link>
              </div>
            )}

            <div className={ui.facts}>
              <Fact label={t('format')} value={tour.format} />
              <Fact
                label={t('participants')}
                value={`${tour.participants_count}${tour.max_participants ? ` / ${tour.max_participants}` : ''}`}
              />
              <Fact label={t('tournamentsInnerListItemInfoPrize')} value={tour.prize_fund} />
              <Fact label={t('startsAt')} value={formatDateTime(tour.starts_at, lang)} />
              <Fact label={t('registrationOpensAt')} value={formatDateTime(tour.registration_opens_at, lang)} />
              <Fact label={t('registrationClosesAt')} value={formatDateTime(tour.registration_closes_at, lang)} />
              <Fact label={t('tournamentCode')} value={tour.public_id} />
            </div>

            {/* Отдельной ссылки «сразу на этот турнир» в Mini App пока нет:
                открываем Mini App, турнир человек находит в «Змагання» по названию/коду. */}
            <div className={ui.actions}>
              <a className={ui.btnPrimary} href={MINI_APP_URL} target="_blank" rel="noreferrer">
                {registrationOpen ? t('registerInTelegram') : t('openInTelegram')}
              </a>
            </div>
            <p className={ui.muted}>{t('findInMiniApp', { code: tour.public_id || tour.title })}</p>
          </div>
        </div>

        {tour.description && (
          <>
            <h2 className={ui.sectionTitle}>{t('aboutTournament')}</h2>
            <p className={ui.text}>{tour.description}</p>
          </>
        )}

        <h2 className={ui.sectionTitle}>{t('participants')}</h2>
        <Participants tournamentId={tour.id} />

        <h2 className={ui.sectionTitle}>{t('bracket')}</h2>
        {tour.has_bracket ? <Bracket tournamentId={tour.id} /> : <p className={ui.muted}>{t('bracketEmpty')}</p>}

        <div className={ui.actions} style={{ marginTop: 40 }}>
          <Link className={ui.btnGhost} to="/Tourn">
            {t('backToTournaments')}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default TournamentPage;
