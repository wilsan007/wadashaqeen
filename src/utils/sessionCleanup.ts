/**
 * Utilitaires de nettoyage de session
 * Utilisé pour gérer les erreurs de refresh token et nettoyer le localStorage
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Nettoie complètement la session et le localStorage
 * Utilisé en cas d'erreur de refresh token ou de session corrompue
 */
export const cleanupSession = async (): Promise<void> => {

  try {
    // 1. Déconnecter de Supabase
    await supabase.auth.signOut();

    // 2. Nettoyer les clés spécifiques de l'application
    const keysToRemove = [
      'lastActivity',
      'manualLogout',
      'supabase.auth.token',
      'sb-qliinxtanjdnwxlvnxji-auth-token', // Format de clé Supabase
    ];

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });

    // 3. Nettoyer toutes les clés Supabase (au cas où)
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase')) {
        localStorage.removeItem(key);
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage de la session:', error);
    // En dernier recours, tout nettoyer
    localStorage.clear();
  }
};

/**
 * Vérifie si le refresh token est valide
 * Retourne true si valide, false sinon
 */
export const isRefreshTokenValid = async (): Promise<boolean> => {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error('❌ Erreur de validation du refresh token:', error.message);

      // Détecter les erreurs de refresh token
      if (
        error.message.includes('refresh') ||
        error.message.includes('Invalid') ||
        error.message.includes('Not Found')
      ) {
        return false;
      }
    }

    return !!session;
  } catch (error) {
    console.error('❌ Erreur lors de la vérification du refresh token:', error);
    return false;
  }
};

/**
 * Tente de récupérer la session, nettoie si invalide
 * Retourne la session si valide, null sinon
 */
export const getValidSession = async () => {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error('❌ Session invalide:', error.message);
      await cleanupSession();
      return null;
    }

    return session;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de la session:', error);
    await cleanupSession();
    return null;
  }
};

/**
 * Affiche les informations de debug sur la session
 */
export const debugSession = async (): Promise<void> => {
  console.group('🔍 Debug Session');

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

      'Expires At:',
      session?.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'N/A'
    );

    // Vérifier le localStorage
    Object.keys(localStorage).forEach(key => {
      if (
        key.includes('supabase') ||
        key.includes('auth') ||
        key === 'lastActivity' ||
        key === 'manualLogout'
      ) {
      }
    });
  } catch (error) {
    console.error('Erreur lors du debug:', error);
  }

  console.groupEnd();
};

// Exposer globalement pour debug dans la console
if (typeof window !== 'undefined') {
  (window as any).debugSession = debugSession;
  (window as any).cleanupSession = cleanupSession;
}
