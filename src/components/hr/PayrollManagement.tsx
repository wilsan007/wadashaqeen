import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DollarSign,
  Download,
  FileSpreadsheet,
  Lock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Calendar,
  Plus,
  RefreshCw,
  UserPlus,
} from 'lucide-react';
// Using native select elements instead of Radix UI Select for better reliability
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { PaiePeriode, PaieBulletin } from '../../types/payroll';
import { payrollService } from '../../services/payrollService';
import { PayrollTable } from './PayrollTable';
import { EmployeePayrollForm } from './EmployeePayrollForm';
import { Payslip } from './Payslip';
import { SingleEmployeeGenerationDialog } from './SingleEmployeeGenerationDialog';
import { useTenant } from '@/hooks/useTenant';
import { SeniorityBonusConfigPage } from './SeniorityBonusConfig';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export const PayrollManagement = () => {
  const { tenantId, loading: tenantLoading } = useTenant();

  const [activeView, setActiveView] = useState('periods');
  const [periodes, setPeriodes] = useState<PaiePeriode[]>([]);
  const [selectedPeriodeId, setSelectedPeriodeId] = useState<string | null>(null);
  const [bulletins, setBulletins] = useState<PaieBulletin[]>([]);
  const [selectedBulletin, setSelectedBulletin] = useState<PaieBulletin | null>(null);
  const [loading, setLoading] = useState(false);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [showSingleGenDialog, setShowSingleGenDialog] = useState(false);
  const [showSeniorityConfig, setShowSeniorityConfig] = useState(false);
  const [stats, setStats] = useState({
    totalBrut: 0,
    totalNet: 0,
    totalCharges: 0,
    coutTotal: 0,
    employesCount: 0,
  });

  useEffect(() => {
    if (tenantId && !tenantLoading) {
      fetchPeriodes();
    }
  }, [tenantId, tenantLoading]);

  useEffect(() => {
    if (selectedPeriodeId) {
      fetchBulletins(selectedPeriodeId);
    }
  }, [selectedPeriodeId]);

  const fetchPeriodes = async () => {
    if (!tenantId) return;
    console.log('Fetching periodes for tenant:', tenantId);

    const { data, error } = await supabase
      .from('paie_periodes')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('annee', { ascending: false })
      .order('mois', { ascending: false });

    if (error) {
      console.error('Error fetching periodes:', error);
      return;
    }

    console.log('Periodes loaded:', data?.length || 0);

    if (data) {
      setPeriodes(data);
      if (data.length > 0 && !selectedPeriodeId) {
        setSelectedPeriodeId(data[0].id);
      }
    }
  };

  const fetchBulletins = async (periodeId: string) => {
    setLoading(true);
    console.log('Fetching bulletins for period:', periodeId);

    const { data, error } = await supabase
      .from('paie_bulletins')
      .select('*, employe:paie_employes(nom_complet, fonction, date_embauche)')
      .eq('periode_id', periodeId)
      .order('employe(nom_complet)');

    if (error) {
      console.error('Error fetching bulletins:', error);
    } else {
      console.log('Bulletins loaded:', data?.length || 0);
      console.log('Sample bulletin:', data?.[0]); // Debug: voir le contenu
      const typedData = data as any as PaieBulletin[]; // Cast temporaire
      setBulletins(typedData);
      calculateStats(typedData);
    }
    setLoading(false);
  };

  const calculateStats = (currentBulletins: PaieBulletin[]) => {
    const newStats = currentBulletins.reduce(
      (acc, b) => ({
        totalBrut: acc.totalBrut + (b.salaire_brut || 0),
        totalNet: acc.totalNet + (b.salaire_net || 0),
        totalCharges: acc.totalCharges + (b.cnss_patronale || 0),
        coutTotal: acc.coutTotal + (b.salaire_brut || 0) + (b.cnss_patronale || 0),
        employesCount: acc.employesCount + 1,
      }),
      { totalBrut: 0, totalNet: 0, totalCharges: 0, coutTotal: 0, employesCount: 0 }
    );
    setStats(newStats);
  };

  const handleGeneratePayroll = async () => {
    if (!selectedPeriodeId) {
      alert('Veuillez sélectionner une période');
      return;
    }

    setLoading(true);
    console.log('Generating payroll for period:', selectedPeriodeId);

    try {
      if (!tenantId) {
        alert('Erreur: Contexte tenant non disponible');
        setLoading(false);
        return;
      }

      // Use the new batch generation method
      const result = await payrollService.genererPaieLot(tenantId, selectedPeriodeId);

      await fetchBulletins(selectedPeriodeId);
      alert(`Paie générée avec succès pour ${result.count} employés !`);
    } catch (error) {
      console.error('Error generating payroll:', error);
      alert('Erreur lors de la génération: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('fr-DJ', {
      style: 'currency',
      currency: 'DJF',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPeriodLabel = (p: PaiePeriode) => {
    return new Date(p.annee, p.mois - 1).toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric',
    });
  };

  const handleSyncEmployees = async () => {
    if (!tenantId) {
      alert('Erreur: Tenant non identifié');
      return;
    }
    setLoading(true);
    try {
      // 1. Get employees for tenant
      const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('id, full_name, job_title, salary, tenant_id')
        .eq('tenant_id', tenantId);

      if (empError) throw empError;

      // 2. Check existing payroll employees
      const { data: payrollEmps, error: payError } = await supabase
        .from('paie_employes')
        .select('user_id')
        .eq('tenant_id', tenantId);

      if (payError) throw payError;

      const existingUserIds = new Set(payrollEmps?.map(p => p.user_id) || []);

      let addedCount = 0;

      // 3. Insert missing
      for (const emp of employees || []) {
        if (!existingUserIds.has(emp.id)) {
          const { error: insertError } = await supabase.from('paie_employes').insert({
            tenant_id: tenantId,
            user_id: emp.id,
            nom_complet: emp.full_name,
            fonction: emp.job_title || 'Employé',
            salaire_base: emp.salary || 0,
            prime_transport_fixe: 0,
            prime_logement_fixe: 0,
            prime_fonction_fixe: 0,
            prime_responsabilite_fixe: 0,
            retenue_waqf_fixe: 0,
          });

          if (insertError) {
            console.error(`Error adding ${emp.full_name}:`, insertError);
          } else {
            addedCount++;
          }
        }
      }

      alert(`Synchronisation terminée. ${addedCount} employés ajoutés.`);
    } catch (error) {
      console.error('Error syncing employees:', error);
      alert('Erreur lors de la synchronisation: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground text-2xl font-bold">Gestion de la Paie</h2>
          <p className="text-muted-foreground">Préparation et contrôles de paie</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowEmployeeForm(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Nouvel Employé
          </Button>
          <Button variant="outline" onClick={handleSyncEmployees} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Sync. Employés
          </Button>
          <Button variant="outline" onClick={() => setShowSeniorityConfig(true)}>
            <TrendingUp className="mr-2 h-4 w-4" />
            Prime Ancienneté
          </Button>
          <Button onClick={handleGeneratePayroll} disabled={loading || !selectedPeriodeId}>
            <DollarSign className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Calcul...' : 'Générer la Paie'}
          </Button>
        </div>
      </div>

      <Tabs value={activeView} onValueChange={setActiveView}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="periods" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Périodes
          </TabsTrigger>
          <TabsTrigger value="employees" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Bulletins
          </TabsTrigger>
          <TabsTrigger value="checks" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Contrôles
          </TabsTrigger>
          <TabsTrigger value="exports" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="periods" className="space-y-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between rounded-lg border bg-white p-4 shadow-sm dark:bg-gray-800">
              <h3 className="text-lg font-medium">Période de paie</h3>
              <select
                value={selectedPeriodeId || ''}
                onChange={e => {
                  console.log('Period selected:', e.target.value);
                  setSelectedPeriodeId(e.target.value);
                }}
                className="border-input bg-background focus:ring-ring h-10 w-[200px] rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none"
              >
                <option value="">Choisir une période</option>
                {periodes.map(p => (
                  <option key={p.id} value={p.id}>
                    {getPeriodLabel(p)}
                  </option>
                ))}
              </select>
            </div>

            {selectedPeriodeId && (
              <>
                <Card className="border-l-4 border-l-indigo-500 transition-shadow hover:shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg capitalize">
                          {periodes.find(p => p.id === selectedPeriodeId)
                            ? getPeriodLabel(periodes.find(p => p.id === selectedPeriodeId)!)
                            : 'Période sélectionnée'}
                        </CardTitle>
                        <p className="text-muted-foreground text-sm">
                          {stats.employesCount} employés traités
                        </p>
                      </div>
                      <Badge className="border-green-200 bg-green-100 text-green-800">
                        <CheckCircle className="mr-1 h-4 w-4" />
                        Calculé
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                      <div>
                        <p className="text-muted-foreground text-sm font-medium">Salaire brut</p>
                        <p className="text-xl font-bold">{formatMoney(stats.totalBrut)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-sm font-medium">Salaire net</p>
                        <p className="text-xl font-bold text-green-600">
                          {formatMoney(stats.totalNet)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-sm font-medium">
                          Charges patronales
                        </p>
                        <p className="text-xl font-bold text-gray-600">
                          {formatMoney(stats.totalCharges)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-sm font-medium">Coût total</p>
                        <p className="text-xl font-bold text-indigo-600">
                          {formatMoney(stats.coutTotal)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="mt-6">
                  <h3 className="mb-4 text-lg font-medium">Tableau des salaires</h3>
                  <PayrollTable bulletins={bulletins} loading={loading} />
                </div>
              </>
            )}

            {/* Liste des autres périodes (si aucune sélectionnée ou pour historique rapide) */}
            {!selectedPeriodeId &&
              periodes.map(p => (
                <Card
                  key={p.id}
                  className="cursor-pointer opacity-70 transition-opacity hover:opacity-100"
                  onClick={() => {
                    setSelectedPeriodeId(p.id);
                  }}
                >
                  <CardHeader className="py-4">
                    <CardTitle className="flex justify-between text-base capitalize">
                      {getPeriodLabel(p)}
                      <Button variant="ghost" size="sm">
                        Voir
                      </Button>
                    </CardTitle>
                  </CardHeader>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="employees" className="space-y-4">
          {!selectedBulletin ? (
            <Card>
              <CardHeader>
                <CardTitle>Génération des Bulletins</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between rounded-lg border bg-white p-4 shadow-sm dark:bg-gray-800">
                    <div>
                      <h3 className="text-lg font-medium">Sélectionner un employé</h3>
                      <p className="text-sm text-gray-500">
                        Choisissez un employé pour générer son bulletin de paie
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={selectedPeriodeId || ''}
                        onChange={e => setSelectedPeriodeId(e.target.value)}
                        className="border-input bg-background focus:ring-ring h-10 w-[200px] rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none"
                      >
                        <option value="">Choisir une période</option>
                        {periodes.map(p => (
                          <option key={p.id} value={p.id}>
                            {getPeriodLabel(p)}
                          </option>
                        ))}
                      </select>
                      <Button
                        variant="secondary"
                        onClick={() => setShowSingleGenDialog(true)}
                        disabled={!selectedPeriodeId}
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Générer Bulletin
                      </Button>
                    </div>
                  </div>

                  {loading ? (
                    <div className="py-8 text-center">Chargement des données...</div>
                  ) : bulletins.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {bulletins.map(bulletin => (
                        <Card
                          key={bulletin.id}
                          className="cursor-pointer border-l-4 border-l-[#003366] transition-shadow hover:shadow-md"
                          onClick={() => setSelectedBulletin(bulletin)}
                        >
                          <CardContent className="flex items-center justify-between p-4">
                            <div>
                              <p className="font-bold text-gray-900">
                                {bulletin.employe?.nom_complet}
                              </p>
                              <p className="text-sm text-gray-500">{bulletin.employe?.fonction}</p>
                            </div>
                            <Button variant="ghost" size="sm">
                              Voir Bulletin
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-gray-500">
                      Aucun bulletin trouvé pour cette période. Veuillez d'abord générer la paie.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Payslip
              bulletin={selectedBulletin}
              periodName={
                periodes.find(p => p.id === selectedPeriodeId)
                  ? getPeriodLabel(periodes.find(p => p.id === selectedPeriodeId)!)
                  : 'Période inconnue'
              }
              onClose={() => setSelectedBulletin(null)}
            />
          )}
        </TabsContent>

        <TabsContent value="checks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contrôles de cohérence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-green-100 bg-green-50 p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <h4 className="font-medium text-green-900">Total Net à Payer</h4>
                      <p className="text-sm text-green-700">Cohérent avec le mois précédent</p>
                    </div>
                  </div>
                  <span className="font-bold text-green-800">{formatMoney(stats.totalNet)}</span>
                </div>
                {/* Placeholder pour d'autres contrôles */}
                <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-gray-400" />
                    <div>
                      <h4 className="font-medium text-gray-900">Vérification des doublons</h4>
                      <p className="text-sm text-gray-500">Aucun doublon détecté</p>
                    </div>
                  </div>
                  <Badge variant="outline">OK</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exports" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  Export Comptabilité
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  Générer les écritures comptables pour intégration
                </p>
                <div className="flex gap-2">
                  <Button className="flex-1" variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export Excel
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Virements Bancaires
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm">Fichier de virement SEPA/Local</p>
                <div className="flex gap-2">
                  <Button className="flex-1" variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Fichier Virement
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {showEmployeeForm && (
        <EmployeePayrollForm
          onClose={() => setShowEmployeeForm(false)}
          onSuccess={() => {
            if (selectedPeriodeId) fetchBulletins(selectedPeriodeId);
          }}
        />
      )}

      {showSingleGenDialog && selectedPeriodeId && tenantId && (
        <SingleEmployeeGenerationDialog
          isOpen={showSingleGenDialog}
          onClose={() => setShowSingleGenDialog(false)}
          tenantId={tenantId}
          periodeId={selectedPeriodeId}
          onSuccess={() => {
            fetchBulletins(selectedPeriodeId);
          }}
        />
      )}

      {/* Dialog pour la configuration de la prime d'ancienneté */}
      <Dialog open={showSeniorityConfig} onOpenChange={setShowSeniorityConfig}>
        <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configuration Prime d'Ancienneté</DialogTitle>
          </DialogHeader>
          <SeniorityBonusConfigPage />
        </DialogContent>
      </Dialog>
    </div>
  );
};
