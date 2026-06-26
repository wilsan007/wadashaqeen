/**
 * Hook useStrictAuth - Authentification Stricte
 * - JWT 2h uniquement
 * - Pas de refresh automatique
 * - Déconnexion si session OS change
 */

import { useState, useEffect, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import {
  supabaseStrict,
  initializeSessionMarker,
  setupSessionMonitoring,
  invalidateSession,
  getStrictSession,
  signInStrict,
  isTokenExpired,
} from '@/lib/auth-config';

interface StrictAuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export function useStrictAuth() {
  const navigate = useNavigate();

  const [state, setState] = useState<StrictAuthState>({
    user: null,
    session: null,
    loading: true,
    isAuthenticated: false,
  });

  /**
   * Gère la déconnexion forcée
   */
  const handleSessionInvalid = useCallback(async () => {

    setState({
      user: null,
      session: null,
      loading: false,
      isAuthenticated: false,
    });

    // Rediriger vers la page de login
    navigate('/login', {
      replace: true,
      state: { reason: 'session_expired' },
    });
  }, [navigate]);

  /**
   * Initialisation de la session au montage
   */
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const initializeAuth = async () => {

      // Initialiser le marqueur de session
      const marker = initializeSessionMarker();

      // Vérifier s'il y a une session valide
      const session = await getStrictSession();

      if (session) {
        setState({
          user: session.user,
          session: session,
          loading: false,
          isAuthenticated: true,
        });
      } else {
        setState({
          user: null,
          session: null,
          loading: false,
          isAuthenticated: false,
        });
      }

      // Mettre en place la surveillance de session
      cleanup = setupSessionMonitoring(handleSessionInvalid);
    };

    initializeAuth();

    // Nettoyage au démontage
    return () => {
      if (cleanup) cleanup();
    };
  }, [handleSessionInvalid]);

  /**
   * Écouter les changements d'état d'authentification
   */
  useEffect(() => {
    const {
      data: { subscription },
    } = supabaseStrict.auth.onAuthStateChange(async (event, session) => {

      if (event === 'SIGNED_IN' && session) {
        setState({
          user: session.user,
          session: session,
          loading: false,
          isAuthenticated: true,
        });
      } else if (event === 'SIGNED_OUT') {
        await handleSessionInvalid();
      } else if (event === 'TOKEN_REFRESHED') {
        // BLOQUER le refresh automatique
        console.warn('⚠️ Tentative de refresh token détectée - ignorée');
        await invalidateSession();
        await handleSessionInvalid();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [handleSessionInvalid]);

  /**
   * Connexion avec email/password
   */
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      const { session, user } = await signInStrict(email, password);

      setState({
        user: user,
        session: session,
        loading: false,
        isAuthenticated: true,
      });

      return { success: true, user, session };
    } catch (error: any) {
      setState({
        user: null,
        session: null,
        loading: false,
        isAuthenticated: false,
      });

      return {
        success: false,
        error: error.message || 'Erreur de connexion',
      };
    }
  }, []);

  /**
   * 🔒 Déconnexion sécurisée avec nettoyage complet
   */
  const signOut = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }));

    await invalidateSession();

    setState({
      user: null,
      session: null,
      loading: false,
      isAuthenticated: false,
    });

    navigate('/login', { replace: true });
  }, [navigate]);

  /**
   * Récupère le temps restant avant expiration (en secondes)
   */
  const getTimeUntilExpiry = useCallback((): number | null => {
    if (!state.session?.expires_at) return null;

    const now = Math.floor(Date.now() / 1000);
    const remaining = state.session.expires_at - now;

    return remaining > 0 ? remaining : 0;
  }, [state.session]);

  /**
   * Formate le temps restant en format lisible
   */
  const getFormattedTimeRemaining = useCallback((): string | null => {
    const seconds = getTimeUntilExpiry();
    if (seconds === null) return null;

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  }, [getTimeUntilExpiry]);

  /**
   * Vérifie si le token va bientôt expirer (< 5 min)
   */
  const isExpiringSoon = useCallback((): boolean => {
    const seconds = getTimeUntilExpiry();
    if (seconds === null) return false;

    return seconds < 300; // 5 minutes
  }, [getTimeUntilExpiry]);

  return {
    // État
    user: state.user,
    session: state.session,
    loading: state.loading,
    isAuthenticated: state.isAuthenticated,

    // Actions
    signIn,
    signOut,

    // Utilitaires
    getTimeUntilExpiry,
    getFormattedTimeRemaining,
    isExpiringSoon,
  };
}
