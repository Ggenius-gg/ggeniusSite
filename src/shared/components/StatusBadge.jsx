import ui from '../styles/site.module.css';
import { TOURNAMENT_STATUS } from '../utils/format';
import { useLang } from '../i18n/hooks/useLang';

const TONE_CLASS = { live: ui.badgeLive, open: ui.badgeOpen, done: ui.badgeDone };

const StatusBadge = ({ status }) => {
  const { t } = useLang();
  const known = TOURNAMENT_STATUS[status];
  const className = `${ui.badge} ${known ? TONE_CLASS[known.tone] : ''}`;
  return <span className={className}>{known ? t(known.key) : status}</span>;
};

export default StatusBadge;
