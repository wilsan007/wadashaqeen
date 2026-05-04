import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Clock,
  TrendingUp,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import SeniorityBonusService, {
  SeniorityBonusConfig,
  FreezePeriod,
} from '@/services/seniorityBonusService';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/hooks/useTenant';

export const SeniorityBonusConfigPage: React.FC = () => {
  const { tenantId, loading: tenantLoading } = useTenant();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [configLoaded, setConfigLoaded] = useState(false); // Flag pour éviter les rechargements
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<SeniorityBonusConfig | null>(null);
  const [freezePeriods, setFreezePeriods] = useState<FreezePeriod[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Champs éditables
  const [pourcentage, setPourcentage] = useState('2.00');
  const [periode, setPeriode] = useState('24');
  const [plafond, setPlafond] = useState('50.00');

  // Nouvelle période de gel
  const [showAddFreeze, setShowAddFreeze] = useState(false);
  const [newFreezeStart, setNewFreezeStart] = useState('');
  const [newFreezeEnd, setNewFreezeEnd] = useState('');
  const [newFreezeMotif, setNewFreezeMotif] = useState('');

  // Vérifier les permissions de l'utilisateur
  useEffect(() => {
    const checkPermissions = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !tenantId) return;

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role:roles(name)')
        .eq('user_id', user.id)
        .eq('tenant_id', tenantId)
        .single();

      const roleName = (roleData as any)?.role?.name;
      setUserRole(roleName);
    };

    if (tenantId && !tenantLoading) {
      checkPermissions();
    }
  }, [tenantId, tenantLoading]);

  // Charger la configuration UNE SEULE FOIS
  useEffect(() => {
    if (tenantId && !tenantLoading && !configLoaded) {
      loadConfig();
      loadFreezePeriods();
      setConfigLoaded(true);
    }
  }, [tenantId, tenantLoading, configLoaded]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      if (!tenantId) {
        setMessage({ type: 'error', text: 'Organisation introuvable. Veuillez vous reconnecter.' });
        setLoading(false);
        return;
      }

      const cfg = await SeniorityBonusService.getConfig(tenantId);
      setConfig(cfg);
      setPourcentage(cfg.pourcentage_augmentation.toFixed(2));
      setPeriode(cfg.periode_augmentation_mois.toString());
      setPlafond(cfg.plafond_pourcentage.toFixed(2));
      setMessage(null); // Effacer les erreurs précédentes
    } catch (error) {
      console.error('Erreur chargement config:', error);
      setMessage({ type: 'error', text: 'Erreur lors du chargement de la configuration' });
    } finally {
      setLoading(false);
    }
  };

  const loadFreezePeriods = async () => {
    try {
      if (!tenantId) return;

      const periods = await SeniorityBonusService.getFreezePeriods(tenantId);
      setFreezePeriods(periods);
    } catch (error) {
      console.error('Erreur chargement périodes gel:', error);
    }
  };

  const handleSaveConfig = async () => {
    try {
      setSaving(true);
      if (!tenantId) throw new Error('Organisation introuvable');

      await SeniorityBonusService.updateConfig(tenantId, {
        pourcentage_augmentation: parseFloat(pourcentage),
        periode_augmentation_mois: parseInt(periode),
        plafond_pourcentage: parseFloat(plafond),
      });

      setMessage({ type: 'success', text: 'Configuration sauvegardée avec succès !' });
      setTimeout(() => setMessage(null), 3000); // Efface le message après 3 secondes
    } catch (error) {
      console.error('Erreur sauvegarde config:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddFreeze = async () => {
    try {
      if (!newFreezeStart) {
        setMessage({ type: 'error', text: 'La date de début est obligatoire' });
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!tenantId || !user) throw new Error('Organisation ou utilisateur introuvable');

      console.log('Adding freeze period:', {
        tenantId,
        dateDebut: newFreezeStart,
        dateFin: newFreezeEnd || null,
        motif: newFreezeMotif,
      });

      await SeniorityBonusService.addFreezePeriod(
        tenantId,
        newFreezeStart,
        newFreezeEnd || null,
        newFreezeMotif,
        user.id
      );

      setMessage({ type: 'success', text: 'Période de gel ajoutée avec succès' });
      setShowAddFreeze(false);
      setNewFreezeStart('');
      setNewFreezeEnd('');
      setNewFreezeMotif('');

      // Recharger les périodes
      await loadFreezePeriods();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Erreur ajout gel:', error);
      setMessage({
        type: 'error',
        text: "Erreur lors de l'ajout de la période: " + (error as Error).message,
      });
    }
  };

  const handleDeleteFreeze = async (freezeId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette période de gel ?')) return;

    try {
      await SeniorityBonusService.deleteFreezePeriod(freezeId);
      setMessage({ type: 'success', text: 'Période de gel supprimée' });
      await loadFreezePeriods();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Erreur suppression gel:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la suppression' });
    }
  };

  const handleEndFreeze = async (freezeId: string) => {
    const today = new Date().toISOString().split('T')[0];
    try {
      await SeniorityBonusService.endFreezePeriod(freezeId, today);
      setMessage({ type: 'success', text: 'Période de gel terminée' });
      await loadFreezePeriods();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Erreur fin gel:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la fin du gel' });
    }
  };

  // Calcul simulation
  const calculateSimulation = (years: number, baseSalary: number = 100000) => {
    const months = years * 12;
    const numberOfPeriods = Math.floor(months / parseInt(periode));
    const percentage = Math.min(parseFloat(pourcentage) * numberOfPeriods, parseFloat(plafond));
    return Math.round((baseSalary * percentage) / 100);
  };

  if (loading || tenantLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  // Vérifier les permissions - Accès restreint
  const hasAccess =
    userRole === 'tenant_admin' ||
    userRole === 'manager_hr' ||
    userRole === 'owner' ||
    userRole === 'super_admin';

  if (!hasAccess) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">Accès non autorisé</p>
              <p>
                Seuls les administrateurs et les responsables RH peuvent accéder à la configuration
                de la prime d'ancienneté.
              </p>
              <p className="text-muted-foreground text-sm">
                Rôle requis: Administrateur ou Responsable RH
              </p>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center gap-3">
        <TrendingUp className="h-8 w-8 text-purple-600" />
        <div>
          <h1 className="text-3xl font-bold">Configuration Prime d'Ancienneté</h1>
          <p className="text-muted-foreground">
            Gérez les paramètres de calcul et les périodes de gel
          </p>
        </div>
      </div>

      {message && (
        <Alert
          variant={message.type === 'error' ? 'destructive' : 'default'}
          className="animate-in fade-in"
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Paramètres de calcul */}
      <Card>
        <CardHeader>
          <CardTitle>Paramètres de Calcul</CardTitle>
          <CardDescription>
            Configurez la méthode de calcul de la prime d'ancienneté pour votre organisation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="pourcentage">Pourcentage d'augmentation (%)</Label>
              <Input
                id="pourcentage"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={pourcentage}
                onChange={e => setPourcentage(e.target.value)}
                placeholder="2.00"
                className="h-12 text-base"
              />
              <p className="text-muted-foreground text-xs">Augmentation par période (ex: 2%)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="periode">Période d'augmentation (mois)</Label>
              <Input
                id="periode"
                type="number"
                min="1"
                max="240"
                value={periode}
                onChange={e => setPeriode(e.target.value)}
                placeholder="24"
                className="h-12 text-base"
              />
              <p className="text-muted-foreground text-xs">Fréquence en mois (ex: 24 = 2 ans)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="plafond">Plafond maximum (%)</Label>
              <Input
                id="plafond"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={plafond}
                onChange={e => setPlafond(e.target.value)}
                placeholder="50.00"
                className="h-12 text-base"
              />
              <p className="text-muted-foreground text-xs">Limite max du salaire de base</p>
            </div>
          </div>

          <Button onClick={handleSaveConfig} disabled={saving} className="w-full md:w-auto">
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Sauvegarde...' : 'Sauvegarder la configuration'}
          </Button>
        </CardContent>
      </Card>

      {/* Simulation */}
      <Card>
        <CardHeader>
          <CardTitle>Simulation</CardTitle>
          <CardDescription>
            Aperçu de l'évolution de la prime sur 10 ans (base 100,000 DJF)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ancienneté</TableHead>
                  {[2, 4, 6, 8, 10].map(year => (
                    <TableHead key={year} className="text-right">
                      {year} ans
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Prime</TableCell>
                  {[2, 4, 6, 8, 10].map(year => (
                    <TableCell key={year} className="text-right font-mono">
                      {calculateSimulation(year).toLocaleString('fr-FR')} DJF
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">% du salaire</TableCell>
                  {[2, 4, 6, 8, 10].map(year => {
                    const months = year * 12;
                    const numberOfPeriods = Math.floor(months / parseInt(periode));
                    const percentage = Math.min(
                      parseFloat(pourcentage) * numberOfPeriods,
                      parseFloat(plafond)
                    );
                    return (
                      <TableCell key={year} className="text-right font-mono text-purple-600">
                        {percentage.toFixed(1)}%
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Périodes de gel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Périodes de Gel
              </CardTitle>
              <CardDescription>
                Les périodes de gel suspendent la progression de l'ancienneté
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddFreeze(!showAddFreeze)} variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle période
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showAddFreeze && (
            <Card className="bg-muted/50">
              <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="start">Date de début *</Label>
                    <Input
                      id="start"
                      type="date"
                      value={newFreezeStart}
                      onChange={e => setNewFreezeStart(e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end">Date de fin (optionnel)</Label>
                    <Input
                      id="end"
                      type="date"
                      value={newFreezeEnd}
                      onChange={e => setNewFreezeEnd(e.target.value)}
                      className="h-10"
                    />
                    <p className="text-muted-foreground text-xs">
                      Laisser vide pour un gel en cours
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="motif">Motif</Label>
                  <Input
                    id="motif"
                    value={newFreezeMotif}
                    onChange={e => setNewFreezeMotif(e.target.value)}
                    placeholder="Ex: Crise économique, restructuration..."
                    className="h-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddFreeze} disabled={!newFreezeStart}>
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddFreeze(false);
                      setNewFreezeStart('');
                      setNewFreezeEnd('');
                      setNewFreezeMotif('');
                    }}
                  >
                    Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {freezePeriods.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">
              <Clock className="mx-auto mb-2 h-12 w-12 opacity-50" />
              <p>Aucune période de gel configurée</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Début</TableHead>
                  <TableHead>Fin</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Motif</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {freezePeriods.map(period => (
                  <TableRow key={period.id}>
                    <TableCell>{new Date(period.date_debut).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell>
                      {period.date_fin
                        ? new Date(period.date_fin).toLocaleDateString('fr-FR')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {!period.date_fin ? (
                        <span className="inline-flex items-center gap-1 text-orange-600">
                          <Clock className="h-3 w-3" />
                          En cours
                        </span>
                      ) : (
                        <span className="text-muted-foreground inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Terminé
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{period.motif || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {!period.date_fin && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEndFreeze(period.id)}
                          >
                            <XCircle className="mr-1 h-3 w-3" />
                            Terminer
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteFreeze(period.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SeniorityBonusConfigPage;
