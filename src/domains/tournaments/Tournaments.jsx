// /Tourn — список турниров платформы (без входа). Данные: GET /api/site/tournaments
import { useState } from 'react';
import { Link } from 'react-router-dom';
import ui from '../../shared/styles/site.module.css';
import { useLang } from '../../shared/i18n/hooks/useLang';
import { getTournaments } from '../../shared/api/site';
import { useApi } from '../../shared/hooks/useApi';
import { formatDateTime } from '../../shared/utils/format';
import StatusBadge from '../../shared/components/StatusBadge';
import LoadState from '../../shared/components/LoadState';

const PAGE_SIZE = 12;
// Фильтр сервера: all | active | upcoming | completed
const FILTERS = [
  { value: 'all', key: 'filterAll' },
  { value: 'active', key: 'filterActive' },
  { value: 'upcoming', key: 'filterUpcoming' },
  { value: 'completed', key: 'filterCompleted' },
];

export const TournamentCard = ({ item }) => {
  const { t, i18n } = useLang();
  const starts = formatDateTime(item.starts_at, i18n.language);
  return (
    <Link to={`/tournament/${item.id}`} className={ui.tile}>
      {item.cover_image_url ? (
        <img className={ui.tileCover} src={item.cover_image_url} alt="" loading="lazy" />
      ) : (
        <div className={ui.tileCover} />
      )}
      <div className={ui.tileBody}>
        <StatusBadge status={item.status} />
        <h2 className={ui.tileTitle}>{item.title}</h2>
        <div className={ui.meta}>
          <span>{item.format}</span>
          <span>
            {t('participantsShort')}: {item.participants_count}
            {item.max_participants ? ` / ${item.max_participants}` : ''}
          </span>
          {starts && <span>{starts}</span>}
        </div>
        {item.prize_fund && (
          <div className={ui.meta}>
            {t('tournamentsInnerListItemInfoPrize')}: {item.prize_fund}
          </div>
        )}
        {item.organizer_name && <div className={ui.muted}>{item.organizer_name}</div>}
      </div>
    </Link>
  );
};

// Одна «страница» списка (PAGE_SIZE турниров). «Показать ещё» добавляет следующую.
const TournamentChunk = ({ filter, offset, isLast, onMore }) => {
  const { t } = useLang();
  const { data, error, loading } = useApi(
    (signal) => getTournaments({ status: filter, limit: PAGE_SIZE, offset }, { signal }),
    [filter, offset],
  );
  if (loading || error) return <LoadState loading={loading} error={error} />;
  if (offset === 0 && !data.items.length) return <p className={ui.muted}>{t('tournamentsEmpty')}</p>;
  return (
    <>
      <div className={ui.grid} style={{ marginBottom: 24 }}>
        {data.items.map((item) => (
          <TournamentCard key={item.id} item={item} />
        ))}
      </div>
      {isLast && data.has_next && (
        <div className={ui.actions}>
          <button type="button" className={ui.btnGhost} onClick={onMore}>
            {t('showMore')}
          </button>
        </div>
      )}
    </>
  );
};

const Tournaments = () => {
  const { t } = useLang();
  const [filter, setFilter] = useState('all');
  const [chunks, setChunks] = useState(1);

  const changeFilter = (value) => {
    setFilter(value);
    setChunks(1);
  };

  return (
    <section className={ui.page}>
      <div className={ui.container}>
        <h1 className={ui.pageTitle}>{t('tournamentsInnerTitle')}</h1>
        <p className={ui.pageSub}>{t('tournamentsSub')}</p>

        <div className={ui.tabs}>
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              className={f.value === filter ? ui.tabActive : ui.tab}
              onClick={() => changeFilter(f.value)}
            >
              {t(f.key)}
            </button>
          ))}
        </div>

        {Array.from({ length: chunks }, (_, index) => (
          <TournamentChunk
            key={`${filter}-${index}`}
            filter={filter}
            offset={index * PAGE_SIZE}
            isLast={index === chunks - 1}
            onMore={() => setChunks(chunks + 1)}
          />
        ))}
      </div>
    </section>
  );
};

export default Tournaments;
