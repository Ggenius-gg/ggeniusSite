// /leagues — список лиг (без входа). Данные: GET /api/site/leagues
import { useState } from 'react';
import { Link } from 'react-router-dom';
import ui from '../../shared/styles/site.module.css';
import { useLang } from '../../shared/i18n/hooks/useLang';
import { useApi } from '../../shared/hooks/useApi';
import { getLeagues } from '../../shared/api/site';
import { formatDate } from '../../shared/utils/format';
import LoadState from '../../shared/components/LoadState';
import Avatar from '../../shared/components/Avatar';

const PER_PAGE = 12;

export const LeagueStatus = ({ status }) => {
  const { t } = useLang();
  // Публично видны только active и finished
  const isActive = status === 'active';
  return (
    <span className={`${ui.badge} ${isActive ? ui.badgeLive : ui.badgeDone}`}>
      {isActive ? t('leagueActive') : status === 'finished' ? t('leagueFinished') : status}
    </span>
  );
};

const LeagueCard = ({ item }) => {
  const { t, i18n } = useLang();
  const from = formatDate(item.starts_at, i18n.language);
  const to = formatDate(item.ends_at, i18n.language);
  return (
    <Link to={`/league/${item.id}`} className={ui.tile}>
      {item.cover_url || item.logo_url ? (
        <img className={ui.tileCover} src={item.cover_url || item.logo_url} alt="" loading="lazy" />
      ) : (
        <div className={ui.tileCover} />
      )}
      <div className={ui.tileBody}>
        <LeagueStatus status={item.status} />
        <h2 className={ui.tileTitle}>{item.name}</h2>
        <div className={ui.meta}>
          {item.participant_format && <span>{item.participant_format}</span>}
          <span>
            {t('stages')}: {item.stages_played} / {item.tournaments_count}
          </span>
          {(from || to) && (
            <span>
              {from || '…'} — {to || '…'}
            </span>
          )}
        </div>
        {item.leader && (
          <div className={ui.organizer}>
            <Avatar small src={item.leader.avatar_url} name={item.leader.display_name} />
            {t('leader')}: {item.leader.display_name} · {item.leader.points} {t('pointsShort')}
          </div>
        )}
        {item.organizer_name && <div className={ui.muted}>{item.organizer_name}</div>}
      </div>
    </Link>
  );
};

const Leagues = () => {
  const { t } = useLang();
  const [page, setPage] = useState(1);
  const { data, error, loading } = useApi((signal) => getLeagues({ page, perPage: PER_PAGE }, { signal }), [page]);

  return (
    <section className={ui.page}>
      <div className={ui.container}>
        <h1 className={ui.pageTitle}>{t('leaguesTitle')}</h1>
        <p className={ui.pageSub}>{t('leaguesSub')}</p>

        {data?.items?.length > 0 && (
          <div className={ui.grid}>
            {data.items.map((item) => (
              <LeagueCard key={item.id} item={item} />
            ))}
          </div>
        )}
        {!loading && !error && !data?.items?.length && <p className={ui.muted}>{t('leaguesEmpty')}</p>}
        <LoadState loading={loading} error={error} />

        {(page > 1 || data?.has_next) && !loading && (
          <div className={ui.actions}>
            {page > 1 && (
              <button type="button" className={ui.btnGhost} onClick={() => setPage(page - 1)}>
                {t('prevPage')}
              </button>
            )}
            {data?.has_next && (
              <button type="button" className={ui.btnGhost} onClick={() => setPage(page + 1)}>
                {t('nextPage')}
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default Leagues;
