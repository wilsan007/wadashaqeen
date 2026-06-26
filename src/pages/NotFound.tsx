import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

const NotFound = () => {
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-4">
      <h1 className="text-6xl font-bold text-foreground">404</h1>
      <p className="text-xl text-muted-foreground">{t('notFound.subtitle')}</p>
      <a
        href="/"
        className="mt-4 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
      >
        {t('notFound.goHome')}
      </a>
    </div>
  );
};

export default NotFound;
