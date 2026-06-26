import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AuthErrorAlert, useAuthErrors } from '@/components/ui/auth-error-alert';
import { useAuthErrorHandler } from '@/lib/authErrorHandler';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useMultiplePlaceholderHandler } from '@/hooks/usePlaceholderHandler';
import { useTranslation } from '@/hooks/useTranslation';

export const TenantOwnerLogin: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { errors, addError, removeError, clearErrors } = useAuthErrors();
  const { handleAuthError: handleLegacyAuthError, handleInvitationError } = useAuthErrorHandler();
  const { handleAuthError } = useErrorHandler({ showToast: false, persistErrors: false });

  const [form, setForm] = useState({ email: '', password: '' });

  // Gestion des placeholders (sécurisée - pas d'auto-complétion)
  const { handleFocus, getPlaceholder, forceHidePlaceholder } = useMultiplePlaceholderHandler({
    email: t('auth.email'),
    password: t('auth.password'),
  });

  // Forcer le masquage des placeholders si des valeurs sont détectées (sécurité)
  useEffect(() => {
    if (form.email) forceHidePlaceholder('email');
    if (form.password) forceHidePlaceholder('password');
  }, [form.email, form.password, forceHidePlaceholder]);
  const [isLoading, setIsLoading] = useState(false);
  const [invitationProcessing, setInvitationProcessing] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    const type = searchParams.get('type');
    const email = searchParams.get('email');

    if (token && type === 'signup') {
      setInvitationProcessing(true);
      clearErrors();

      console.log('[TenantOwnerLogin] Processing invitation token', {
        token: token.substring(0, 20) + '...',
        type,
        email,
      });

      supabase.auth
        .verifyOtp({ token_hash: token, type: 'signup' })
        .then(({ data, error }) => {
          if (error) {
            console.error('❌ Erreur vérification token:', error);
            const authError = handleInvitationError(error, { token, type, email });
            addError(authError);
          } else if (data.user?.email) {
            setForm(prev => ({ ...prev, email: data.user.email || '' }));
            toast({
              title: t('auth.emailConfirmed'),
              description: t('auth.emailConfirmedDesc'),
            });
          }
        })
        .catch(error => {
          console.error('💥 Erreur inattendue lors de la vérification:', error);
          const authError = handleAuthError(error);

          // Convertir AppError vers le format attendu par l'ancien système
          addError({
            title: authError.title,
            message: authError.userMessage,
            type: 'error',
          });
        })
        .finally(() => {
          setInvitationProcessing(false);
        });
    }
  }, [searchParams, handleAuthError, handleInvitationError, addError, clearErrors, toast]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    clearErrors();

    try {

      // Validation côté client
      if (!form.email || !form.password) {
        addError({
          title: t('auth.requiredFields'),
          message: t('auth.requiredFieldsDesc'),
          type: 'warning',
        });
        return;
      }

      // D'abord essayer de se connecter
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (error) {
        console.error('❌ Erreur de connexion:', error);

        // Utiliser le nouveau système d'erreurs moderne (Niveau Stripe/Notion)
        const authError = handleAuthError(error);

        // Convertir pour l'ancien système d'affichage (temporaire)
        addError({
          title: authError.title,
          message: authError.userMessage,
          type: 'error',
        });
        return;
      }

      if (data.user) {
        toast({
          title: t('auth.loginSuccess'),
          description: t('auth.loginSuccessDesc'),
        });
        navigate('/');
      }
    } catch (error: any) {
      console.error('💥 Erreur inattendue:', error);
      const authError = handleAuthError(error);

      // Convertir AppError vers le format attendu par l'ancien système
      addError({
        title: authError.title,
        message: authError.userMessage,
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md space-y-4">
        {/* Affichage des erreurs */}
        {errors.length > 0 && (
          <div className="space-y-3">
            {errors.map(error => (
              <AuthErrorAlert
                key={error.id}
                title={error.title}
                message={error.message}
                type={error.type}
                errorType={error.errorType}
                action={error.action}
                actionText={error.actionText}
                onDismiss={() => removeError(error.id)}
              />
            ))}
          </div>
        )}

        {/* Indicateur de traitement d'invitation */}
        {invitationProcessing && (
          <AuthErrorAlert
            title="🎫 Traitement de votre invitation..."
            message="Validation de votre lien d'invitation en cours. Veuillez patienter."
            type="info"
          />
        )}

        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              🏢 {t('auth.tenantLoginTitle')}
            </CardTitle>
            <p className="mt-2 text-gray-600">{t('auth.tenantLoginSubtitle')}</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
              <div>
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                  onFocus={() => handleFocus('email')}
                  onClick={() => handleFocus('email')}
                  placeholder={getPlaceholder('email', form.email)}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  required
                  disabled={isLoading || invitationProcessing}
                  className={errors.some(e => e.message.includes('email')) ? 'border-red-300' : ''}
                />
              </div>

              <div>
                <Label htmlFor="password">{t('auth.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
                  onFocus={() => handleFocus('password')}
                  onClick={() => handleFocus('password')}
                  placeholder={getPlaceholder('password', form.password)}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  required
                  disabled={isLoading || invitationProcessing}
                  className={
                    errors.some(e => e.message.includes('mot de passe')) ? 'border-red-300' : ''
                  }
                />
              </div>

              <Button type="submit" disabled={isLoading || invitationProcessing}>
                {isLoading
                  ? `🔄 ${t('auth.loggingIn')}`
                  : invitationProcessing
                    ? `⏳ ${t('common.processing')}`
                    : `🚀 ${t('auth.signIn')}`}
              </Button>

              {/* Useful links */}
              <div className="space-y-2 text-center text-sm text-gray-600">
                <p>
                  <button
                    type="button"
                    className="text-blue-600 hover:underline"
                    onClick={() => {
                      // Implémenter la réinitialisation de mot de passe
                    }}
                  >
                    {t('auth.forgotPassword')}
                  </button>
                </p>
                <p className="text-xs text-gray-500">
                  {t('auth.invitationIssue')}
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TenantOwnerLogin;
