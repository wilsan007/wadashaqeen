import { useEffect } from 'react';
import { useAuthCallback } from '@/hooks/useAuthCallback';
import { BrandedLoadingScreen } from '@/components/layout/BrandedLoadingScreen';

export default function AuthCallback() {
  const { run } = useAuthCallback();

  useEffect(() => {
    const controller = new AbortController();
    run(controller.signal);
    return () => controller.abort();
  }, [run]);

  return <BrandedLoadingScreen appName="Wadashaqayn" logoSrc="/logo-w.svg" />;
}
