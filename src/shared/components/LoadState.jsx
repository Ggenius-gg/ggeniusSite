import ui from '../styles/site.module.css';
import { useLang } from '../i18n/hooks/useLang';

// Общие состояния «загрузка» и «ошибка» для страниц с данными API.
const LoadState = ({ loading, error }) => {
  const { t } = useLang();
  if (loading) return <p className={ui.muted}>{t('stateLoading')}</p>;
  if (!error) return null;
  if (error.status === 404) return <p className={ui.error}>{t('stateNotFound')}</p>;
  if (error.status === 0) return <p className={ui.error}>{t('stateNetwork')}</p>;
  return <p className={ui.error}>{t('stateServerError')}</p>;
};

export default LoadState;
