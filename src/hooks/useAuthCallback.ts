import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const MAX_PROFILE_WAIT_MS = 30_000;
const PROFILE_POLL_INTERVAL_MS = 2_000;
const SESSION_WAIT_MS = 20_000;  // 20s — laisse le PKCE se terminer même sur réseau lent
const SESSION_POLL_INTERVAL_MS = 500; // polling intermédiaire si onAuthStateChange rate l'event

// ─── Utilities ────────────────────────────────────────────────────────────────

function abortableDelay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException('Aborted', 'AbortError'));
    const id = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => { clearTimeout(id); reject(new DOMException('Aborted', 'AbortError')); }, { once: true });
  });
}

async function waitForProfile(userId: string, signal: AbortSignal): Promise<boolean> {
  const deadline = Date.now() + MAX_PROFILE_WAIT_MS;

  while (Date.now() < deadline) {
    if (signal.aborted) return false;

    const { data } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('user_id', userId)
      .maybeSingle(); // ✅ évite HTTP 406 quand le profil n'existe pas encore

    if (data?.tenant_id) return true;

    await abortableDelay(PROFILE_POLL_INTERVAL_MS, signal);
  }

  return false;
}

// Waits for an active session, polling onAuthStateChange if getSession() returns null.
// detectSessionInUrl is disabled — this is the single source of truth for session establishment.
type Session = Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session'];

async function waitForSession(): Promise<Session> {
  // ── Étape 0a : tokens dans le hash (#access_token=...) — flux implicite ──
  // Quand Supabase génère un magiclink/invite sans PKCE côté serveur, les tokens
  // arrivent dans le fragment URL (#access_token=...&refresh_token=...).
  // Le client configuré flowType:'pkce' IGNORE ces hash tokens → session jamais
  // établie → timeout. On doit appeler setSession() manuellement.
  const hashParams = new URLSearchParams(window.location.hash.slice(1));
  const hashAccessToken = hashParams.get('access_token');
  const hashRefreshToken = hashParams.get('refresh_token');

  if (hashAccessToken && hashRefreshToken) {
    try {
      console.log('🔑 waitForSession: tokens détectés dans le hash — setSession()');
      const { data, error } = await supabase.auth.setSession({
        access_token: hashAccessToken,
        refresh_token: hashRefreshToken,
      });
      if (!error && data.session?.user) {
        // Nettoyer le hash de l'URL pour éviter un retraitement lors de refresh
        window.history.replaceState(
          null, '',
          window.location.pathname + window.location.search
        );
        console.log('✅ waitForSession: session établie via setSession (hash tokens)');
        return data.session;
      }
      if (error) console.warn('⚠️ setSession error:', error.message);
    } catch (e) {
      console.warn('⚠️ setSession exception:', e);
    }
  }

  // ── Étape 0b : échange PKCE explicite si un `code` est présent dans l'URL ──
  // Le SDK avec detectSessionInUrl=true fait cet échange automatiquement, mais
  // l'événement INITIAL_SESSION est émis UNE SEULE FOIS au démarrage. Si
  // waitForSession() est appelée après cet event, onAuthStateChange ne le recevra
  // jamais → timeout. On force l'échange ici pour être sûr.
  const urlCode = new URLSearchParams(window.location.search).get('code');
  if (urlCode) {
    try {
      const { data: exchanged } = await supabase.auth.exchangeCodeForSession(urlCode);
      if (exchanged?.session?.user) {
        console.log('✅ waitForSession: session établie via exchangeCodeForSession (PKCE)');
        return exchanged.session;
      }
    } catch (e) {
      // Ignoré — le SDK peut déjà avoir échangé le code (erreur "code already used")
      // On continue avec le polling onAuthStateChange + getSession
      console.warn('⚠️ exchangeCodeForSession (peut être ignoré si déjà échangé):', e);
    }
  }

  return new Promise((resolve, reject) => {
    let resolved = false;
    let pollInterval: ReturnType<typeof setInterval>;

    const finish = (session: Session, source: string) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeout);
      clearInterval(pollInterval);
      subscription.unsubscribe();
      console.log(`✅ waitForSession: session résolue via [${source}]`);
      resolve(session);
    };

    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        clearInterval(pollInterval);
        subscription.unsubscribe();
        reject(new Error('Session timeout — lien expiré ou déjà utilisé'));
      }
    }, SESSION_WAIT_MS);

    // 1. S'abonner d'abord pour ne pas manquer l'événement si l'échange de code
    // est déjà en cours en arrière-plan.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') && s?.user) {
        finish(s, `onAuthStateChange:${event}`);
      }
    });

    // 2. Vérifier getSession() APRES avoir souscrit (session peut déjà exister)
    supabase.auth.getSession().then(({ data: immediate }) => {
      if (immediate.session?.user) {
        finish(immediate.session, 'getSession-immediate');
      }
    });

    // 3. Polling de secours toutes les 500ms — couvre le cas où l'event
    // INITIAL_SESSION a déjà été émis avant l'abonnement ci-dessus.
    pollInterval = setInterval(async () => {
      if (resolved) { clearInterval(pollInterval); return; }
      const { data: polled } = await supabase.auth.getSession();
      if (polled.session?.user) {
        finish(polled.session, 'getSession-poll');
      }
    }, SESSION_POLL_INTERVAL_MS);
  });
}

async function callEdgeFunction(
  path: string,
  accessToken: string,
  body: Record<string, unknown>
): Promise<void> {
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => resp.statusText);
    throw new Error(`[${path}] ${resp.status}: ${text}`);
  }
}

