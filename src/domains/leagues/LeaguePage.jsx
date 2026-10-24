// /league/:id — лига: этапы-турниры и таблица сезона (без входа).
// Данные: GET /api/site/leagues/{id}, GET /api/site/leagues/{id}/standings
import { Link, useParams } from 'react-router-dom';
import ui from '../../shared/styles/site.module.css';
import { useLang } from '../../shared/i18n/hooks/useLang';
import { useApi } from '../../shared/hooks/useApi';
import { getLeague, getLeagueStandings } from '../../shared/api/site';
import { formatDate } from '../../shared/utils/format';
import LoadState from '../../shared/components/LoadState';
import StatusBadge from '../../shared/components/StatusBadge';
import Avatar from '../../shared/components/Avatar';
import { LeagueStatus } from './Leagues';

const Standings = ({ leagueId }) => {
  const { t } = useLang();
  const { data, error, loading } = useApi((signal) => getLeagueStandings(leagueId, { signal }), [leagueId]);

  if (loading || error) return <LoadState loading={loading} error={error} />;
  if (!data?.rows?.length) return <p className={ui.muted}>{t('standingsEmpty')}</p>;

  return (
    <>
      <div className={ui.tableWrap}>
        <table className={ui.table}>
          <thead>
            <tr>
              <th className={ui.num}>#</th>
              <th>{t('standingsName')}</th>
              <th className={ui.num}>{t('standingsPoints')}</th>
              <th className={ui.num}>{t('standingsStages')}</th>
              <th className={ui.num}>{t('standingsFirst')}</th>
              <th className={ui.num}>{t('standingsSecond')}</th>
              <th className={ui.num}>{t('standingsThird')}</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr key={row.position}>
                <td className={ui.num}>{row.position}</td>
                <td>
                  <span className={ui.sideName}>
                    <Avatar small src={row.avatar_url} name={row.display_name} />
                    {row.display_name}
                    {row.is_champion ? ` · ${t('champion')}` : ''}
                  </span>
                </td>
                <td className={ui.num}>
                  <b>{row.points}</b>
                </td>
                <td className={ui.num}>{row.stages_played}</td>
                <td className={ui.num}>{row.first_places}</td>
                <td className={ui.num}>{row.second_places}</td>
                <td className={ui.num}>{row.third_places}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.scoring?.length > 0 && (
        <>
          <h3 className={ui.roundTitle} style={{ marginTop: 24 }}>
            {t('scoringTitle')}
          </h3>
          <div className={ui.meta}>
            {data.scoring.map((rule) => (
              <span key={`${rule.place_from}-${rule.place_to}`}>
                {rule.label}: {rule.points} {t('pointsShort')}
              </span>
            ))}
          </div>
        </>
      )}
    </>
  );
};

const LeaguePage = () => {
  const { id } = useParams();
  const { t, i18n } = useLang();
  const { data: league, error, loading } = useApi((signal) => getLeague(id, { signal }), [id]);

  if (loading || error) {
    return (
      <section className={ui.page}>
        <div className={ui.container}>
          <LoadState loading={loading} error={error} />
          {error && (
            <div className={ui.actions}>
              <Link className={ui.btnGhost} to="/leagues">
                {t('backToLeagues')}
              </Link>
            </div>
          )}
        </div>
      </section>
    );
  }

  const lang = i18n.language;
  const cover = league.cover_url || league.logo_url;

  return (
    <section className={ui.page}>
      <div className={ui.container}>
        <div className={ui.hero}>
          {cover ? <img className={ui.heroCover} src={cover} alt="" /> : <div className={ui.heroCover} />}
          <div>
            <LeagueStatus status={league.status} />
            <h1 className={ui.pageTitle} style={{ marginTop: 12 }}>
              {league.name}
            </h1>
            {league.organizer_name && (
              <div className={ui.organizer}>
                <Avatar small src={league.organizer_logo_url} name={league.organizer_name} />
                {t('organizer')}: {league.organizer_name}
              </div>
            )}
            {league.description && <p className={ui.text}>{league.description}</p>}
            <div className={ui.facts}>
              {league.participant_format && (
                <div className={ui.fact}>
                  <span className={ui.factLabel}>{t('format')}</span>
                  <span className={ui.factValue}>{league.participant_format}</span>
                </div>
              )}
              <div className={ui.fact}>
                <span className={ui.factLabel}>{t('stages')}</span>
                <span className={ui.factValue}>
                  {league.stages_played} / {league.tournaments_count}
                </span>
              </div>
              {(league.starts_at || league.ends_at) && (
                <div className={ui.fact}>
                  <span className={ui.factLabel}>{t('season')}</span>
                  <span className={ui.factValue}>
                    {formatDate(league.starts_at, lang) || '…'} — {formatDate(league.ends_at, lang) || '…'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <h2 className={ui.sectionTitle}>{t('standingsTitle')}</h2>
        <Standings leagueId={league.id} />

        <h2 className={ui.sectionTitle}>{t('leagueStages')}</h2>
        {league.tournaments?.length ? (
          <div className={ui.list}>
            {league.tournaments.map((stage) => (
              <Link key={stage.id} to={`/tournament/${stage.id}`} className={ui.row}>
                <span className={ui.sideName}>
                  <Avatar small src={stage.logo_url} name={stage.title} />
                  {stage.title}
                </span>
                <span className={ui.meta}>
                  {formatDate(stage.starts_at, lang) && <span>{formatDate(stage.starts_at, lang)}</span>}
                  <span>
                    {stage.participants_count}
                    {stage.participants_max ? ` / ${stage.participants_max}` : ''}
                  </span>
                  {stage.stage_weight !== 1 && <span>×{stage.stage_weight}</span>}
                  <StatusBadge status={stage.status} />
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className={ui.muted}>{t('leagueNoStages')}</p>
        )}

        <div className={ui.actions} style={{ marginTop: 40 }}>
          <Link className={ui.btnGhost} to="/leagues">
            {t('backToLeagues')}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default LeaguePage;
