import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { BrandedLoadingScreen } from '@/components/layout/BrandedLoadingScreen';

/**
 * AuthCallback - Point d'entrée après authentification Magic Link
 *
 * GÈRE DEUX TYPES D'INVITATIONS :
 * 1. tenant_owner : Appelle onboard-tenant-owner (crée tenant)
 * 2. collaborator : Webhook automatique (tenant existe déjà)
 */

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Traitement de la confirmation...');
  const [invitationType, setInvitationType] = useState<string>('');

  // ============================================================================
  // FONCTION: Attendre création profil (COLLABORATEUR)
  // ============================================================================
  const waitForProfileCreation = async (userId: string, userType: string) => {

    let attempts = 0;
    const maxAttempts = 15; // 30 secondes max (15 x 2s)

    const checkProfile = async (): Promise<void> => {
      attempts++;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('tenant_id, full_name, role')
        .eq('user_id', userId)
        .single();

      if (profile?.tenant_id) {

        setStatus('✅ Configuration terminée ! Redirection...');

        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);

        return;
      }

      if (error) {
      }

      if (attempts >= maxAttempts) {
        console.error('');
        console.error('❌ ═══════════════════════════════════════════');
        console.error('❌ TIMEOUT : Profil non créé après 30s');
        console.error('❌ ═══════════════════════════════════════════');
        console.error('');

        setStatus('⚠️ Configuration incomplète. Veuillez réessayer.');

        setTimeout(() => {
          navigate('/');
        }, 3000);

        return;
      }

      // Continuer à vérifier
      setTimeout(() => checkProfile(), 2000);
    };

    await checkProfile();
  };

  // ============================================================================
  // FONCTION: Onboarding Tenant Owner (APPEL MANUEL)
  // ============================================================================
  const handleTenantOwnerOnboarding = async (session: any, email: string | null) => {
    try {

      // Récupérer l'invitation pour avoir le code
      const { data: invitation, error: invitationError } = await supabase
        .from('invitations')
        .select('id, tenant_name')
        .eq('email', email || session.user.email)
        .eq('invitation_type', 'tenant_owner')
        .eq('status', 'pending')
        .single();

      if (invitationError || !invitation) {
        console.error('❌ Invitation non trouvée:', invitationError?.message);
        throw new Error('Invitation non trouvée ou expirée');
      }


      // Appeler la fonction Edge Function
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/onboard-tenant-owner`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: invitation.id,
          }),
        }
      );

      if (!resp.ok) {
        const errorText = await resp.text();
        console.error('❌ Erreur Edge Function:', errorText);
        throw new Error(errorText);
      }

      const data = await resp.json();


      // 🔄 FORCE REFRESH SESSION to update claims/roles
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) console.warn('⚠️ Refresh session warning:', refreshError);

      setStatus('✅ Organisation créée ! Configuration du mot de passe...');

      setTimeout(() => {
        // Rediriger vers la définition du mot de passe car c'est un magic link sans password
        navigate('/update-password?welcome=true');
      }, 1500);
    } catch (error: any) {
      console.error('');
      console.error('❌ ═══════════════════════════════════════════');
      console.error('❌ ERREUR CRÉATION TENANT');
      console.error('❌ ═══════════════════════════════════════════');
      console.error('Message:', error.message);
      console.error('');

      setStatus('❌ Erreur lors de la création. Veuillez réessayer.');

      setTimeout(() => {
        navigate('/');
      }, 3000);
    }
  };

  // ============================================================================
  // FONCTION: Traiter session utilisateur (FLUX ANCIEN)
  // ============================================================================
  const processUserSession = async session => {

    if (session?.user) {
      setStatus('✅ Email confirmé ! Configuration en cours...');

      // Vérifier si le profil existe (webhook/trigger exécuté)
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, full_name')
        .eq('user_id', session.user.id)
        .single();

      if (profile?.tenant_id) {
        setStatus('Configuration terminée ! Redirection...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        setStatus('Configuration en cours, veuillez patienter...');

        // Attendre que le webhook/trigger s'exécute
        let attempts = 0;
        const checkProfile = setInterval(async () => {
          attempts++;

          const { data: newProfile } = await supabase
            .from('profiles')
            .select('tenant_id')
            .eq('user_id', session.user.id)
            .single();

          if (newProfile?.tenant_id || attempts >= 10) {
            clearInterval(checkProfile);

            if (newProfile?.tenant_id) {
              setStatus('Configuration terminée ! Redirection...');
              setTimeout(() => {
                navigate('/dashboard');
              }, 1000);
            } else {
              setStatus('Configuration incomplète, redirection connexion...');
              setTimeout(() => {
                navigate('/');
              }, 2000);
            }
          }
        }, 2000);
      }
    } else {
      setStatus('Session non trouvée, redirection vers connexion...');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    }
  };

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {

        // Vérifier les paramètres d'URL pour les erreurs
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));

        const email = urlParams.get('email');
        const type = urlParams.get('type');
        const invitation = urlParams.get('invitation'); // 'collaborator', 'tenant_owner', 'true'
        const error_code = hashParams.get('error_code');
        const error_description = hashParams.get('error_description');


        if (invitation) {
          setInvitationType(invitation);
        }

        // ============================================================================
        // GESTION RÉCUPÉRATION MOT DE PASSE
        // ============================================================================
        if (type === 'recovery') {
          setStatus('Vérification du lien de récupération...');

          // Établir la session avec les tokens de l'URL
          const access_token = hashParams.get('access_token');
          const refresh_token = hashParams.get('refresh_token');

          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });

            if (!error) {
              setStatus('Redirection vers la page de modification...');
              setTimeout(() => {
                navigate('/update-password');
              }, 1000);
              return;
            } else {
              console.error('❌ Erreur session récupération:', error);
              setStatus('Lien invalide ou expiré');
              setTimeout(() => navigate('/auth'), 3000);
              return;
            }
          }
        }

        // ============================================================================
        // GESTION INVITATIONS AVEC ROUTING INTELLIGENT
        // ============================================================================

        if (invitation && (type === 'magiclink' || type === 'invite')) {

          // Établir la session d'abord
          const access_token = hashParams.get('access_token');
          const refresh_token = hashParams.get('refresh_token');

          if (access_token && refresh_token) {

            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });

            if (sessionData?.session?.user) {
              const session = sessionData.session;

              // ========================================
              // ROUTER SELON LE TYPE D'INVITATION
              // ========================================

              if (invitation === 'collaborator') {

                setStatus('Bienvenue ! Configuration de votre compte collaborateur...');

                try {
                  // Appeler manuellement la fonction Edge

                  const resp = await fetch(
                    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-collaborator-confirmation`,
                    {
                      method: 'POST',
                      headers: {
                        Authorization: `Bearer ${session.access_token}`,
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        user_id: session.user.id,
                        email: session.user.email,
                      }),
                    }
                  );

                  if (!resp.ok) {
                    const errorText = await resp.text();
                    console.error('❌ Erreur Edge Function:', errorText);
                    throw new Error(errorText);
                  }

                  const data = await resp.json();


                  // 🔄 FORCE REFRESH SESSION
                  await supabase.auth.refreshSession();

                  setStatus('✅ Configuration terminée ! Redirection...');

                  setTimeout(() => {
                    navigate('/dashboard');
                  }, 1500);
                } catch (error: any) {
                  console.error('');
                  console.error('❌ ═══════════════════════════════════════════');
                  console.error('❌ ERREUR CRÉATION PROFIL COLLABORATEUR');
                  console.error('❌ ═══════════════════════════════════════════');
                  console.error('Message:', error.message);
                  console.error('');

                  setStatus('❌ Erreur lors de la configuration. Veuillez réessayer.');

                  setTimeout(() => {
                    navigate('/');
                  }, 3000);
                }

                return;
              } else if (invitation === 'tenant_owner') {

                setStatus('Création de votre organisation...');

                // ✅ APPELER LA FONCTION EDGE FUNCTION
                await handleTenantOwnerOnboarding(session, email);
                return;
              } else if (invitation === 'true') {

                // Vérifier le type d'invitation en base de données
                const { data: invitationRecord, error: invitationError } = await supabase
                  .from('invitations')
                  .select('invitation_type')
                  .eq('email', email || session.user.email)
                  .eq('status', 'pending')
                  .order('created_at', { ascending: false })
                  .limit(1)
                  .single();

                if (!invitationError && invitationRecord) {

                  if (invitationRecord.invitation_type === 'tenant_owner') {

                    setStatus('Création de votre organisation...');
                    await handleTenantOwnerOnboarding(session, email);
                    return;
                  } else if (invitationRecord.invitation_type === 'collaborator') {

                    setStatus('Bienvenue ! Configuration de votre compte collaborateur...');

                    try {
                      const resp = await fetch(
                        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-collaborator-confirmation`,
                        {
                          method: 'POST',
                          headers: {
                            Authorization: `Bearer ${session.access_token}`,
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            user_id: session.user.id,
                            email: session.user.email,
                          }),
                        }
                      );

                      if (!resp.ok) {
                        const errorText = await resp.text();
                        console.error('❌ Erreur Edge Function:', errorText);
                        throw new Error(errorText);
                      }

                      const data = await resp.json();
                      setStatus('✅ Configuration terminée ! Redirection...');

                      setTimeout(() => {
                        navigate('/dashboard');
                      }, 1500);

                      return;
                    } catch (error: any) {
                      console.error('❌ ERREUR CRÉATION PROFIL COLLABORATEUR:', error.message);
                      setStatus('❌ Erreur lors de la configuration. Veuillez réessayer.');
                      setTimeout(() => {
                        navigate('/');
                      }, 3000);
                      return;
                    }
                  }
                }

                setStatus('✅ Invitation traitée ! Configuration en cours...');
                await processUserSession(session);
                return;
              } else {
                console.warn('⚠️ Type invitation inconnu:', invitation);
                setStatus('Type invitation non reconnu...');
                await processUserSession(session);
                return;
              }
            } else {
            }
          }

          // Si erreur de confirmation mais c'est une invitation, rediriger vers connexion
          if (error_code === 'unexpected_failure') {
            if (error_description) {
              console.error('❌ Description erreur Supabase:', error_description);
            }
            setStatus('Lien invalide ou expiré. Redirection vers la connexion...');
            setTimeout(() => {
              // Rediriger vers /login pour que l'utilisateur puisse se connecter manuellement
              // avec le mot de passe temporaire reçu par email
              navigate(`/login?email=${encodeURIComponent(email || '')}&error=invitation_failed`);
            }, 2000);
            return;
          }
        }

        // Récupérer la session après confirmation (cas normal)
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error('❌ Erreur session:', error);
          setStatus('Erreur lors de la confirmation');
          return;
        }


        if (session?.user) {
          setStatus('✅ Email confirmé ! Configuration en cours...');

          // Vérifier si le profil existe (webhook/trigger exécuté)
          const { data: profile } = await supabase
            .from('profiles')
            .select('tenant_id, full_name')
            .eq('user_id', session.user.id)
            .single();

          if (profile?.tenant_id) {

            // Vérifier si c'est une nouvelle invitation qui nécessite un setup
            if (invitation === 'true') {
              setStatus('Configuration de votre compte...');
              setTimeout(() => {
                navigate(
                  `/setup-account?tenant_id=${profile.tenant_id}&email=${encodeURIComponent(session.user.email)}`
                );
              }, 1500);
            } else {
              setStatus('Configuration terminée ! Redirection...');
              setTimeout(() => {
                navigate('/dashboard');
              }, 1500);
            }
          } else {
            setStatus('Configuration en cours, veuillez patienter...');

            // Attendre que le webhook/trigger s'exécute
            let attempts = 0;
            const checkProfile = setInterval(async () => {
              attempts++;

              const { data: newProfile } = await supabase
                .from('profiles')
                .select('tenant_id')
                .eq('user_id', session.user.id)
                .single();

              if (newProfile?.tenant_id || attempts >= 10) {
                clearInterval(checkProfile);

                if (newProfile?.tenant_id) {
                  setStatus('Configuration de votre compte...');
                  setTimeout(() => {
                    if (invitation === 'true') {
                      navigate(
                        `/setup-account?tenant_id=${newProfile.tenant_id}&email=${encodeURIComponent(session.user.email)}`
                      );
                    } else {
                      navigate('/dashboard');
                    }
                  }, 1000);
                } else {
                  setStatus('Configuration incomplète, redirection connexion...');
                  setTimeout(() => {
                    navigate('/');
                  }, 2000);
                }
              }
            }, 2000);
          }
        } else {
          setStatus('Session non trouvée, redirection vers connexion...');
          setTimeout(() => {
            navigate('/');
          }, 2000);
        }
      } catch (err) {
        console.error('💥 Erreur callback:', err);
        setStatus('Erreur inattendue');
        setTimeout(() => {
          navigate('/');
        }, 3000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return <BrandedLoadingScreen appName="Wadashaqayn" logoSrc="/logo-w.svg" />;
}
