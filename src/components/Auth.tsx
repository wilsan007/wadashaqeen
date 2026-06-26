import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useMultiplePlaceholderHandler } from '@/hooks/usePlaceholderHandler';
import { SocialAuth } from '@/components/auth/SocialAuth';
import type { User, Session } from '@supabase/supabase-js';
import { useTranslation } from '@/hooks/useTranslation';

interface AuthProps {
  onAuthStateChange: (user: User | null, session: Session | null) => void;
}

export const Auth = ({ onAuthStateChange }: AuthProps) => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(''); // Ajout du state pour le nom complet
  const [showMFAInput, setShowMFAInput] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const { t } = useTranslation();

  // Gestion des placeholders (sécurisée - pas d'auto-complétion)
  const { handleFocus, getPlaceholder, forceHidePlaceholder } = useMultiplePlaceholderHandler({
    email: t('authFlow.emailPlaceholder'),
    password: t('authFlow.passwordPlaceholder'),
    fullName: t('authFlow.fullNamePlaceholder'),
  });

  // Forcer le masquage des placeholders si des valeurs sont détectées (sécurité)
  useEffect(() => {
    if (email) forceHidePlaceholder('email');
    if (password) forceHidePlaceholder('password');
    if (fullName) forceHidePlaceholder('fullName');
  }, [email, password, fullName, forceHidePlaceholder]);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const { toast } = useToast();

  // Gérer les erreurs d'URL (ex: retour de callback échoué)
  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'invitation_failed') {
      toast({
        title: t('authFlow.invitationLabel'),
        description: t('authFlow.invitationDesc'),
        variant: 'destructive',
      });
    }
  }, [searchParams, toast]);

  // Pas besoin d'écouter les changements ici, c'est géré par useSessionManager
  // Le composant Auth se contente d'afficher le formulaire de connexion

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Vérifier si MFA est requis
    if (error?.message?.includes('MFA') || error?.message?.includes('verification required')) {
      setShowMFAInput(true);
      return { error: null }; // Ne pas afficher d'erreur, juste montrer l'input MFA
    }

    return { error };
  };

  const verifyMFA = async () => {
    if (!mfaCode || mfaCode.length !== 6) {
      return { error: new Error(t('authFlow.mfaCodeRequired')) };
    }

    // Utiliser la méthode mfa.challenge pour les codes TOTP
    const factors = await supabase.auth.mfa.listFactors();
    if (factors.data?.totp && factors.data.totp.length > 0) {
      const factorId = factors.data.totp[0].id;
      const { data, error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: mfaCode,
      });
      return { data, error };
    }

    return { error: new Error(t('authFlow.noMfaFactor')) };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    // Inscription standard avec Supabase Auth
    // La création du tenant se fait désormais via le flux d'invitation sécurisé (Edge Function)
    // ou via un processus d'onboarding séparé après l'inscription.

    const redirectUrl = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });

    return { error };
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/auth/callback?type=recovery`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    return { error };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let error;

      if (isForgotPassword) {
        const result = await resetPassword(email);
        error = result.error;
      } else if (isSignUp) {
        const result = await signUp(email, password, fullName);
        error = result.error;
      } else {
        const result = await signIn(email, password);
        error = result.error;
      }

      if (error) {
        // Gestion d'erreurs moderne pour l'authentification
        let errorTitle = t('authFlow.errTitle');
        let errorMessage = error.message || "Une erreur s'est produite.";

        // Email déjà utilisé
        if (
          error.message?.toLowerCase().includes('email') &&
          (error.message?.toLowerCase().includes('already') ||
            error.message?.toLowerCase().includes('exists') ||
            error.message?.toLowerCase().includes('taken'))
        ) {
          errorTitle = t('authFlow.emailUsedTitle');
          errorMessage = t('authFlow.emailUsedDesc');
        }

        // Identifiants invalides
        else if (
          error.message?.toLowerCase().includes('invalid') ||
          error.message?.toLowerCase().includes('credentials')
        ) {
          errorTitle = t('authFlow.invalidCredsTitle');
          errorMessage = t('authFlow.invalidCredsDesc');
        }

        // Mot de passe faible
        else if (
          error.message?.toLowerCase().includes('password') &&
          (error.message?.toLowerCase().includes('weak') ||
            error.message?.toLowerCase().includes('strength'))
        ) {
          errorTitle = t('authFlow.weakPasswordTitle');
          errorMessage = t('authFlow.weakPasswordDesc');
        }

        toast({
          title: errorTitle,
          description: errorMessage,
          variant: 'destructive',
        });
      } else if (isForgotPassword) {
        toast({
          title: t('authFlow.emailSentTitle'),
          description: t('authFlow.emailSentDesc'),
        });
        setIsForgotPassword(false);
      } else if (isSignUp) {
        toast({
          title: t('authFlow.signupSuccessTitle'),
          description: t('authFlow.signupSuccessDesc'),
        });
      } else if (!showMFAInput) {
        toast({
          title: t('authFlow.loginSuccessTitle'),
          description: t('authFlow.loginSuccessDesc'),
        });
      }
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMFAVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await verifyMFA();

      if (error) {
        toast({
          title: t('authFlow.mfaCodeFailTitle'),
          description: t('authFlow.mfaCodeFailDesc'),
          variant: 'destructive',
        });
      } else {
        toast({
          title: '✅ Connexion réussie',
          description: 'Authentification à deux facteurs validée',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4"
      style={{
        background: `
          radial-gradient(ellipse 80% 50% at 20% -10%, hsl(var(--primary) / 0.1) 0%, transparent 55%),
          radial-gradient(ellipse 60% 40% at 80% 110%, hsl(280 70% 60% / 0.07) 0%, transparent 55%),
          var(--gradient-bg)
        `,
      }}
    >
      {/* Logo + nom de l'app */}
      <div className="mb-8 flex flex-col items-center gap-4">
        <img src="/logo-w.svg" alt="Wadashaqayn" className="h-16 w-16 drop-shadow-lg" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        <span className="text-2xl font-bold tracking-tight text-foreground">Wadashaqayn</span>
      </div>

      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">
            {isForgotPassword ? t('authFlow.forgotPasswordLabel') : isSignUp ? t('authFlow.createAccountLabel') : t('auth.login')}
          </CardTitle>
          <CardDescription>
            {isForgotPassword
              ? t('authFlow.forgotPasswordHint')
              : isSignUp
                ? t('authFlow.createAccountHint')
                : t('authFlow.loginHint')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* OAuth Google activé ✅ */}
          {!showMFAInput && !isSignUp && !isForgotPassword && <SocialAuth />}

          {showMFAInput ? (
            <form onSubmit={handleMFAVerification} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mfaCode">{t('authFlow.mfaLabel')}</Label>
                <Input
                  id="mfaCode"
                  type="text"
                  value={mfaCode}
                  onChange={e => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setMfaCode(value);
                  }}
                  placeholder="000000"
                  maxLength={6}
                  className="text-center font-mono text-2xl tracking-widest"
                  autoComplete="off"
                  required
                />
                <p className="text-muted-foreground text-center text-sm">
                  {t('authFlow.mfaHint')}
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={loading || mfaCode.length !== 6}>
                {loading ? t('authFlow.verifying') : t('authFlow.verify')}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setShowMFAInput(false);
                  setMfaCode('');
                }}
              >
                {t('authFlow.back')}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">{t('auth.fullName')}</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    onFocus={() => handleFocus('fullName')}
                    onClick={() => handleFocus('fullName')}
                    placeholder={getPlaceholder('fullName', fullName)}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    required
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => handleFocus('email')}
                  onClick={() => handleFocus('email')}
                  placeholder={getPlaceholder('email', email)}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  required
                />
              </div>
              {!isForgotPassword && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">{t('auth.password')}</Label>
                    {!isSignUp && (
                      <Button
                        variant="link"
                        className="h-auto p-0 text-xs"
                        onClick={() => setIsForgotPassword(true)}
                        type="button"
                      >
                        {t('authFlow.passwordForgotten')}
                      </Button>
                    )}
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => handleFocus('password')}
                    onClick={() => handleFocus('password')}
                    placeholder={getPlaceholder('password', password)}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    required
                  />
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? t('authFlow.loading')
                  : isForgotPassword
                    ? t('authFlow.sendLink')
                    : isSignUp
                      ? t('authFlow.createAccountLabel')
                      : t('auth.login')}
              </Button>
              <div className="mt-4 text-center">
                <Button
                  variant="link"
                  type="button"
                  onClick={() => {
                    if (isForgotPassword) {
                      setIsForgotPassword(false);
                    } else {
                      setIsSignUp(!isSignUp);
                    }
                  }}
                  className="text-sm"
                >
                  {isForgotPassword
                    ? t('authFlow.backToLogin')
                    : isSignUp
                      ? t('authFlow.alreadyHaveAccount')
                      : t('authFlow.createAdminAccount')}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Liens légaux */}
      <p className="mt-6 text-center text-xs text-muted-foreground">
        <Link to="/privacy" className="underline underline-offset-2 hover:text-foreground transition-colors">
          {t('authFlow.privacyPolicy')}
        </Link>
        {' · '}
        <Link to="/terms" className="underline underline-offset-2 hover:text-foreground transition-colors">
          {t('authFlow.cgu')}
        </Link>
      </p>
    </div>
  );
};
