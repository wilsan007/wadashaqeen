import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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

interface SignupForm {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  companyName: string;
}

export const TenantOwnerSignup: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState<SignupForm>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    companyName: '',
  });

  // Gestion des placeholders
  const { handleFocus, getPlaceholder } = useMultiplePlaceholderHandler({
    companyName: 'Mon Entreprise SARL',
    password: 'Minimum 8 caractères',
    confirmPassword: 'Répétez votre mot de passe',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [invitationData, setInvitationData] = useState<any>(null);
  const [validatingToken, setValidatingToken] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Valide et sanitise un token
   * @param token Token à valider
   * @returns Token validé ou null si invalide
   */
  const validateToken = (token: string | null): string | null => {
    if (!token) return null;

    // Vérifier format: UUID ou token alphanumérique
    const isValidFormat = /^[a-zA-Z0-9\-_]{10,100}$/.test(token);
    if (!isValidFormat) {
      console.error('⚠️ Format de token invalide');
      return null;
    }

    return token;
  };

  /**
   * Redirection sécurisée vers une URL interne
   * @param path Chemin relatif (commence par /)
   * @param params Paramètres query string validés
   */
  const secureRedirect = (path: string, params?: Record<string, string>) => {
    // Whitelist des chemins autorisés
    const allowedPaths = ['/tenant-login', '/dashboard', '/'];

    if (!allowedPaths.includes(path)) {
      console.error('⚠️ Chemin de redirection non autorisé:', path);
      return;
    }

    // Construire URL avec paramètres encodés
    const url = new URL(path, window.location.origin);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    window.location.href = url.toString();
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    const typeParam = urlParams.get('type');

    // Valider le token
    const validatedToken = validateToken(tokenParam);

    if (validatedToken) {
      setToken(validatedToken);

      // Valider le type (whitelist)
      const validTypes = ['signup', 'invitation'];
      const validatedType = typeParam && validTypes.includes(typeParam) ? typeParam : 'invitation';

      if (validatedType === 'signup') {
        // Token Supabase Auth - essayer d'abord la vérification Supabase
        verifySupabaseToken(validatedToken);
      } else {
        // Token d'invitation classique - validation directe
        validateInvitationToken(validatedToken);
      }
    } else {
      setError("Token d'invitation manquant ou invalide dans l'URL");
      setValidatingToken(false);
    }
  }, []);

  const verifySupabaseToken = async (token: string) => {
    try {

      // Rediriger de façon sécurisée vers la page de connexion avec le token
      secureRedirect('/tenant-login', { token, type: 'signup' });
    } catch (err) {
      console.error('❌ Erreur redirection:', err);
      setError('Erreur lors de la redirection');
      setValidatingToken(false);
    }
  };

  const validateInvitationToken = async (token: string) => {
    try {

      // Récupérer directement les données d'invitation (le token est stocké tel quel)
      const { data, error } = await supabase
        .from('invitations' as any)
        .select(
          'id, token, email, full_name, tenant_id, tenant_name, invitation_type, status, expires_at, created_at, accepted_at, metadata'
        )
        .eq('token', token)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .single();


      if (error) {
        console.error('❌ Erreur validation invitation:', error);
        throw new Error('Invitation non trouvée ou expirée');
      }

      const invitation = {
        id: (data as any).id,
        email: (data as any).email,
        fullName: (data as any).full_name,
        tenantId: (data as any).tenant_id,
        tenantName: (data as any).tenant_name || 'Nouvelle entreprise',
        invitationType: (data as any).invitation_type,
        expiresAt: (data as any).expires_at,
        tempPassword: (data as any).metadata?.temp_password,
      };

      setInvitationData(invitation);
      setForm(prev => ({
        ...prev,
        email: invitation.email,
        fullName: invitation.fullName,
      }));
    } catch (error) {
      console.error('❌ Erreur lors de la validation:', error);
      toast({
        title: '❌ Erreur',
        description: 'Erreur lors de la validation du token',
        variant: 'destructive',
      });
      navigate('/');
    } finally {
      setValidatingToken(false);
    }
  };

  const handleInputChange = (field: keyof SignupForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!form.email.trim()) {
      toast({
        title: 'Erreur',
        description: "L'email est requis",
        variant: 'destructive',
      });
      return false;
    }

    if (!form.fullName.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le nom complet est requis',
        variant: 'destructive',
      });
      return false;
    }

    if (!form.companyName.trim()) {
      toast({
        title: 'Erreur',
        description: "Le nom de l'entreprise est requis",
        variant: 'destructive',
      });
      return false;
    }

    if (form.password.length < 8) {
      toast({
        title: 'Erreur',
        description: 'Le mot de passe doit contenir au moins 8 caractères',
        variant: 'destructive',
      });
      return false;
    }

    if (form.password !== form.confirmPassword) {
      toast({
        title: 'Erreur',
        description: 'Les mots de passe ne correspondent pas',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleSignup = async () => {
    if (!validateForm() || !invitationData) return;

    setIsLoading(true);
    try {

      // Récupérer le mot de passe temporaire depuis les métadonnées
      let tempPassword = null;
      if ((invitationData as any).metadata) {
        if (typeof (invitationData as any).metadata === 'string') {
          try {
            const metadata = JSON.parse((invitationData as any).metadata);
            tempPassword = metadata.temp_password;
          } catch (e) {
            console.warn('Erreur parsing metadata:', e);
          }
        } else {
          tempPassword = (invitationData as any).metadata.temp_password;
        }
      }

      if (!tempPassword) {
        tempPassword = (invitationData as any).tempPassword;
      }

      if (!tempPassword) {
        throw new Error("Mot de passe temporaire non trouvé dans l'invitation");
      }


      // Vérifier d'abord l'état de l'utilisateur avant la connexion
      const { data: existingUser, error: userCheckError } = await supabase.auth.admin.getUserById(
        (invitationData as any).metadata?.supabase_user_id
      );

      if (userCheckError) {
        console.error('❌ Erreur vérification utilisateur:', userCheckError);
      } else {
      }

      // Étape 1: Se connecter avec le mot de passe temporaire pour confirmer l'email
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email.toLowerCase().trim(),
        password: tempPassword,
      });

      if (signInError) {
        console.error('❌ ERREUR DÉTAILLÉE DE CONNEXION:');
        console.error('   - Code:', signInError.status);
        console.error('   - Message:', signInError.message);
        console.error('   - Détails complets:', signInError);

        if (
          signInError.message.includes('Email not confirmed') ||
          signInError.message.includes('email_not_confirmed')
        ) {
          throw new Error(
            "Email non confirmé. L'utilisateur existe mais son email n'est pas confirmé. Veuillez confirmer l'email dans Supabase Dashboard."
          );
        }

        if (signInError.message.includes('Invalid login credentials')) {
          throw new Error(
            'Identifiants de connexion invalides. Le mot de passe temporaire ne correspond pas.'
          );
        }

        throw new Error('Erreur de connexion: ' + signInError.message);
      }


        '✅ ÉTAPE 1 terminée: Connexion temporaire réussie, email confirmé automatiquement'
      );

      // Étape 3: Le trigger auto_create_tenant_owner devrait s'être exécuté automatiquement
      // Attendre un peu pour laisser le trigger se terminer
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Étape 4: Vérifier que le tenant owner a été créé

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*, tenants:tenant_id(id, name)')
        .eq('user_id', signInData.user.id)
        .single();


      if (profile) {
      }

      if (profileError || !profile) {
        console.warn('⚠️ DIAGNOSTIC ÉCHEC CRÉATION TENANT OWNER:');
        console.warn("   - Le trigger auto_create_tenant_owner ne s'est pas exécuté");
        console.warn('   - Ou il y a eu une erreur dans le trigger');

        // Vérifier si l'utilisateur existe dans user_roles
        const { data: userRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('*, roles(name)')
          .eq('user_id', signInData.user.id);

          error: rolesError,
          count: userRoles?.length || 0,
          data: userRoles,
        });

        // Vérifier si un tenant a été créé
        const { data: recentTenants, error: tenantsError } = await supabase
          .from('tenants')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(3);

          error: tenantsError,
          count: recentTenants?.length || 0,
          data: recentTenants,
        });

        throw new Error(
          "Le tenant owner n'a pas été créé automatiquement. Vérifiez les logs du trigger dans Supabase."
        );
      }


      // Étape 5: Marquer l'invitation comme acceptée
      const { error: invitationUpdateError } = await supabase
        .from('invitations' as any)
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('token', token);

      if (invitationUpdateError) {
        console.warn('⚠️ Erreur mise à jour invitation:', invitationUpdateError);
      }


      // Maintenant proposer l'étape 2: Changement de mot de passe
      toast({
        title: '🎉 Compte créé avec succès !',
        description:
          'Votre tenant owner a été créé. Vous pouvez maintenant changer votre mot de passe.',
        variant: 'default',
      });

      // Étape 2: Proposer la mise à jour du mot de passe

      const shouldUpdatePassword = window.confirm(
        'Votre compte a été créé avec succès !\n\n' +
          'Souhaitez-vous changer votre mot de passe temporaire maintenant ?\n\n' +
          '• OUI: Vous pourrez définir un nouveau mot de passe\n' +
          '• NON: Vous serez redirigé vers le tableau de bord (vous pourrez changer le mot de passe plus tard)'
      );

      if (shouldUpdatePassword) {
        const { data: updateData, error: updateError } = await supabase.auth.updateUser({
          password: form.password,
          data: {
            full_name: form.fullName.trim(),
            company_name: form.companyName.trim(),
          },
        });

        if (updateError) {
          console.error('❌ Erreur mise à jour mot de passe:', updateError);
          toast({
            title: '⚠️ Erreur changement mot de passe',
            description:
              "Le mot de passe n'a pas pu être changé, mais votre compte est créé. Vous pourrez le changer plus tard.",
            variant: 'default',
          });
        } else {
          toast({
            title: '🔐 Mot de passe mis à jour !',
            description: 'Votre nouveau mot de passe a été enregistré avec succès.',
            variant: 'default',
          });
        }
      } else {
          "⏭️ ÉTAPE 2 ignorée: L'utilisateur a choisi de garder le mot de passe temporaire"
        );
      }

      // Redirection vers le dashboard après un court délai
      setTimeout(() => {
        secureRedirect('/dashboard');
      }, 2000);
    } catch (error: any) {
      console.error('❌ Erreur inscription:', error);
      toast({
        title: "❌ Erreur d'inscription",
        description: error.message || "Erreur lors de l'inscription",
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (validatingToken) {
    return <BrandedLoadingScreen appName="Wadashaqayn" logoSrc="/logo-w.svg" />;
  }

  if (!token || !invitationData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Alert className="max-w-md">
          <AlertDescription>Lien d'invitation invalide ou manquant.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-2 p-5 text-center sm:space-y-3 sm:p-6">
          <CardTitle className="flex items-center justify-center gap-2 text-xl font-bold sm:text-2xl">
            <Building className="h-6 w-6 shrink-0 sm:h-7 sm:w-7" />
            <span>Créer votre entreprise</span>
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Finalisez votre inscription sur Wadashaqayn
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 p-5 sm:space-y-5 sm:p-6">
          <Alert className="border-blue-200 bg-blue-50/50">
            <UserPlus className="h-4 w-4 shrink-0" />
            <AlertDescription className="text-xs break-words sm:text-sm">
              <strong>Invitation pour :</strong> {invitationData.full_name}
              <br />
              <strong>Email :</strong> {invitationData.email}
            </AlertDescription>
          </Alert>

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="email" className="text-sm font-medium sm:text-base">
              Email *
            </Label>
            <div className="relative">
              <Mail className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={e => handleInputChange('email', e.target.value)}
                disabled={true}
                className="bg-muted h-11 pl-10 text-base sm:h-10 sm:text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="fullName" className="text-sm font-medium sm:text-base">
              Nom complet *
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

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="companyName" className="text-sm font-medium sm:text-base">
              Nom de l'entreprise *
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

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="password" className="text-sm font-medium sm:text-base">
              Mot de passe *
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
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="sr-only">
                  {showPassword ? 'Masquer' : 'Afficher'} mot de passe
                </span>
              </Button>
            </div>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium sm:text-base">
              Confirmer le mot de passe *
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
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="sr-only">
                  {showConfirmPassword ? 'Masquer' : 'Afficher'} mot de passe
                </span>
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
                <span>Création en cours...</span>
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                <span>Enregistrer mon entreprise</span>
              </>
            )}
          </Button>

          <div className="text-muted-foreground pt-3 text-center text-xs sm:pt-2 sm:text-sm">
            <p>En créant votre compte, vous acceptez nos conditions d'utilisation</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TenantOwnerSignup;
