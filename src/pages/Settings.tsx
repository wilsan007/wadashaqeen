import { useState, useRef } from 'react';
import { SecuritySettings } from '@/components/settings/SecuritySettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Shield, User, Bell, Key, Building2, Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

// ─────────────────────────────────────────────────────────────────────────────
// Sous-composant : section logo de l'entreprise
// ─────────────────────────────────────────────────────────────────────────────
const CompanyLogoSection = () => {
  const { currentTenant, refreshTenant } = useTenant();
  const { toast } = useToast();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const tenantId = currentTenant?.id;
  const currentLogoUrl = preview ?? currentTenant?.logo_url ?? null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !tenantId) return;

    // Validation locale
    const ALLOWED = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/svg+xml', 'image/gif'];
    if (!ALLOWED.includes(file.type)) {
      toast({ title: t('common.invalidFormat'), description: t('settings.invalidFormat'), variant: 'destructive' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: t('common.fileTooLarge'), description: t('settings.fileTooLarge'), variant: 'destructive' });
      return;
    }

    // Aperçu local immédiat
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading(true);
    setUploadStatus('idle');

    try {
      const filePath = `${tenantId}/logo`;

      // 1. Upload dans le bucket tenant-logos
      const { error: uploadError } = await supabase.storage
        .from('tenant-logos')
        .upload(filePath, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      // 2. Récupérer l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('tenant-logos')
        .getPublicUrl(filePath);

      // Forcer le cache-bust en ajoutant un timestamp
      const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;

      // 3. Mettre à jour tenants.logo_url
      const { error: updateError } = await supabase
        .from('tenants')
        .update({ logo_url: cacheBustedUrl })
        .eq('id', tenantId);

      if (updateError) throw updateError;

      setPreview(cacheBustedUrl);
      setUploadStatus('success');
      await refreshTenant();

      toast({ title: t('settings.logoUpdated'), description: t('settings.logoUpdatedDesc') });
    } catch (err: any) {
      setPreview(currentTenant?.logo_url ?? null);
      setUploadStatus('error');
      toast({
        title: t('settings.uploadError'),
        description: err.message ?? t('settings.unexpectedError'),
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      // Réinitialiser l'input pour permettre le re-upload du même fichier
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-500" />
          {t('settings.companyLogo')}
        </CardTitle>
        <CardDescription>
          {t('settings.companyLogoDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Aperçu du logo */}
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border bg-muted">
            {currentLogoUrl ? (
              <img
                src={currentLogoUrl}
                alt={t('settings.companyLogoAlt')}
                className="h-full w-full object-contain"
              />
            ) : (
              <Building2 className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {uploading ? t('common.uploading') : t('common.fileChoose')}
            </Button>
            {uploadStatus === 'success' && (
              <p className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle className="h-3.5 w-3.5" /> {t('settings.logoSaved')}
              </p>
            )}
            {uploadStatus === 'error' && (
              <p className="flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5" /> {t('common.uploadFailed')}
              </p>
            )}
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/jpg,image/webp,image/svg+xml,image/gif"
          className="hidden"
          onChange={handleFileChange}
        />
      </CardContent>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Page principale Paramètres
// ─────────────────────────────────────────────────────────────────────────────
export const Settings = () => {
  const { t } = useTranslation();
  return (
    <div className="container mx-auto px-4 py-4 sm:py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold sm:text-3xl">{t('settings.title')}</h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            {t('settings.subtitle')}
          </p>
        </div>

        <Tabs defaultValue="security" className="space-y-4 sm:space-y-6">
          {/* Tabs : 3 colonnes sur mobile, 5 sur desktop */}
          <TabsList className="grid h-auto w-full grid-cols-3 gap-1.5 p-1.5 sm:grid-cols-5 sm:gap-2 sm:p-2">
            <TabsTrigger
              value="security"
              className="flex items-center gap-1 py-2.5 text-xs sm:gap-2 sm:py-2 sm:text-sm"
            >
              <Shield className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              <span className="truncate">{t('settings.security')}</span>
            </TabsTrigger>
            <TabsTrigger
              value="profile"
              className="flex items-center gap-1 py-2.5 text-xs sm:gap-2 sm:py-2 sm:text-sm"
            >
              <User className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              <span className="truncate">{t('settings.profile')}</span>
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="flex items-center gap-1 py-2.5 text-xs sm:gap-2 sm:py-2 sm:text-sm"
            >
              <Bell className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              <span className="truncate">{t('settings.notifs')}</span>
            </TabsTrigger>
            <TabsTrigger
              value="password"
              className="flex items-center gap-1 py-2.5 text-xs sm:gap-2 sm:py-2 sm:text-sm"
            >
              <Key className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              <span className="truncate">
                <span className="hidden sm:inline">{t('settings.password')}</span>
                <span className="sm:hidden">{t('settings.mdp')}</span>
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="company"
              className="flex items-center gap-1 py-2.5 text-xs sm:gap-2 sm:py-2 sm:text-sm"
            >
              <Building2 className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              <span className="truncate">{t('settings.company')}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="security" className="space-y-6">
            <SecuritySettings />
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.profileInfo')}</CardTitle>
                <CardDescription>{t('settings.profileInfoDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{t('common.comingSoon')}</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.notifPrefs')}</CardTitle>
                <CardDescription>{t('settings.notifPrefsDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{t('common.comingSoon')}</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="password" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.changePassword')}</CardTitle>
                <CardDescription>{t('settings.changePasswordDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{t('common.comingSoon')}</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="company" className="space-y-6">
            <CompanyLogoSection />
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.companyInfo')}</CardTitle>
                <CardDescription>{t('settings.companyInfoDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{t('common.comingSoon')}</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
