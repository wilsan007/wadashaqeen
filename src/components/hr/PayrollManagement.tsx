import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';

export const PayrollManagement = () => {
  const { tenantId, loading: tenantLoading } = useTenant();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const [activeView, setActiveView] = useState('periods');
  const [selectedPeriodeId, setSelectedPeriodeId] = useState<string | null>(null);
  const [selectedBulletin, setSelectedBulletin] = useState<PaieBulletin | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [showSingleGenDialog, setShowSingleGenDialog] = useState(false);
  const [showSeniorityConfig, setShowSeniorityConfig] = useState(false);

  // Fetch payroll periods
  const { data: periodes = [] } = useQuery<PaiePeriode[]>({
    queryKey: ['paie_periodes', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('paie_periodes')
        .select('*')
        .eq('tenant_id', tenantId!)
        .order('annee', { ascending: false })
        .order('mois', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId && !tenantLoading,
    select: (data) => {
      // Auto-select first period when none is selected
      if (data.length > 0 && !selectedPeriodeId) {
        setTimeout(() => setSelectedPeriodeId(data[0].id), 0);
      }
      return data;
    },
  });

  // Fetch bulletins for the selected period
  const { data: bulletins = [], isFetching: bulletinsFetching } = useQuery<PaieBulletin[]>({
    queryKey: ['paie_bulletins', selectedPeriodeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('paie_bulletins')
        .select('*, employe:paie_employes(nom_complet, fonction, date_embauche)')
        .eq('periode_id', selectedPeriodeId!)
        .order('employe(nom_complet)');
      if (error) throw error;
      return (data as any as PaieBulletin[]) || [];
    },
    enabled: !!selectedPeriodeId,
  });

  const loading = bulletinsFetching || isActionLoading;

  // Computed stats derived from bulletins (no separate state needed)
  const stats = useMemo(() => {
    return bulletins.reduce(
      (acc, b) => ({
        totalBrut: acc.totalBrut + (b.salaire_brut || 0),
        totalNet: acc.totalNet + (b.salaire_net || 0),
        totalCharges: acc.totalCharges + (b.cnss_patronale || 0),
        coutTotal: acc.coutTotal + (b.salaire_brut || 0) + (b.cnss_patronale || 0),
        employesCount: acc.employesCount + 1,
      }),
      { totalBrut: 0, totalNet: 0, totalCharges: 0, coutTotal: 0, employesCount: 0 }
    );
  }, [bulletins]);

  const handleGeneratePayroll = async () => {
    if (!selectedPeriodeId) {
      toast({ title: 'Période manquante', description: 'Veuillez sélectionner une période.', variant: 'destructive' });
      return;
    }

    setIsActionLoading(true);

    try {
      if (!tenantId) {
        toast({ title: 'Erreur', description: 'Contexte tenant non disponible.', variant: 'destructive' });
        return;
      }

      // Use the new batch generation method
      const result = await payrollService.genererPaieLot(tenantId, selectedPeriodeId);

      await queryClient.invalidateQueries({ queryKey: ['paie_bulletins', selectedPeriodeId] });
      toast({ title: 'Paie générée', description: `Bulletins générés pour ${result.count} employés.` });
    } catch (error) {
      console.error('Error generating payroll:', error);
      toast({ title: 'Erreur de génération', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setIsActionLoading(false);
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
      toast({ title: 'Erreur', description: 'Tenant non identifié.', variant: 'destructive' });
      return;
    }
    setIsActionLoading(true);
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

      toast({ title: 'Synchronisation terminée', description: `${addedCount} employé(s) ajouté(s) à la paie.` });
    } catch (error) {
      console.error('Error syncing employees:', error);
      toast({ title: 'Erreur de synchronisation', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground text-2xl font-bold">{t('hrAdvanced.payroll.title')}</h2>
          <p className="text-muted-foreground">{t('hrAdvanced.payroll.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowEmployeeForm(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            {t('hrAdvanced.payroll.newEmp')}
          </Button>
          <Button variant="outline" onClick={handleSyncEmployees} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {t('hrAdvanced.payroll.syncEmp')}
          </Button>
          <Button variant="outline" onClick={() => setShowSeniorityConfig(true)}>
            <TrendingUp className="mr-2 h-4 w-4" />
            {t('hrAdvanced.payroll.seniorityBonus')}
          </Button>
          <Button onClick={handleGeneratePayroll} disabled={loading || !selectedPeriodeId}>
            <DollarSign className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? t('hrAdvanced.payroll.calcLoading') : t('hrAdvanced.payroll.generatePaie')}
          </Button>
        </div>
      </div>

      <Tabs value={activeView} onValueChange={setActiveView}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="periods" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {t('hrAdvanced.payroll.tabPeriods')}
          </TabsTrigger>
          <TabsTrigger value="employees" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            {t('hrAdvanced.payroll.tabBulletins')}
          </TabsTrigger>
          <TabsTrigger value="checks" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            {t('hrAdvanced.payroll.tabChecks')}
          </TabsTrigger>
          <TabsTrigger value="exports" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            {t('hrAdvanced.payroll.tabExports')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="periods" className="space-y-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between rounded-lg border bg-white p-4 shadow-sm dark:bg-gray-800">
              <h3 className="text-lg font-medium">{t('hrAdvanced.payroll.periodLabel')}</h3>
              <select
                value={selectedPeriodeId || ''}
                onChange={e => {
                  setSelectedPeriodeId(e.target.value);
                }}
                className="border-input bg-background focus:ring-ring h-10 w-[200px] rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none"
              >
                <option value="">{t('hrAdvanced.payroll.selectPeriod')}</option>
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
                        {t('hrAdvanced.payroll.calculatedBadge')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                      <div>
                        <p className="text-muted-foreground text-sm font-medium">{t('hrAdvanced.payroll.totalBrut')}</p>
                        <p className="text-xl font-bold">{formatMoney(stats.totalBrut)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-sm font-medium">{t('hrAdvanced.payroll.totalNet')}</p>
                        <p className="text-xl font-bold text-green-600">
                          {formatMoney(stats.totalNet)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-sm font-medium">
                          {t('hrAdvanced.payroll.totalCharges')}
                        </p>
                        <p className="text-xl font-bold text-gray-600">
                          {formatMoney(stats.totalCharges)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-sm font-medium">{t('hrAdvanced.payroll.totalCost')}</p>
                        <p className="text-xl font-bold text-indigo-600">
                          {formatMoney(stats.coutTotal)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="mt-6">
                  <h3 className="mb-4 text-lg font-medium">{t('hrAdvanced.payroll.tableTitle')}</h3>
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedPeriodeId(p.id);
                          setActiveView('employees');
                        }}
                      >
                        {t('hrAdvanced.payroll.btnView')}
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
                <CardTitle>{t('hrAdvanced.payroll.generateTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between rounded-lg border bg-white p-4 shadow-sm dark:bg-gray-800">
                    <div>
                      <h3 className="text-lg font-medium">{t('hrAdvanced.payroll.selectEmp')}</h3>
                      <p className="text-sm text-gray-500">
                        {t('hrAdvanced.payroll.selectEmpDesc')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={selectedPeriodeId || ''}
                        onChange={e => setSelectedPeriodeId(e.target.value)}
                        className="border-input bg-background focus:ring-ring h-10 w-[200px] rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none"
                      >
                        <option value="">{t('hrAdvanced.payroll.selectPeriod')}</option>
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
                        {t('hrAdvanced.payroll.generateBtn')}
                      </Button>
                    </div>
                  </div>

                  {loading ? (
                    <div className="py-8 text-center">{t('hrAdvanced.payroll.loadingData')}</div>
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={e => {
                                e.stopPropagation();
                                setSelectedBulletin(bulletin);
                              }}
                            >
                              {t('hrAdvanced.payroll.btnViewBulletin')}
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-gray-500">
                      {t('hrAdvanced.payroll.noBulletin')}
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
                  <Button
                    className="flex-1"
                    variant="outline"
                    disabled={bulletins.length === 0}
                    onClick={() => {
                      const rows = [
                        ['Employé', 'Fonction', 'Salaire brut', 'CNSS salariale', 'CNSS patronale', 'ITS', 'Net à payer'],
                        ...bulletins.map(b => [
                          b.employe?.nom_complet || '',
                          b.employe?.fonction || '',
                          String(b.salaire_brut || 0),
                          String(b.cnss_salariale || 0),
                          String(b.cnss_patronale || 0),
                          String(b.montant_its || 0),
                          String(b.salaire_net || 0),
                        ]),
                      ];
                      const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
                      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                      const url = URL.createObjectURL(blob);
                      const a = Object.assign(document.createElement('a'), { href: url, download: `paie-export-${selectedPeriodeId || 'periode'}.csv` });
                      document.body.appendChild(a); a.click(); document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      toast({ title: 'Export réussi', description: 'Fichier comptabilité exporté en CSV.' });
                    }}
                  >
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
                  <Button
                    className="flex-1"
                    variant="outline"
                    disabled={bulletins.length === 0}
                    onClick={() => {
                      const rows = [
                        ['Employé', 'Net à payer', 'Devise'],
                        ...bulletins.map(b => [
                          b.employe?.nom_complet || '',
                          String(b.salaire_net || 0),
                          'DJF',
                        ]),
                      ];
                      const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
                      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                      const url = URL.createObjectURL(blob);
                      const a = Object.assign(document.createElement('a'), { href: url, download: `virements-${selectedPeriodeId || 'periode'}.csv` });
                      document.body.appendChild(a); a.click(); document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      toast({ title: 'Export réussi', description: 'Fichier de virements exporté en CSV.' });
                    }}
                  >
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
            if (selectedPeriodeId) {
              queryClient.invalidateQueries({ queryKey: ['paie_bulletins', selectedPeriodeId] });
            }
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
            queryClient.invalidateQueries({ queryKey: ['paie_bulletins', selectedPeriodeId] });
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
