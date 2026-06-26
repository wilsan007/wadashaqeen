/**
 * Hook personnalisé pour forcer le mode paysage sur mobile/tablette
 * Utilisé pour les vues complexes (Table, Gantt, Kanban)
 * Pattern: Notion/Monday.com/Linear pour les vues larges
 */

import { useState, useEffect } from 'react';

interface UseForceLandscapeReturn {
  isLandscape: boolean;
  isMobileOrTablet: boolean;
  shouldShowRotateMessage: boolean;
  deviceType: 'mobile' | 'tablet' | 'desktop';
}

export const useForceLandscape = (): UseForceLandscapeReturn => {
  const [isLandscape, setIsLandscape] = useState(false);
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const checkOrientation = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Détection du type d'appareil
      if (width < 640) {
        setDeviceType('mobile');
        setIsMobileOrTablet(true);
      } else if (width < 1024) {
        setDeviceType('tablet');
        setIsMobileOrTablet(true);
      } else {
        setDeviceType('desktop');
        setIsMobileOrTablet(false);
      }

      // Détection de l'orientation
      const landscape = width > height;
      setIsLandscape(landscape);

      // Log pour debug (en dev uniquement)
      if (process.env.NODE_ENV === 'development') {
        console.log({
          width,
          height,
          landscape,
          deviceType: width < 640 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop',
        });
      }
    };

    // Vérification initiale
    checkOrientation();

    // Écouter les changements d'orientation
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    // Cleanup
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  // Message de rotation nécessaire si:
  // - Mobile ou tablette
  // - ET en mode portrait
  const shouldShowRotateMessage = isMobileOrTablet && !isLandscape;

  return {
    isLandscape,
    isMobileOrTablet,
    shouldShowRotateMessage,
    deviceType,
  };
};
