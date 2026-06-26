import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, AlertCircle, Eye, EyeOff, Lock } from 'lucide-react';
import { BrandedLoadingScreen } from '@/components/layout/BrandedLoadingScreen';

interface InvitationData {
  id: string;
  email: string;
  full_name: string;
  tenant_id: string;
  tenant_name: string;
  invitation_type: string;
  status: string;
  expires_at: string;
}

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Token d'invitation manquant");
      setLoading(false);
      return;
    }

    const fetchInvitation = async () => {
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/accept-invitation?token=${encodeURIComponent(token)}`;
        const resp = await fetch(url, {
          headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        });

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({ error: resp.statusText }));
          throw new Error(err.error ?? 'Invitation invalide');
        }

        setInvitation(await resp.json());
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [token]);

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation || password.length < 8) return;

    setIsSubmitting(true);
    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: invitation.email,
        password,
        options: {
          data: {
            invitation_type: invitation.invitation_type,
            invitation_id: invitation.id,
            tenant_id: invitation.tenant_id,
            full_name: invitation.full_name,
            company_name: invitation.tenant_name,
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          toast({
            title: 'Compte existant',
            description: 'Cet email est déjà enregistré. Connectez-vous.',
            variant: 'destructive',
          });
          navigate(`/login?email=${encodeURIComponent(invitation.email)}`);
          return;
        }
        throw signUpError;
      }

      if (!authData.user) throw new Error('Erreur lors de la création du compte');

      if (authData.session) {
        // Email confirmation disabled — accept immediately
        const { error: acceptError } = await supabase.functions.invoke('accept-invitation', {
          method: 'POST',
          body: { token },
        });
        if (acceptError) throw acceptError;

        toast({ title: 'Bienvenue !', description: 'Compte créé et invitation acceptée.' });
        navigate('/accueil');
      } else {
        // Email confirmation required — the handle-email-confirmation webhook will link the invitation
        toast({
          title: 'Vérifiez votre boîte mail',
          description: 'Un lien de confirmation vous a été envoyé pour activer votre compte.',
        });
        navigate('/login');
      }
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <BrandedLoadingScreen appName="Wadashaqayn" logoSrc="/logo-w.svg" />;
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-center text-red-600">Invitation invalide</CardTitle>
            <CardDescription className="text-center">{error}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button variant="outline" onClick={() => navigate('/')}>
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 p-5 text-center sm:p-6">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Bienvenue !</CardTitle>
          <CardDescription className="text-base">
            Vous avez été invité à rejoindre <strong>{invitation?.tenant_name}</strong>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 p-5 sm:p-6">
          <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 text-sm text-blue-900">
            <p className="font-medium">Bonjour {invitation?.full_name},</p>
            <p className="mt-1">
              Choisissez votre mot de passe pour activer votre compte{' '}
              <strong>{invitation?.email}</strong>.
            </p>
          </div>

          <form onSubmit={handleAccept} className="space-y-4">
            {/* Email — read-only */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={invitation?.email ?? ''}
                disabled
                className="bg-muted"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password">Mot de passe *</Label>
              <div className="relative">
                <Lock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="8 caractères minimum"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={isSubmitting}
                  className="h-11 pr-12 pl-10 text-base sm:h-10 sm:text-sm"
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
              {password.length > 0 && password.length < 8 && (
                <p className="text-destructive text-xs">Minimum 8 caractères</p>
              )}
            </div>

            <Button
              className="h-11 w-full text-base font-semibold sm:h-10 sm:text-sm"
              type="submit"
              disabled={isSubmitting || password.length < 8}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création du compte…
                </>
              ) : (
                'Activer mon compte'
              )}
            </Button>
          </form>

          <p className="text-muted-foreground text-center text-sm">
            Vous avez déjà un compte ?{' '}
            <Button variant="link" className="h-auto p-0 text-sm" onClick={() => navigate('/login')}>
              Connectez-vous
            </Button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
