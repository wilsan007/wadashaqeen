import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, UserPlus, Building, Mail, User, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMultiplePlaceholderHandler } from '@/hooks/usePlaceholderHandler';
import { BrandedLoadingScreen } from '@/components/layout/BrandedLoadingScreen';
import { useTranslation } from '@/hooks/useTranslation';

interface SignupForm {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  companyName: string;
}

interface InvitationData {
  id: string;
  email: string;
  fullName: string;
  tenantId: string;
  tenantName: string;
  invitationType: string;
  expiresAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function validateTokenFormat(raw: string | null): string | null {
  if (!raw) return null;
  return /^[a-zA-Z0-9\-_]{10,100}$/.test(raw) ? raw : null;
}

const ALLOWED_REDIRECT_PATHS = ['/dashboard', '/accueil', '/'];

function secureNavigate(navigate: ReturnType<typeof useNavigate>, path: string) {
  if (!ALLOWED_REDIRECT_PATHS.includes(path)) return;
  navigate(path, { replace: true });
}

// ─── Component ────────────────────────────────────────────────────────────────

export const TenantOwnerSignup: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [form, setForm] = useState<SignupForm>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    companyName: '',
  });

  const { handleFocus, getPlaceholder } = useMultiplePlaceholderHandler({
    companyName: t('authFlow.companyPlaceholder'),
    password: t('authFlow.passwordMinPlaceholder'),
    confirmPassword: t('authFlow.confirmPasswordPlaceholder'),
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);
  const [validatingToken, setValidatingToken] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const tokenParam = validateTokenFormat(new URLSearchParams(window.location.search).get('token'));

    if (!tokenParam) {
      setError(t('authFlow.invalidInvitation'));
      setValidatingToken(false);
      return;
    }

    setToken(tokenParam);

    const typeParam = new URLSearchParams(window.location.search).get('type');
    // 'signup' type means a Supabase magic link — redirect to the canonical callback
    if (typeParam === 'signup') {
      const dest = new URL('/auth/callback', window.location.origin);
      dest.searchParams.set('token', tokenParam);
      dest.searchParams.set('type', 'signup');
      window.location.href = dest.toString();
      return;
    }

    loadInvitation(tokenParam);

    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const loadInvitation = async (tkn: string) => {
    try {
      const { data, error: dbError } = await supabase
        .from('invitations' as any)
        .select('id, token, email, full_name, tenant_id, tenant_name, invitation_type, status, expires_at')
        .eq('token', tkn)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .single();

      if (dbError || !data) throw new Error('Invitation non trouvée ou expirée');

      const inv = data as any;

      setInvitationData({
        id: inv.id,
        email: inv.email,
        fullName: inv.full_name,
        tenantId: inv.tenant_id,
        tenantName: inv.tenant_name ?? 'Nouvelle entreprise',
        invitationType: inv.invitation_type,
        expiresAt: inv.expires_at,
      });

      setForm(prev => ({ ...prev, email: inv.email, fullName: inv.full_name }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setValidatingToken(false);
    }
  };

  const handleInputChange = (field: keyof SignupForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!form.email.trim()) {
      toast({ title: t('common.error'), description: t('authFlow.emailRequired'), variant: 'destructive' });
      return false;
    }
    if (!form.fullName.trim()) {
      toast({ title: t('common.error'), description: t('authFlow.nameRequired'), variant: 'destructive' });
      return false;
    }
    if (!form.companyName.trim()) {
      toast({ title: t('common.error'), description: t('authFlow.companyRequired'), variant: 'destructive' });
      return false;
    }
    if (form.password.length < 8) {
      toast({ title: t('common.error'), description: t('authFlow.pwMinChars'), variant: 'destructive' });
      return false;
    }
    if (form.password !== form.confirmPassword) {
      toast({ title: t('common.error'), description: t('authFlow.pwMismatch'), variant: 'destructive' });
      return false;
    }
    return true;
  };

  const handleSignup = async () => {
    if (!validateForm() || !invitationData) return;

    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    setIsLoading(true);
    try {
      // Step 1: The user must already be authenticated via the magic link email.
      // If no active session exists, direct them back to their email.
      const { data: { session: existingSession } } = await supabase.auth.getSession();

      if (!existingSession) {
        throw new Error(
          'Votre session est expirée. Veuillez cliquer sur le lien d\'activation reçu par email pour vous authentifier.'
        );
      }

      // Step 2: Set the user's chosen password and metadata
      const { error: updateError } = await supabase.auth.updateUser({
        password: form.password,
        data: {
          full_name: form.fullName.trim(),
          company_name: form.companyName.trim(),
        },
      });

      if (updateError) {
        console.warn('Password update failed (non-fatal):', updateError.message);
        toast({
          title: t('authFlow.pwChangeErrorTitle'),
          description: t('authFlow.pwChangeErrorDesc'),
          variant: 'default',
        });
      }

      // Step 3: Create tenant + profile atomically via onboard-tenant-owner Edge Function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const response = await fetch(`${supabaseUrl}/functions/v1/onboard-tenant-owner`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${existingSession.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: invitationData.id }),
        signal,
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => 'Erreur inconnue');
        throw new Error(`Erreur lors de la création du profil : ${errText}`);
      }

      toast({
        title: t('authFlow.successCreationTitle'),
        description: t('authFlow.successCreationDesc'),
        variant: 'default',
      });

      setTimeout(() => {
        if (!signal.aborted) secureNavigate(navigate, '/dashboard');
      }, 1500);
    } catch (err: any) {
      if (signal.aborted) return;
      toast({ title: t('authFlow.registrationError'), description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (validatingToken) {
    return <BrandedLoadingScreen appName="Wadashaqayn" logoSrc="/logo-w.svg" />;
  }

  if (error || !token || !invitationData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Alert className="max-w-md">
          <AlertDescription>{error ?? 'Lien d\'invitation invalide ou manquant.'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2 p-5 text-center sm:space-y-3 sm:p-6">
          <CardTitle className="flex items-center justify-center gap-2 text-xl font-bold sm:text-2xl">
            <Building className="h-6 w-6 shrink-0 sm:h-7 sm:w-7" />
            <span>{t('authFlow.signupCompanyTitle')}</span>
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            {t('authFlow.signupCompanySubtitle')}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 p-5 sm:space-y-5 sm:p-6">
          <Alert className="border-blue-200 bg-blue-50/50">
            <UserPlus className="h-4 w-4 shrink-0" />
            <AlertDescription className="break-words text-xs sm:text-sm">
              <strong>{t('authFlow.invitationFor')}</strong> {invitationData.fullName}
              <br />
              <strong>{t('common.email')} :</strong> {invitationData.email}
            </AlertDescription>
          </Alert>

          {/* Email (read-only) */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="email" className="text-sm font-medium sm:text-base">
              {t('common.email')} *
            </Label>
            <div className="relative">
              <Mail className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                id="email"
                type="email"
                value={form.email}
                disabled
                className="bg-muted h-11 pl-10 text-base sm:h-10 sm:text-sm"
              />
            </div>
          </div>

          {/* Full name */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="fullName" className="text-sm font-medium sm:text-base">
              {t('auth.fullName')} *
            </Label>
            <div className="relative">
              <User className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                id="fullName"
                type="text"
                value={form.fullName}
                onChange={e => handleInputChange('fullName', e.target.value)}
                disabled={isLoading}
                className="h-11 pl-10 text-base sm:h-10 sm:text-sm"
              />
            </div>
          </div>

          {/* Company name */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="companyName" className="text-sm font-medium sm:text-base">
              {t('authFlow.companyNameLabel')}
            </Label>
            <div className="relative">
              <Building className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                id="companyName"
                type="text"
                placeholder={getPlaceholder('companyName', form.companyName)}
                value={form.companyName}
                onChange={e => handleInputChange('companyName', e.target.value)}
                onFocus={() => handleFocus('companyName')}
                disabled={isLoading}
                className="h-11 pl-10 text-base sm:h-10 sm:text-sm"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="password" className="text-sm font-medium sm:text-base">
              {t('auth.password')} *
            </Label>
            <div className="relative">
              <Lock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={getPlaceholder('password', form.password)}
                value={form.password}
                onChange={e => handleInputChange('password', e.target.value)}
                onFocus={() => handleFocus('password')}
                disabled={isLoading}
                className="h-11 pr-12 pl-10 text-base sm:h-10 sm:pr-10 sm:text-sm"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute top-1/2 right-0 h-10 w-10 -translate-y-1/2 p-0 hover:bg-transparent sm:h-9 sm:w-9"
                onClick={() => setShowPassword(v => !v)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="sr-only">{showPassword ? 'Masquer' : 'Afficher'} mot de passe</span>
              </Button>
            </div>
          </div>

          {/* Confirm password */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium sm:text-base">
              {t('authFlow.confirmPasswordLabel')}
            </Label>
            <div className="relative">
              <Lock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder={getPlaceholder('confirmPassword', form.confirmPassword)}
                value={form.confirmPassword}
                onChange={e => handleInputChange('confirmPassword', e.target.value)}
                onFocus={() => handleFocus('confirmPassword')}
                disabled={isLoading}
                className="h-11 pr-12 pl-10 text-base sm:h-10 sm:pr-10 sm:text-sm"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute top-1/2 right-0 h-10 w-10 -translate-y-1/2 p-0 hover:bg-transparent sm:h-9 sm:w-9"
                onClick={() => setShowConfirmPassword(v => !v)}
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="sr-only">{showConfirmPassword ? 'Masquer' : 'Afficher'} confirmation</span>
              </Button>
            </div>
          </div>

          <Button
            onClick={handleSignup}
            disabled={isLoading}
            className="mt-2 h-11 w-full text-base font-semibold sm:mt-0 sm:h-10 sm:text-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>{t('authFlow.creatingCompany')}</span>
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                <span>{t('authFlow.registerCompany')}</span>
              </>
            )}
          </Button>

          <p className="text-muted-foreground pt-3 text-center text-xs sm:pt-2 sm:text-sm">
            {t('authFlow.termsAcceptance')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TenantOwnerSignup;
