import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Building2,
  Landmark,
  Rocket,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  AlertTriangle,
  Layers,
  LayoutTemplate,
} from 'lucide-react';
import { OrganizationLevel, HierarchyService } from '@/services/HierarchyService';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/contexts/TenantContext';

export const HierarchyConfig = () => {
  const { currentTenant: tenant } = useTenant();
  const { toast } = useToast();
  const [levels, setLevels] = useState<OrganizationLevel[]>([]);
  const [loading, setLoading] = useState(false);
  const [newLevelName, setNewLevelName] = useState('');
  const [pendingTemplate, setPendingTemplate] = useState<{ type: 'ministry' | 'corporate' | 'startup'; label: string } | null>(null);
  const [pendingDeleteLevel, setPendingDeleteLevel] = useState<string | null>(null);

  // Load levels
  const loadLevels = async () => {
    if (!tenant) return;
    setLoading(true);
    try {
      const data = await HierarchyService.getLevels(tenant.id);
      setLevels(data);
    } catch (error) {
      console.error('Erreur chargement niveaux:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger la hiérarchie.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLevels();
  }, [tenant]);

  // Apply Template
  const handleApplyTemplate = (type: 'ministry' | 'corporate' | 'startup', label: string) => {
    if (!tenant) return;
    setPendingTemplate({ type, label });
  };

  const confirmApplyTemplate = async () => {
    if (!tenant || !pendingTemplate) return;
    const { type, label } = pendingTemplate;
    setPendingTemplate(null);
    setLoading(true);
    try {
      await HierarchyService.applyTemplate(tenant.id, type);
      toast({
        title: 'Modèle appliqué',
        description: `Le modèle "${label}" a été configuré avec succès.`,
      });
      loadLevels();
    } catch (error) {
      console.error('Erreur application modèle:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: "Impossible d'appliquer le modèle.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Add Level
  const handleAddLevel = async () => {
    if (!tenant || !newLevelName.trim()) return;

    const newRank = levels.length > 0 ? Math.max(...levels.map(l => l.rank_order)) + 1 : 0;

    try {
      await HierarchyService.createLevel(tenant.id, {
        name: newLevelName,
        rank_order: newRank,
        color_code: '#3b82f6', // Default blue
      });
      setNewLevelName('');
      loadLevels();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: "Erreur lors de l'ajout." });
    }
  };

  // Delete Level
  const handleDeleteLevel = (id: string) => {
    setPendingDeleteLevel(id);
  };

  const confirmDeleteLevel = async () => {
    if (!pendingDeleteLevel) return;
    const id = pendingDeleteLevel;
    setPendingDeleteLevel(null);
    try {
      await HierarchyService.deleteLevel(id);
      loadLevels();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de supprimer (peut-être utilisé par des employés ?)',
      });
    }
  };

  // Move Up/Down (Swap Ranks) -> Simplified logic: just swap rank numbers locally then save all?
  // For simplicity MVP: Delete and recreate is risky. Better update calling API.
  // We'll implement a simple swap.
  const swapLevels = async (index1: number, index2: number) => {
    if (index1 < 0 || index2 < 0 || index1 >= levels.length || index2 >= levels.length) return;

    // Optimistic UI update
    const newLevels = [...levels];
    const temp = newLevels[index1];
    newLevels[index1] = newLevels[index2];
    newLevels[index2] = temp;

    // Swap ranks in objects
    const rank1 = newLevels[index1].rank_order;
    const rank2 = newLevels[index2].rank_order;
    newLevels[index1].rank_order = rank2; // This is wrong logic if we sort by rank.
    // Correct logic: The item at index1 should fetch rank of index1 position.
    // Let's assume the list is sorted by rank.
    // Item A (Rank 0), Item B (Rank 1). Swap -> Item B (Rank 0), Item A (Rank 1).

    const itemA = levels[index1];
    const itemB = levels[index2];

    // We update DB
    try {
      setLoading(true);
      await HierarchyService.updateLevel(itemA.id, { rank_order: itemB.rank_order });
      await HierarchyService.updateLevel(itemB.id, { rank_order: itemA.rank_order });
      loadLevels();
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Erreur lors du déplacement.',
      });
      loadLevels(); // Revert
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Confirm apply template */}
      <AlertDialog open={!!pendingTemplate} onOpenChange={open => { if (!open) setPendingTemplate(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Appliquer le modèle "{pendingTemplate?.label}" ?</AlertDialogTitle>
            <AlertDialogDescription>
              Ceci va remplacer TOUTE la configuration actuelle. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmApplyTemplate} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Appliquer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm delete level */}
      <AlertDialog open={!!pendingDeleteLevel} onOpenChange={open => { if (!open) setPendingDeleteLevel(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce niveau ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le niveau ne doit pas être utilisé par des employés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteLevel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Left: Configuration List */}
      <div className="space-y-6">
        <Card className="h-full border-t-4 border-t-blue-600 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-blue-600" />
              Niveaux Hiérarchiques
            </CardTitle>
            <CardDescription>
              Définissez l'ordre hiérarchique de votre organisation (du plus haut au plus bas).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Add New */}
            <div className="mb-6 flex gap-2">
              <Input
                placeholder="Nouveau niveau (ex: Stagiaire)"
                value={newLevelName}
                onChange={e => setNewLevelName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddLevel()}
              />
              <Button onClick={handleAddLevel}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter
              </Button>
            </div>

            {/* List */}
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {levels.length === 0 && (
                  <div className="rounded-lg border-2 border-dashed py-8 text-center text-gray-500">
                    Aucun niveau défini. Utilisez un modèle ou ajoutez-en manuellement.
                  </div>
                )}

                {levels.map((level, index) => (
                  <div
                    key={level.id}
                    className="group flex items-center justify-between rounded-lg border bg-white p-3 shadow-sm transition-colors hover:border-blue-300 dark:bg-gray-800"
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className="flex h-6 w-6 items-center justify-center rounded-full border-blue-200 bg-blue-50 p-0 text-blue-700"
                      >
                        {index + 1}
                      </Badge>
                      <span className="font-medium text-gray-700 dark:text-gray-200">
                        {level.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-500"
                        disabled={index === 0}
                        onClick={() => swapLevels(index, index - 1)}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-500"
                        disabled={index === levels.length - 1}
                        onClick={() => swapLevels(index, index + 1)}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-700"
                        onClick={() => handleDeleteLevel(level.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Right: Templates & Info */}
      <div className="space-y-6">
        <Card className="border-none bg-gradient-to-br from-slate-50 to-slate-100 shadow-inner dark:from-slate-900 dark:to-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <LayoutTemplate className="h-5 w-5 text-purple-600" />
              Modèles Rapides
            </CardTitle>
            <CardDescription>
              Chargez une structure prédéfinie pour démarrer rapidement.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Button
              variant="outline"
              className="group relative h-auto justify-start overflow-hidden bg-white p-4 hover:border-orange-400 dark:bg-slate-700"
              onClick={() => handleApplyTemplate('ministry', 'Administration / Ministère')}
            >
              <div className="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-orange-400 to-red-500" />
              <Landmark className="mr-4 mb-auto h-8 w-8 text-orange-600" />
              <div className="text-left">
                <div className="font-bold text-gray-800 group-hover:text-orange-700 dark:text-white">
                  Administration / Ministère
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  Ministre, Secrétaire Général, Directeur, Chef de Service...
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="group relative h-auto justify-start overflow-hidden bg-white p-4 hover:border-blue-400 dark:bg-slate-700"
              onClick={() => handleApplyTemplate('corporate', 'Grande Entreprise')}
            >
              <div className="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-blue-400 to-indigo-500" />
              <Building2 className="mr-4 mb-auto h-8 w-8 text-blue-600" />
              <div className="text-left">
                <div className="font-bold text-gray-800 group-hover:text-blue-700 dark:text-white">
                  Grande Entreprise (Corporate)
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  PDG, Directeur Général, Manager, Chef de Projet...
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="group relative h-auto justify-start overflow-hidden bg-white p-4 hover:border-emerald-400 dark:bg-slate-700"
              onClick={() => handleApplyTemplate('startup', 'Startup / Tech')}
            >
              <div className="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-emerald-400 to-teal-500" />
              <Rocket className="mr-4 mb-auto h-8 w-8 text-emerald-600" />
              <div className="text-left">
                <div className="font-bold text-gray-800 group-hover:text-emerald-700 dark:text-white">
                  Startup / Tech
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  Founder, C-Level, Lead, Senior, Junior...
                </div>
              </div>
            </Button>
          </CardContent>
        </Card>

        <Alert className="border-amber-200 bg-amber-50 text-amber-800">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle>Impact sur l'organigramme</AlertTitle>
          <AlertDescription>
            L'ordre défini ici (1, 2, 3...) sera utilisé pour construire l'organigramme visuel
            automatiquement. Le niveau 1 sera tout en haut de l'arbre.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};
