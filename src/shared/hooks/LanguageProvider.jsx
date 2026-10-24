import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const LanguageProvider = () => {
  const { i18n } = useTranslation();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Папки переводов — ua и en; «uk» не существует (давало 404 на translate.json).
    let stored = null;
    try { stored = localStorage.getItem('value'); } catch { stored = null; }
    const lang = searchParams.get('lang') || stored || 'ua';
    i18n.changeLanguage(lang);
  }, []);

  return null;
};

export default LanguageProvider;