async function lookupInvitationType(email: string): Promise<string | null> {
  const { data } = await supabase
    .from('invitations')
    .select('invitation_type')
    .eq('email', email)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return data?.invitation_type ?? null;
}

// ─── Handlers per invitation type ────────────────────────────────────────────

async function handleTenantOwner(
  session: { access_token: string; user: { id: string; email?: string } },
  emailHint: string | null
): Promise<string> {
  const email = emailHint ?? session.user.email ?? '';

  const { data: invitation, error } = await supabase
    .from('invitations')
    .select('id')
    .eq('email', email)
    .eq('invitation_type', 'tenant_owner')
    .eq('status', 'pending')
    .single();

  if (error || !invitation) {
    throw new Error('Invitation tenant owner introuvable ou expirée');
  }

  await callEdgeFunction('onboard-tenant-owner', session.access_token, { code: invitation.id });
  await supabase.auth.refreshSession();

  return '/update-password?welcome=true';
}

async function handleCollaborator(
  session: { access_token: string; user: { id: string; email?: string } },
  signal: AbortSignal
): Promise<string> {
  // Calls the unified handle-email-confirmation which handles both
  // DB webhook (Mode B) and direct frontend calls (Mode A)
  await callEdgeFunction('handle-email-confirmation', session.access_token, {
    user_id: session.user.id,
    email: session.user.email,
  });

  await supabase.auth.refreshSession();

  // Wait until the profile is visible (edge fn is async — profile may lag slightly)
  const created = await waitForProfile(session.user.id, signal);
  if (!created && !signal.aborted) {
    console.warn('⚠️ Profile not found after wait — redirecting anyway');
  }

  return '/accueil'; // Redirection directe vers le tableau de bord (accueil) de l'application
}

// ─── Main resolver ────────────────────────────────────────────────────────────

async function resolveCallback(signal: AbortSignal): Promise<string> {
  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.slice(1));

  const emailHint = searchParams.get('email');
  const type = searchParams.get('type');
  const invitation = searchParams.get('invitation');
  const errorCode = hashParams.get('error_code');

  // ── Password recovery ──────────────────────────────────────────────────────
  if (type === 'recovery') {
    await waitForSession();
    return '/update-password';
  }

  // ── Invitation magic link ──────────────────────────────────────────────────
  if (invitation && (type === 'magiclink' || type === 'invite')) {
    // Error returned by Supabase (e.g. expired OTP, invalid token)
    if (errorCode === 'unexpected_failure' || errorCode) {
      const redirect = emailHint ? `/auth?email=${encodeURIComponent(emailHint)}&error=invitation_failed` : '/auth';
      return redirect;
    }

    let session: Session;
    try {
      session = await waitForSession();
    } catch (err) {
      throw new Error('Impossible d\'établir la session utilisateur (délai dépassé)');
    }

    if (!session || !session.user) {
      throw new Error('Session invalide');
    }

    if (signal.aborted) return '/';

    if (invitation === 'tenant_owner') return handleTenantOwner(session!, emailHint);
    if (invitation === 'collaborator') return handleCollaborator(session!, signal);

    // Legacy: invitation=true — look up type in DB
    if (invitation === 'true') {
      const invType = await lookupInvitationType(emailHint ?? session!.user.email ?? '');
      if (invType === 'tenant_owner') return handleTenantOwner(session!, emailHint);
      if (invType === 'collaborator') return handleCollaborator(session!, signal);
    }

    // Unknown invitation type — fall through to standard profile check
    const profileFound = await waitForProfile(session!.user.id, signal);
    return profileFound ? '/dashboard' : '/';
  }

  // ── Standard session (e.g. email/password login or Google OAuth without invitation) ──
  // Try to wait for the session if a PKCE code is present in the URL
  const stdCode = searchParams.get('code');
  if (stdCode) {
    try {
      const session = await waitForSession();
      if (session?.user) {
        const profileFound = await waitForProfile(session.user.id, signal);
        return profileFound ? '/accueil' : '/auth?error=no_account';
      }
    } catch (e) {
      // Ignore and fallback to getSession
    }
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return '/';

  const profileFound = await waitForProfile(session.user.id, signal);
  return profileFound ? '/accueil' : '/auth?error=no_account';
}

// ─── Routes nécessitant le router authentifié ─────────────────────────────────
// Ces routes n'existent que dans le router avec session (MemoizedRoutes).
// Un navigate() depuis le no-session BrowserRouter ne les atteindrait pas —
// il faudrait un rechargement complet pour que App.tsx remonte avec le bon router.
const AUTHENTICATED_ROUTES = ['/accueil', '/dashboard', '/hr', '/projects', '/tasks'];

function needsFullReload(destination: string): boolean {
  return AUTHENTICATED_ROUTES.some(r => destination.startsWith(r));
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuthCallback() {
  const navigate = useNavigate();

  const run = useCallback(
    (signal: AbortSignal) => {
      resolveCallback(signal)
        .then(destination => {
          if (signal.aborted) return;

          if (needsFullReload(destination)) {
            // Rechargement complet : App.tsx se remonte avec le router authentifié
            // qui contient /accueil, /dashboard, etc.
            console.log(`🔄 AuthCallback: rechargement complet vers ${destination}`);
            window.location.replace(destination);
          } else {
            // Routes disponibles dans le no-session router (/update-password, /auth, /)
            navigate(destination, { replace: true });
          }
        })
        .catch(err => {
          if (signal.aborted || err.name === 'AbortError') return;
          console.error('AuthCallback error:', err.message);
          if (!signal.aborted) navigate('/', { replace: true });
        });
    },
    [navigate]
  );

  return { run };
}
