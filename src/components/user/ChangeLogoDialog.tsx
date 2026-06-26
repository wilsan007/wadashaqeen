import React, { useState, useRef } from 'react';
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
} from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';

interface ChangeLogoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentLogoUrl?: string;
}

const EXT_TO_MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
};

const MAX_SIZE_BYTES = 2 * 1024 * 1024;

export const ChangeLogoDialog: React.FC<ChangeLogoDialogProps> = ({
  open,
  onOpenChange,
  currentLogoUrl,
}) => {
  const { toast } = useToast();
  const { currentTenant, refreshTenant } = useTenant();
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getExtension = (filename: string) =>
    filename.split('.').pop()?.toLowerCase() ?? '';

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = getExtension(file.name);
    if (!EXT_TO_MIME[ext]) {
      toast({
        title: 'Extension invalide',
        description: `Extensions acceptées : ${Object.keys(EXT_TO_MIME).join(', ')}`,
        variant: 'destructive',
      });
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      toast({
        title: 'Fichier trop volumineux',
        description: 'La taille maximale est de 2 MB',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!selectedFile || !currentTenant?.id) return;

    setLoading(true);

    try {
      const ext = getExtension(selectedFile.name);
      const contentType = EXT_TO_MIME[ext] ?? 'image/jpeg';
      const fileName = `${currentTenant.id}/logo-${Date.now()}.${ext}`;

      // Supprimer les anciens logos du tenant
      const { data: existingFiles } = await supabase.storage
        .from('tenant-logos')
        .list(currentTenant.id);

      if (existingFiles && existingFiles.length > 0) {
        const paths = existingFiles.map((f) => `${currentTenant.id}/${f.name}`);
        await supabase.storage.from('tenant-logos').remove(paths);
      }

      // Créer un Blob avec le bon MIME type (indépendant de file.type)
      const arrayBuffer = await selectedFile.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: contentType });

      const { error: uploadError } = await supabase.storage
        .from('tenant-logos')
        .upload(fileName, blob, {
          contentType,
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('tenant-logos').getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('tenants')
        .update({ logo_url: publicUrl })
        .eq('id', currentTenant.id);

      if (updateError) throw updateError;

      await refreshTenant();

      toast({
        title: 'Logo modifié',
        description: 'Le logo est maintenant visible dans la sidebar.',
      });

      onOpenChange(false);
    } catch (error: any) {
      console.error('Erreur upload logo:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de modifier le logo',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePreview = () => {
    setSelectedFile(null);
    setPreviewUrl(currentLogoUrl || null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalContent className="sm:max-w-[500px]">
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>Modifier le logo de l'entreprise</ResponsiveModalTitle>
          <ResponsiveModalDescription>
            Téléchargez un nouveau logo (PNG, JPG, WEBP — Max 2 MB)
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>

        <div className="grid gap-4 py-4">
          <div className="flex flex-col items-center gap-4">
            <div className="border-muted-foreground/25 bg-muted/10 relative h-32 w-auto max-w-full min-w-[8rem] overflow-hidden rounded-lg border-2 border-dashed px-2">
              {previewUrl ? (
                <>
                  <img
                    src={previewUrl}
                    alt="Aperçu logo"
                    className="h-full w-auto object-contain"
                  />
                  {selectedFile && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 rounded-full p-0"
                      onClick={handleRemovePreview}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <ImageIcon className="text-muted-foreground/50 h-12 w-12" />
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept={Object.keys(EXT_TO_MIME)
                .map((e) => `.${e}`)
                .join(',')}
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              <Upload className="mr-2 h-4 w-4" />
              Choisir un fichier
            </Button>

            {selectedFile && (
              <p className="text-muted-foreground text-sm">
                <span className="font-medium">Fichier :</span> {selectedFile.name}
              </p>
            )}
          </div>
        </div>

        <ResponsiveModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !selectedFile}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </ResponsiveModalFooter>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
};
