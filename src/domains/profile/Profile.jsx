// /profile — «Витрина игрока»: свой профиль из GET /api/site/me (нужен вход).
// Только чтение: без кошелька и покупок. Разметка статистики — прежняя (поля совпадают).
import { useState } from 'react';
import { Link } from 'react-router-dom';
import style from '../../shared/styles/index.module.css';
import ui from '../../shared/styles/site.module.css';
import { useAuth } from '../../domains/auth/useAuth';
import { useLang } from '../../shared/i18n/hooks/useLang';
import { BOT_LOGIN_URL, BOT_REGISTER_URL } from '../../shared/api/site';
import { clampPercent, formatDate, orDash } from '../../shared/utils/format';
import StatusBadge from '../../shared/components/StatusBadge';
import Avatar from '../../shared/components/Avatar';


// ------------ UTILS -----------
import { calcPercent } from './utils/calcPercent';


import userBack from './img/userBackground.webp'
import backMob from './img/backMob.webp'
import iconId from './img/icon-id.svg'
import iconRole from './img/icon-role.svg'
import iconLocation from './img/icon-location.svg'
import iconInfo from './img/icon-info.svg'

// 57.3 → «57%», null → «—»
const pct = (value) => (value === null || value === undefined ? '—' : `${Math.round(value)}%`);

// Состояния без профиля: не вошёл / грузим / сервер недоступен
const ProfileMessage = ({ text, action }) => (
  <section className={ui.page}>
    <div className={ui.container}>
      <div className={ui.card} style={{ maxWidth: 560 }}>
        <p className={ui.text}>{text}</p>
        {action}
      </div>
    </div>
  </section>
);

// Человек вошёл, но игровой профиль MLBB ещё не зарегистрирован
const RegisterInBot = ({ url }) => {
  const { t } = useLang();
  return (
    <div className={ui.card}>
      <h3 className={ui.cardTitle}>{t('profileNoMlbbTitle')}</h3>
      <p className={ui.text}>{t('profileNoMlbbText')}</p>
      <a className={ui.btnPrimary} href={url || BOT_REGISTER_URL} target="_blank" rel="noreferrer">
        {t('profileRegisterInBot')}
      </a>
    </div>
  );
};

