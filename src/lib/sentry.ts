import * as Sentry from '@sentry/react';

/**
 * Initialise Sentry pour le monitoring des erreurs en production.
 * Le DSN est configuré via la variable VITE_SENTRY_DSN dans .env
 */
export function initSentry() {
    const dsn = import.meta.env.VITE_SENTRY_DSN;

    // Ne pas initialiser en développement ou si DSN non configuré
    if (!dsn || import.meta.env.DEV) return;

    Sentry.init({
        dsn,
        environment: import.meta.env.MODE ?? 'production',
        release: import.meta.env.VITE_APP_VERSION ?? '1.0.0',

        // Taux d'échantillonnage des traces de performance (10%)
        tracesSampleRate: 0.1,

        // Intégrations utiles pour React
        integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration({
                maskAllText: true,         // Masquer les données sensibles
                blockAllMedia: false,
                maskAllInputs: true,       // Masquer les champs de formulaire
            }),
        ],

        // Taux de replay : 5% en normal, 100% sur erreur
        replaysSessionSampleRate: 0.05,
        replaysOnErrorSampleRate: 1.0,

        // Ignorer les erreurs non-critiques connues
        ignoreErrors: [
            'ResizeObserver loop limit exceeded',
            'ResizeObserver loop completed with undelivered notifications',
            'Network request failed',
            'Failed to fetch',
            'Load failed',
        ],

        // Filtrer les events avant envoi
        beforeSend(event) {
            // Ne pas envoyer les erreurs de session expirée
            if (event.exception?.values?.[0]?.value?.includes('JWT expired')) {
                return null;
            }
            return event;
        },
    });
}

/**
 * Identifie l'utilisateur connecté dans Sentry
 */
export function setSentryUser(user: { id: string; email?: string; tenantId?: string } | null) {
    if (user) {
        Sentry.setUser({
            id: user.id,
            email: user.email,
            tenant: user.tenantId,
        });
    } else {
        Sentry.setUser(null);
    }
}

/**
 * Capture une exception manuellement avec contexte supplémentaire
 */
export function captureError(error: Error, context?: Record<string, unknown>) {
    Sentry.withScope((scope) => {
        if (context) {
            scope.setExtras(context);
        }
        Sentry.captureException(error);
    });
}

export { Sentry };
