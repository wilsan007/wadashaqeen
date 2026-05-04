import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { BrandedLoadingScreen } from '@/components/layout/BrandedLoadingScreen';

export default function UpdatePassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionChecking, setSessionChecking] = useState(true);

  // Vérifier si c'est une première configuration (paramètre welcome=true)
  const urlParams = new URLSearchParams(window.location.search);
  const isWelcome = urlParams.get('welcome') === 'true';

  // Vérifier si l'utilisateur est bien authentifié (via le lien de récupération)
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: 'Session expirée',
          description:
            'Le lien de réinitialisation est invalide ou a expiré. Veuillez refaire une demande.',
          variant: 'destructive',
        });
        navigate('/auth');
        return;
      }

      // Si c'est le mode welcome, récupérer le nom actuel du tenant
      if (isWelcome) {
        try {
          // Récupérer le profil pour avoir le tenant_id
          const { data: profile } = await supabase
            .from('profiles')
            .select('tenant_id')
            .eq('user_id', session.user.id)
            .single();

          if (profile?.tenant_id) {
            const { data: tenant } = await supabase
              .from('tenants')
              .select('name')
              .eq('id', profile.tenant_id)
              .single();

            if (tenant) {
              setCompanyName(tenant.name);
            }
          }
        } catch (err) {
          console.error('Erreur récupération nom entreprise:', err);
        }
      }

      setSessionChecking(false);
    };

    checkSession();
  }, [navigate, toast, isWelcome]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: 'Erreur',
        description: 'Les mots de passe ne correspondent pas.',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: 'Mot de passe trop court',
        description: 'Le mot de passe doit contenir au moins 8 caractères.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // 1. Mettre à jour le mot de passe
      const { error: pwdError } = await supabase.auth.updateUser({
        password: password,
      });

      if (pwdError) throw pwdError;

      // 2. Si mode welcome et nom d'entreprise modifié, mettre à jour le tenant
      if (isWelcome && companyName.trim()) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('tenant_id')
            .eq('user_id', user.id)
            .single();

          if (profile?.tenant_id) {
            const { error: tenantError } = await supabase
              .from('tenants')
              .update({ name: companyName.trim() })
              .eq('id', profile.tenant_id);

            if (tenantError) {
              console.error('Erreur mise à jour nom entreprise:', tenantError);
              toast({
                title: 'Attention',
                description:
                  "Mot de passe mis à jour, mais impossible de modifier le nom de l'entreprise.",
                variant: 'default', // Changed from 'warning' to 'default' as warning is not standard
                className: 'bg-yellow-500 text-white border-none', // Optional styling to mimic warning
              });
            }
          }
        }
      }

      toast({
        title: 'Succès',
        description: 'Votre compte a été configuré avec succès ! Redirection...',
      });

      // Redirection vers le dashboard après succès
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue lors de la mise à jour.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (sessionChecking) {
    return <BrandedLoadingScreen appName="Wadashaqayn" logoSrc="/logo-w.svg" />;
  }

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {isWelcome ? 'Bienvenue ! Finalisez votre compte' : 'Nouveau mot de passe'}
          </CardTitle>
          <CardDescription>
            {isWelcome
              ? 'Définissez vos accès et vérifiez les informations de votre entreprise.'
              : 'Veuillez choisir un nouveau mot de passe sécurisé pour votre compte.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            {isWelcome && (
              <div className="space-y-2">
                <Label htmlFor="companyName">Nom de l'entreprise</Label>
                <Input
                  id="companyName"
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="Votre entreprise"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Nouveau mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Minimum 8 caractères"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                placeholder="Répétez le mot de passe"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? 'Configuration en cours...'
                : isWelcome
                  ? "Terminer l'inscription"
                  : 'Mettre à jour le mot de passe'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