const HeroesAndSquad = ({ me }) => {
  const { t } = useLang();
  const heroes = me.top_heroes || [];
  return (
    <div className={ui.tabPanel}>
      <h3 className={ui.cardTitle}>{t('profileTopHeroes')}</h3>
      {heroes.length ? (
        <div className={ui.heroes}>
          {heroes.map((hero) => (
            <div className={ui.heroCard} key={hero.slot}>
              {hero.image_url ? (
                <img className={ui.heroImg} src={hero.image_url} alt="" loading="lazy" />
              ) : (
                <div className={ui.heroImg} />
              )}
              <b>{hero.name}</b>
              <div className={ui.muted}>
                {hero.matches != null && `${hero.matches} ${t('matchesShort')}`}
                {hero.win_rate != null && ` · WR ${Math.round(hero.win_rate)}%`}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className={ui.muted}>{t('profileNoHeroes')}</p>
      )}

      <h3 className={ui.cardTitle} style={{ marginTop: 32 }}>{t('profileSquad')}</h3>
      {me.squad ? (
        <div className={ui.person} style={{ maxWidth: 420 }}>
          <Avatar src={me.squad.logo_url} name={me.squad.name} />
          <div>
            <div className={ui.personName}>
              {me.squad.name}
              {me.squad.tag ? ` [${me.squad.tag}]` : ''}
            </div>
            <div className={ui.muted}>
              {me.squad.member_count != null && `${t('squadMembers')}: ${me.squad.member_count}`}
              {me.squad.user_role ? ` · ${me.squad.user_role === 'captain' ? t('captain') : me.squad.user_role}` : ''}
            </div>
          </div>
        </div>
      ) : (
        <p className={ui.muted}>{t('profileNoSquad')}</p>
      )}
    </div>
  );
};

const MyTournaments = ({ me }) => {
  const { t, i18n } = useLang();
  const tours = me.tournaments || {};
  const recent = tours.recent || [];
  return (
    <div className={ui.tabPanel}>
      <div className={ui.facts}>
        <div className={ui.fact}>
          <span className={ui.factLabel}>{t('profileTournamentsTotal')}</span>
          <span className={ui.factValue}>{orDash(tours.total_tournaments)}</span>
        </div>
        <div className={ui.fact}>
          <span className={ui.factLabel}>{t('profileTournamentsActive')}</span>
          <span className={ui.factValue}>{orDash(tours.active_tournaments)}</span>
        </div>
        <div className={ui.fact}>
          <span className={ui.factLabel}>{t('profileTournamentsCompleted')}</span>
          <span className={ui.factValue}>{orDash(tours.completed_tournaments)}</span>
        </div>
      </div>
      {recent.length ? (
        <div className={ui.list}>
          {recent.map((row) => (
            <Link key={row.id} to={`/tournament/${row.id}`} className={ui.row}>
              <span className={ui.sideName}>
                <Avatar small src={row.logo_url} name={row.title} />
                {row.title}
              </span>
              <span className={ui.meta}>
                {row.format && <span>{row.format}</span>}
                {formatDate(row.start_time, i18n.language) && <span>{formatDate(row.start_time, i18n.language)}</span>}
                <StatusBadge status={row.status} />
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <p className={ui.muted}>
          {t('profileNoTournaments')} <Link to="/Tourn">{t('navListItemLinkTourn')}</Link>
        </p>
      )}
    </div>
  );
};


const Profile = () => {
  const { me, status, token, reload } = useAuth() || {};
  const [nav, setNav] = useState(1)
  const { t } = useLang()

  if (!token) {
    return (
      <ProfileMessage
        text={t('profileSignInHint')}
        action={<a className={ui.btnPrimary} href={BOT_LOGIN_URL}>{t('navLogin')}</a>}
      />
    );
  }
  if (status === 'error') {
    return (
      <ProfileMessage
        text={t('stateNetwork')}
        action={<button type="button" className={ui.btnGhost} onClick={reload}>{t('authRetry')}</button>}
      />
    );
  }
  if (!me) return <ProfileMessage text={t('stateLoading')} />;

  const { identity, mlbb, stats } = me;
  const name = identity.nickname || identity.display_name || identity.telegram_username || '—';
  const roles = mlbb.main_roles || [];

  return <>
    <section className={style.profile}>
      <div className={style.container}>
        <div className={style.profileInner}>
          <div className={style.profileInnerUserInfo} data-aos="fade-down">
            <div className={style.profileInnerUserInfoObv}>
              <img className={style.profileInnerUserInfoBack} src={userBack} alt="" />
              <img className={style.profileInnerUserInfoBackMob} src={backMob} alt="" />

              <div className={style.profileInnerUserInfoAvatarEff}>
                {identity.avatar_url
                  ? <img src={identity.avatar_url} alt="avatar" className={style.profileInnerUserInfoImg} />
                  : <span className={style.profileInnerUserInfoImg} />}
                <span className={style.profileInnerUserInfoAvatarEff1}></span>
              </div>
              <div className={style.profileInnerUserInfoTxt}>
                <h1 className={style.profileInnerUserInfoTitle}>
                  {name}
                </h1>
                {identity.mlbb_registered ? <>
                  <p className={style.profileInnerUserInfoRank}>
                    <img src={iconId} alt="" /> {t('profileInnerUserInfoRankId')} {orDash(mlbb.player_id)}{mlbb.server_id ? ` (${mlbb.server_id})` : ''}
                  </p>
                  <p className={style.profileInnerUserInfoRank}>
                    <img src={iconRole} alt="" /> {t('profileInnerUserInfoRankRole')} {roles.length ? roles.join(', ') : '—'}
                  </p>
                  <p className={style.profileInnerUserInfoRank}>
                    <img src={iconLocation} alt="" /> {t('profileSquad')}: {me.squad ? me.squad.name : '—'}
                  </p>
                </> : (
                  <p className={style.profileInnerUserInfoRank}>
                    {identity.telegram_username ? `@${identity.telegram_username}` : ''}
                  </p>
                )}
                <div className={ui.actions} style={{ margin: '10px 0 0' }}>
                  <a className={ui.btnPrimary} style={{ padding: '10px 22px' }} href={me.open_in_telegram_url} target="_blank" rel="noreferrer">
                    {t('openInTelegram')}
                  </a>
                </div>
              </div>
            </div>
          </div>



          <div className={style.profileInnerHeader} >
            {/* -------------------- НАВИГАЦИЯ -------------------- */}
            <div className={style.profileInnerHeaderNav}>
              <ul className={style.profileInnerHeaderList} data-aos="fade-right">
                <li className={nav == 1 ? style.profileInnerHeaderListItem : style.profileInnerHeaderListItemOff}
                  onClick={() => setNav(1)}>
                  {t('profileInnerHeaderListItemTotal')}
                </li>
                <li className={nav == 2 ? style.profileInnerHeaderListItem : style.profileInnerHeaderListItemOff}
                  onClick={() => setNav(2)}>
                  {t('profileTabHeroes')}
                </li>
                <li className={nav == 3 ? style.profileInnerHeaderListItem : style.profileInnerHeaderListItemOff}
                  onClick={() => setNav(3)}>
                  {t('profileTabTournaments')}
                </li>
              </ul>
            </div>

            <div className={style.profileInnerHeaderGroups} data-aos="fade-down">
              {/* -------------------- ЗАГАЛЬНА ІНФОРМАЦІЯ -------------------- */}
              <div className={nav === 1 ? style.profileInnerHeaderInfo : style.profileInnerHeaderInfoDis}>
                <div className={style.profileInnerHeaderInfo1Nav}>
                  <h3 className={style.profileInnerHeaderInfo1NavTitle}>
                    {t('profileInnerHeaderInfoNavTitle')}
                  </h3>
                </div>

                {/* Без игрового профиля MLBB статистики нет — предлагаем регистрацию в боте */}
                {!identity.mlbb_registered ? <RegisterInBot url={me.register_in_bot_url} /> : <>
                {/* -------------------- ЗА ВЕСЬ ЧАС -------------------- */}
                <div className={style.profileInnerHeaderInfo1Total}>
                  <div className={style.profileInnerHeaderInfo1TotalStat}>
                    <div className={style.profileInnerHeaderInfo1TotalStatGroup} >

                      {/*-------------------- ЗАГАЛЬНІ ЗНАЧЕННЯ -------------------- */}
                      <div className={style.profileInnerHeaderInfo1TotalStatGroup1} data-aos="flip-left">
                        <div className={style.profileInnerHeaderInfo1TotalStatGroup1TotalMeaning}>
                          <h4 className={style.profileInnerHeaderInfo1TotalStatTitle}>
                            {t('profileInnerHeaderInfo1TotalStatTitle')}
                          </h4>
                          <ul className={style.profileInnerHeaderInfo1TotalStatList}>
                            <li className={style.profileInnerHeaderInfo1TotalStatListItem}>
                              <img src={iconInfo} alt="" className={style.profileInnerHeaderInfo1TotalStatListItemImg} />
                              <div className={style.profileInnerHeaderInfo1TotalStatListItemCont}>
                                <h4 className={style.profileInnerHeaderInfo1TotalStatListItemTitle}>
                                  {t('profileInnerHeaderInfo1TotalStatListItemTitleTotalMatches')}
                                </h4>
                                <p className={style.profileInnerHeaderInfo1TotalStatListItemSub}>
                                  {orDash(stats.total_matches)}
                                </p>
                              </div>
                            </li>
                            <li className={style.profileInnerHeaderInfo1TotalStatListItem}>
                              <img src={iconInfo} alt="" className={style.profileInnerHeaderInfo1TotalStatListItemImg} />
                              <div className={style.profileInnerHeaderInfo1TotalStatListItemCont}>
                                <h4 className={style.profileInnerHeaderInfo1TotalStatListItemTitle}>
                                  {t('profileInnerHeaderInfo1TotalStatListItemTitleMaksMinRank')}
                                </h4>
                                <p className={style.profileInnerHeaderInfo1TotalStatListItemSub}>
                                  {orDash(mlbb.current_rank)}
                                </p>
                              </div>
                            </li>
                            <li className={style.profileInnerHeaderInfo1TotalStatListItem}>
                              <img src={iconInfo} alt="" className={style.profileInnerHeaderInfo1TotalStatListItemImg} />
                              <div className={style.profileInnerHeaderInfo1TotalStatListItemCont}>
                                <h4 className={style.profileInnerHeaderInfo1TotalStatListItemTitle}>
                                  {t('profileInnerHeaderInfo1TotalStatListItemTitleMaksMaksRank')}
                                </h4>
                                <p className={style.profileInnerHeaderInfo1TotalStatListItemSub}>
                                  {orDash(mlbb.highest_rank)}

                                </p>
                              </div>
                            </li>
                          </ul>
                        </div>

                        {/* ДЕТАЛІ */}
                        <div className={style.profileInnerHeaderInfo1TotalStatGroup1Detail}>
                          <h4 className={style.profileInnerHeaderInfo1TotalStatGroup1DetailTitle}>
                            {t('profileInnerHeaderInfo1TotalStatGroup1DetailTitle')}
                          </h4>
                          <ul className={style.profileInnerHeaderInfo1TotalStatListDet}>
                            <li className={style.profileInnerHeaderInfo1TotalStatListItemDet}>
                              <div className={style.profileInnerHeaderInfo1TotalStatListItemHed}>
                                <img src={iconInfo} alt="" className={style.profileInnerHeaderInfo1TotalStatListItemImgDet} />
                                <h4 className={style.profileInnerHeaderInfo1TotalStatListItemTitle}>
                                  {t('profileInnerHeaderInfo1TotalStatListItemTitleKDA')}
                                </h4>
                              </div>
                              <p className={style.profileInnerHeaderInfo1TotalStatListItemSubDet}>
                                {orDash(stats.kda_ratio, 2)}
                              </p>
                            </li>
                            <li className={style.profileInnerHeaderInfo1TotalStatListItemDet}>
                              <div className={style.profileInnerHeaderInfo1TotalStatListItemHed}>
                                <img src={iconInfo} alt="" className={style.profileInnerHeaderInfo1TotalStatListItemImgDet} />
                                <h4 className={style.profileInnerHeaderInfo1TotalStatListItemTitle}>
                                  {t('profileInnerHeaderInfo1TotalStatListItemTitleDead')}
                                </h4>
                              </div>
                              <p className={style.profileInnerHeaderInfo1TotalStatListItemSubDet}>
                                {orDash(stats.avg_deaths_per_match, 1)}
                              </p>
                            </li>
                            <li className={style.profileInnerHeaderInfo1TotalStatListItemDet}>
                              <div className={style.profileInnerHeaderInfo1TotalStatListItemHed}>
                                <img src={iconInfo} alt="" className={style.profileInnerHeaderInfo1TotalStatListItemImgDet} />
                                <h4 className={style.profileInnerHeaderInfo1TotalStatListItemTitle}>
                                  {t('profileStatWinRate')}
                                </h4>
                              </div>
                              <p className={style.profileInnerHeaderInfo1TotalStatListItemSubDet}>
                                {pct(stats.win_rate)}
                              </p>
                            </li>
                          </ul>
                        </div>

                        {/* Економіка та шкода ( урон)  */}
                        <div className={style.profileInnerEconomy}>
                          <h5 className={style.profileInnerEconomyTitle}>
                            {t('profileInnerEconomyTitle')}
                          </h5>

                          <ul className={style.profileInnerEconomyList}>
                            {/* GOLD */}
                            <li className={style.profileInnerEconomyListItem}>
                              <div className={style.profileInnerEconomyListItemHeads}>
                                <div className={style.profileInnerEconomyListItemHeadsCont}>
                                  <img src={iconInfo} alt="icon" className={style.profileInnerEconomyListItemHeadsImg} />
                                  <h5 className={style.profileInnerEconomyListItemHeadsTitle}>
                                    {t('profileInnerEconomyListItemHeadsTitleGold')}
                                  </h5>
                                </div>
                                <p className={style.profileInnerEconomyListItemSubGoldMob}>
                                  {orDash(stats.avg_gold_per_min, 0)}
                                </p>
                              </div>
                              <div className={style.profileInnerEconomyListItemBack}>
                                <div className={style.profileInnerEconomyListItemBackStroke} style={{ '--value': calcPercent(stats.avg_gold_per_min ?? 0) }}>
                                  <span className={style.profileInnerEconomyListItemBackStrokeInfo}>
                                  </span>
                                </div>
                              </div>
                              <p className={style.profileInnerEconomyListItemSubGold}>
                                {orDash(stats.avg_gold_per_min, 0)}
                              </p>
                            </li>

                            {/* DAMEG */}
                            <li className={style.profileInnerEconomyListItem}>
                              <div className={style.profileInnerEconomyListItemHeads}>
                                <div className={style.profileInnerEconomyListItemHeadsCont}>

                                  <img src={iconInfo} alt="icon" className={style.profileInnerEconomyListItemHeadsImg} />
                                  <h5 className={style.profileInnerEconomyListItemHeadsTitle}>
                                    {t('profileInnerEconomyListItemHeadsTitleDmg')}
                                  </h5>
                                </div>
                                <p className={style.profileInnerEconomyListItemSubDMGMob}>
                                  {orDash(stats.avg_hero_dmg_per_min, 0)}
                                </p>
                              </div>
                              <div className={style.profileInnerEconomyListItemBack}>
                                <div className={style.profileInnerEconomyListItemBackStroke} style={{ '--value': calcPercent(stats.avg_hero_dmg_per_min ?? 0) }}>
                                  <span className={style.profileInnerEconomyListItemBackStrokeInfo}>
                                  </span>
                                </div>
                              </div>
                              <p className={style.profileInnerEconomyListItemSubDMG}>
                                {orDash(stats.avg_hero_dmg_per_min, 0)}
                              </p>
                            </li>
                            {/* turret DMG */}
                            <li className={style.profileInnerEconomyListItem}>
                              <div className={style.profileInnerEconomyListItemHeads}>
                                <div className={style.profileInnerEconomyListItemHeadsCont}>

                                  <img src={iconInfo} alt="icon" className={style.profileInnerEconomyListItemHeadsImg} />
                                  <h5 className={style.profileInnerEconomyListItemHeadsTitle}>
                                    {t('profileStatTurretDmg')}
                                  </h5>
                                </div>
                                <p className={style.profileInnerEconomyListItemSubTurDMGMob}>
                                  {orDash(stats.avg_turret_dmg_per_match, 0)}
                                </p>
                              </div>
                              <div className={style.profileInnerEconomyListItemBack} >
                                <div className={style.profileInnerEconomyListItemBackStroke} style={{ '--value': calcPercent(stats.avg_turret_dmg_per_match ?? 0) }}>

                                </div>
                              </div>
                              <p className={style.profileInnerEconomyListItemSubTurDMG}>
                                {orDash(stats.avg_turret_dmg_per_match, 0)}
                              </p>
                            </li>
                          </ul>
                        </div>
                      </div>

                      {/* ---------------- СЕРЕДНЯ ЗА МАТЧ СТАТИСТИКА --------------- */}
                      <div className={style.profileInnerTotalMatches} data-aos="fade-left">
                        {/* -------------------- СРЕДНЕЕ -------------------- */}
                        <div className={style.profileInnerTotalMatchesАverage}>
                          <h5 className={style.profileInnerTotalMatchesАverageTitle}>
                            {t('profileStatRatesTitle')}
                          </h5>

                          <ul className={style.profileInnerTotalMatchesАverageList}>
                            <li className={style.profileInnerTotalMatchesАverageListItem}>
                              <div className={style.profileInnerTotalMatchesАverageListItemHed}>
                                <span className={style.profileInnerTotalMatchesАverageListItemHed}>
                                  <img src={iconInfo} className={style.profileInnerTotalMatchesАverageListItemHedImg} alt="" />
                                  <h5 className={style.profileInnerTotalMatchesАverageListItemHeadTitle}>
                                    {t('profileStatWinRate')}
                                  </h5>
                                </span>
                                <p className={style.profileInnerTotalMatchesАverageListItemHedSub}>
                                  {pct(stats.win_rate)}
                                </p>
                              </div>

                              <div className={style.profileInnerTotalMatchesАverageListItemBack} style={{ '--valueMax': clampPercent(stats.win_rate) }}>
                                <span></span>
                              </div>
                            </li>
                            <li className={style.profileInnerTotalMatchesАverageListItem}>
                              <div className={style.profileInnerTotalMatchesАverageListItemHed}>
                                <span className={style.profileInnerTotalMatchesАverageListItemHed}>
                                  <img src={iconInfo} className={style.profileInnerTotalMatchesАverageListItemHedImg} alt="icon" />
                                  <h5 className={style.profileInnerTotalMatchesАverageListItemHeadTitle}>
                                    {t('profileStatMvpRate')}
                                  </h5>
                                </span>
                                <p className={style.profileInnerTotalMatchesАverageListItemHedSub}>
                                  {pct(stats.mvp_rate_pct)}
                                </p>
                              </div>
                              <div className={style.profileInnerTotalMatchesАverageListItemBack} style={{ '--valueMax': clampPercent(stats.mvp_rate_pct) }}>
                                <span></span>
                              </div>
                            </li>
                            <li className={style.profileInnerTotalMatchesАverageListItem}>
                              <div className={style.profileInnerTotalMatchesАverageListItemHed}>
                                <span className={style.profileInnerTotalMatchesАverageListItemHed}>

                                  <img src={iconInfo} className={style.profileInnerTotalMatchesАverageListItemHedImg} alt="icon" />
                                  <h5 className={style.profileInnerTotalMatchesАverageListItemHeadTitle}>
                                    {t('profileStatTeamfight')}
                                  </h5>
                                </span>
                                <p className={style.profileInnerTotalMatchesАverageListItemHedSub}>
                                  {pct(stats.teamfight_participation_rate)}
                                </p>
                              </div>
                              <div className={style.profileInnerTotalMatchesАverageListItemBack} style={{ '--valueMax': clampPercent(stats.teamfight_participation_rate) }}>
                                <span></span>
                              </div>
                            </li>
                          </ul>

                          {/* ДОСТИЖЕНИЯ */}
                          <div className={style.profileInnerTotalMatchesAchievement}>
                            <h5 className={style.profileInnerTotalMatchesAchievementTitle}>
                              {t('profileInnerTotalMatchesAchievementTitle')}
                            </h5>

                            <ul className={style.profileInnerTotalMatchesAchievementList}>
                              <li className={style.profileInnerTotalMatchesAchievementListItem}>
                                <div className={style.profileInnerTotalMatchesAchievementListItemHead}>
                                  <img src={iconInfo} alt="icon" className={style.profileInnerTotalMatchesAchievementListItemHeadImg} />
                                  <h6 className={style.profileInnerTotalMatchesAchievementListItemHeadTitle}>
                                    {t('profileInnerTotalMatchesAchievementListItemHeadTitleFirst')}
                                  </h6>
                                </div>
                                <p className={style.profileInnerTotalMatchesAchievementListItemSub}>
                                  x {orDash(stats.first_blood_count)}
                                </p>
                              </li>
                              <li className={style.profileInnerTotalMatchesAchievementListItem}>
                                <div className={style.profileInnerTotalMatchesAchievementListItemHead}>
                                  <img src={iconInfo} alt="icon" className={style.profileInnerTotalMatchesAchievementListItemHeadImg} />
                                  <h6 className={style.profileInnerTotalMatchesAchievementListItemHeadTitle}>
                                    {t('profileInnerTotalMatchesAchievementListItemHeadTitleDubl')}
                                  </h6>
                                </div>
                                <p className={style.profileInnerTotalMatchesAchievementListItemSub}>
                                  x {orDash(stats.double_kill_count)}
                                </p>
                              </li>
                              <li className={style.profileInnerTotalMatchesAchievementListItem}>
                                <div className={style.profileInnerTotalMatchesAchievementListItemHead}>
                                  <img src={iconInfo} alt="icon" className={style.profileInnerTotalMatchesAchievementListItemHeadImg} />
                                  <h6 className={style.profileInnerTotalMatchesAchievementListItemHeadTitle}>
                                    {t('profileInnerTotalMatchesAchievementListItemHeadTitleTriple')}
                                  </h6>
                                </div>
                                <p className={style.profileInnerTotalMatchesAchievementListItemSub}>
                                  x {orDash(stats.triple_kill_count)}
                                </p>
                              </li>
                              <li className={style.profileInnerTotalMatchesAchievementListItem}>
                                <div className={style.profileInnerTotalMatchesAchievementListItemHead}>
                                  <img src={iconInfo} alt="icon" className={style.profileInnerTotalMatchesAchievementListItemHeadImg} />
                                  <h6 className={style.profileInnerTotalMatchesAchievementListItemHeadTitle}>
                                    {t('profileInnerTotalMatchesAchievementListItemHeadTitleLegend')}
                                  </h6>
                                </div>
                                <p className={style.profileInnerTotalMatchesAchievementListItemSub}>
                                  x {orDash(stats.legendary_count)}
                                </p>
                              </li>
                              <li className={style.profileInnerTotalMatchesAchievementListItem}>
                                <div className={style.profileInnerTotalMatchesAchievementListItemHead}>
                                  <img src={iconInfo} alt="icon" className={style.profileInnerTotalMatchesAchievementListItemHeadImg} />
                                  <h6 className={style.profileInnerTotalMatchesAchievementListItemHeadTitle}>
                                    {t('profileInnerTotalMatchesAchievementListItemHeadTitleManiac')}
                                  </h6>
                                </div>
                                <p className={style.profileInnerTotalMatchesAchievementListItemSub}>
                                  x {orDash(stats.maniac_count)}
                                </p>
                              </li>
                              <li className={style.profileInnerTotalMatchesAchievementListItem}>
                                <div className={style.profileInnerTotalMatchesAchievementListItemHead}>
                                  <img src={iconInfo} alt="icon" className={style.profileInnerTotalMatchesAchievementListItemHeadImg} />
                                  <h6 className={style.profileInnerTotalMatchesAchievementListItemHeadTitle}>
                                    {t('profileInnerTotalMatchesAchievementListItemHeadTitleMVP')}
                                  </h6>
                                </div>
                                <p className={style.profileInnerTotalMatchesAchievementListItemSub}>
                                  x {orDash(stats.mvp_count)}
                                </p>
                              </li>
                              <li className={style.profileInnerTotalMatchesAchievementListItem}>
                                <div className={style.profileInnerTotalMatchesAchievementListItemHead}>
                                  <img src={iconInfo} alt="icon" className={style.profileInnerTotalMatchesAchievementListItemHeadImg} />
                                  <h6 className={style.profileInnerTotalMatchesAchievementListItemHeadTitle}>
                                    {t('profileStatSavage')}
                                  </h6>
                                </div>
                                <p className={style.profileInnerTotalMatchesAchievementListItemSub}>
                                  x {orDash(stats.savage_count)}
                                </p>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                </>}
              </div>

              {/*-------------------- ГЕРОИ И КОМАНДА -------------------- */}
              <div className={nav == 2 ? style.profileInnerHeaderInfo : style.profileInnerHeaderInfoDis}>
                {identity.mlbb_registered ? <HeroesAndSquad me={me} /> : <RegisterInBot url={me.register_in_bot_url} />}
              </div>

              {/* -------------------- МОИ ТУРНИРЫ -------------------- */}
              <div className={nav == 3 ? style.profileInnerHeaderInfo : style.profileInnerHeaderInfoDis}>
                <MyTournaments me={me} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </>
}

export default Profile;
