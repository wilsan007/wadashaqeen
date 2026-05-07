import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PaiePeriode, PaieBulletin } from '../../types/payroll';
import { payrollService } from '../../services/payrollService';
import { PayrollDetails } from './PayrollDetails';
import { EmployeePayrollForm } from './EmployeePayrollForm';
import { toast } from '@/hooks/use-toast';

export const PayrollList: React.FC = () => {
  const [periodes, setPeriodes] = useState<PaiePeriode[]>([]);
  const [selectedPeriode, setSelectedPeriode] = useState<string | null>(null);
  const [bulletins, setBulletins] = useState<PaieBulletin[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBulletin, setSelectedBulletin] = useState<PaieBulletin | null>(null);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);

  useEffect(() => {
    fetchPeriodes();
  }, []);

  useEffect(() => {
    if (selectedPeriode) {
      fetchBulletins(selectedPeriode);
    }
  }, [selectedPeriode]);

  const fetchPeriodes = async () => {
    const { data } = await supabase
      .from('paie_periodes')
      .select('*')
      .order('annee', { ascending: false })
      .order('mois', { ascending: false });

    if (data) {
      setPeriodes(data);
      if (data.length > 0 && !selectedPeriode) {
        setSelectedPeriode(data[0].id);
      }
    }
  };

  const fetchBulletins = async (periodeId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('paie_bulletins')
      .select('*, employe:paie_employes(nom_complet, fonction)')
      .eq('periode_id', periodeId)
      .order('employe(nom_complet)'); // Tri par nom

    if (data) {
      setBulletins(data as any); // Cast temporaire si les types générés ne sont pas parfaits
    }
    setLoading(false);
  };

  const handleGeneratePayroll = async () => {
    if (!selectedPeriode) return;
    setLoading(true);
    try {
      const { data: employees } = await supabase.from('paie_employes').select('id');
      if (!employees) return;

      for (const emp of employees) {
        await payrollService.genererBulletin(emp.id, selectedPeriode);
      }

      await fetchBulletins(selectedPeriode);
      toast({ title: 'Paie générée', description: 'Les bulletins ont été générés avec succès.' });
    } catch (error) {
      console.error(error);
      toast({ title: 'Erreur', description: 'Erreur lors de la génération de la paie.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Helper pour formater les montants
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('fr-DJ', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calcul des totaux
  const totals = bulletins.reduce(
    (acc, b) => ({
      base: acc.base + (b.salaire_base || 0),
      p_fonc: acc.p_fonc + (b.prime_fonction || 0),
      p_resp: acc.p_resp + (b.prime_responsabilite || 0),
      p_spec: acc.p_spec + (b.prime_specifique || 0),
      p_forf: acc.p_forf + (b.prime_forfaitaire || 0),
      abs: acc.abs + (b.total_retenues_absences || 0),
      brut: acc.brut + (b.salaire_brut || 0),
      cnss_sal: acc.cnss_sal + (b.cnss_salariale || 0),
      cnss_pat: acc.cnss_pat + (b.cnss_patronale || 0),
      imposable: acc.imposable + (b.salaire_imposable || 0),
      its: acc.its + (b.montant_its || 0),
      transp: acc.transp + (b.prime_transport || 0),
      log: acc.log + (b.prime_logement || 0),
      waqf: acc.waqf + (b.retenue_waqf || 0),
      avance: acc.avance + (b.retenue_avance || 0),
      net: acc.net + (b.salaire_net || 0),
    }),
    {
      base: 0,
      p_fonc: 0,
      p_resp: 0,
      p_spec: 0,
      p_forf: 0,
      abs: 0,
      brut: 0,
      cnss_sal: 0,
      cnss_pat: 0,
      imposable: 0,
      its: 0,
      transp: 0,
      log: 0,
      waqf: 0,
      avance: 0,
      net: 0,
    }
  );

  return (
    <div className="min-h-screen space-y-6 bg-gray-50 p-6 dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            État des Salaires
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">Gestion mensuelle de la paie</p>
        </div>

        <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-2 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <button
            onClick={() => setShowEmployeeForm(true)}
            className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
          >
            <span>+</span> Employé
          </button>

          <div className="mx-2 h-6 w-px bg-gray-300 dark:bg-gray-600"></div>

          <select
            className="rounded-md border-gray-300 bg-gray-50 py-2 pr-8 pl-3 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            value={selectedPeriode || ''}
            onChange={e => setSelectedPeriode(e.target.value)}
          >
            {periodes.map(p => (
              <option key={p.id} value={p.id}>
                {new Date(p.annee, p.mois - 1).toLocaleString('fr-FR', {
                  month: 'long',
                  year: 'numeric',
                })}
              </option>
            ))}
          </select>

          <button
            onClick={handleGeneratePayroll}
            disabled={loading || !selectedPeriode}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Calcul en cours...' : 'Calculer la Paie'}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-xs dark:divide-gray-700">
            <thead className="bg-gray-100 dark:bg-gray-900">
              <tr>
                <th
                  scope="col"
                  className="sticky top-0 left-0 z-20 border-r border-gray-200 bg-gray-100 px-3 py-4 text-left font-bold tracking-wider text-gray-500 uppercase shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400"
                >
                  N°
                </th>
                <th
                  scope="col"
                  className="sticky top-0 left-[40px] z-20 min-w-[180px] border-r border-gray-200 bg-gray-100 px-3 py-4 text-left font-bold tracking-wider text-gray-500 uppercase shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400"
                >
                  Nom de l'employé
                </th>
                <th
                  scope="col"
                  className="min-w-[120px] px-3 py-4 text-left font-bold tracking-wider text-gray-500 uppercase dark:text-gray-400"
                >
                  Fonction
                </th>
                <th
                  scope="col"
                  className="bg-blue-50/50 px-3 py-4 text-right font-bold tracking-wider text-gray-500 uppercase dark:bg-blue-900/20 dark:text-gray-400"
                >
                  Salaire Base
                </th>
                <th
                  scope="col"
                  className="px-3 py-4 text-right font-bold tracking-wider text-gray-500 uppercase dark:text-gray-400"
                >
                  Pr. Fonction
                </th>
                <th
                  scope="col"
                  className="bg-indigo-50/30 px-3 py-4 text-right font-bold tracking-wider text-indigo-600 uppercase dark:bg-indigo-900/10 dark:text-indigo-400"
                >
                  Pr. Resp.
                </th>
                <th
                  scope="col"
                  className="px-3 py-4 text-right font-bold tracking-wider text-gray-500 uppercase dark:text-gray-400"
                >
                  Pr. Spéc.
                </th>
                <th
                  scope="col"
                  className="px-3 py-4 text-right font-bold tracking-wider text-gray-500 uppercase dark:text-gray-400"
                >
                  Pr. Forfait
                </th>
                <th
                  scope="col"
                  className="px-3 py-4 text-right font-bold tracking-wider text-red-500 uppercase dark:text-red-400"
                >
                  Ret. ABS
                </th>
                <th
                  scope="col"
                  className="border-x border-gray-200 bg-gray-50 px-3 py-4 text-right font-bold tracking-wider text-gray-900 uppercase dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                >
                  Salaire Brut
                </th>
                <th
                  scope="col"
                  className="px-3 py-4 text-right font-bold tracking-wider text-gray-500 uppercase dark:text-gray-400"
                >
                  CNSS (6%)
                </th>
                <th
                  scope="col"
                  className="px-3 py-4 text-right text-[10px] font-bold tracking-wider text-gray-400 uppercase dark:text-gray-500"
                >
                  CNSS Pat. (15.7%)
                </th>
                <th
                  scope="col"
                  className="px-3 py-4 text-right font-bold tracking-wider text-gray-500 uppercase dark:text-gray-400"
                >
                  Imposable
                </th>
                <th
                  scope="col"
                  className="px-3 py-4 text-right font-bold tracking-wider text-red-600 uppercase dark:text-red-400"
                >
                  ITS
                </th>
                <th
                  scope="col"
                  className="px-3 py-4 text-right font-bold tracking-wider text-gray-500 uppercase dark:text-gray-400"
                >
                  Pr. Transp.
                </th>
                <th
                  scope="col"
                  className="px-3 py-4 text-right font-bold tracking-wider text-gray-500 uppercase dark:text-gray-400"
                >
                  Pr. Log.
                </th>
                <th
                  scope="col"
                  className="px-3 py-4 text-right font-bold tracking-wider text-gray-500 uppercase dark:text-gray-400"
                >
                  Waqf
                </th>
                <th
                  scope="col"
                  className="px-3 py-4 text-right font-bold tracking-wider text-red-500 uppercase dark:text-red-400"
                >
                  Avance
                </th>
                <th
                  scope="col"
                  className="min-w-[100px] bg-green-600 px-3 py-4 text-right font-bold tracking-wider text-white uppercase"
                >
                  Salaire Net
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
              {bulletins.map((b, idx) => (
                <tr
                  key={b.id}
                  className="group transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="sticky left-0 z-10 border-r border-gray-200 bg-white px-3 py-3 text-center whitespace-nowrap text-gray-500 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] group-hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:group-hover:bg-gray-700/50">
                    {idx + 1}
                  </td>
                  <td
                    className="sticky left-[40px] z-10 cursor-pointer border-r border-gray-200 bg-white px-3 py-3 font-medium whitespace-nowrap text-gray-900 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] group-hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:group-hover:bg-gray-700/50"
                    onClick={() => setSelectedBulletin(b)}
                  >
                    {b.employe?.nom_complet}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-gray-500 dark:text-gray-400">
                    {b.employe?.fonction}
                  </td>
                  <td className="bg-blue-50/30 px-3 py-3 text-right font-mono whitespace-nowrap text-gray-900 dark:bg-blue-900/10 dark:text-gray-300">
                    {formatMoney(b.salaire_base)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono whitespace-nowrap text-gray-500 dark:text-gray-400">
                    {b.prime_fonction > 0 ? formatMoney(b.prime_fonction) : '-'}
                  </td>
                  <td className="bg-indigo-50/10 px-3 py-3 text-right font-mono font-medium whitespace-nowrap text-indigo-600 dark:bg-indigo-900/5 dark:text-indigo-400">
                    {b.prime_responsabilite > 0 ? formatMoney(b.prime_responsabilite) : '-'}
                  </td>
                  <td className="px-3 py-3 text-right font-mono whitespace-nowrap text-gray-500 dark:text-gray-400">
                    {b.prime_specifique > 0 ? formatMoney(b.prime_specifique) : '-'}
                  </td>
                  <td className="px-3 py-3 text-right font-mono whitespace-nowrap text-gray-500 dark:text-gray-400">
                    {b.prime_forfaitaire > 0 ? formatMoney(b.prime_forfaitaire) : '-'}
                  </td>
                  <td className="px-3 py-3 text-right font-mono whitespace-nowrap text-red-500 dark:text-red-400">
                    {b.total_retenues_absences > 0 ? formatMoney(b.total_retenues_absences) : '-'}
                  </td>
                  <td className="border-x border-gray-200 bg-gray-50 px-3 py-3 text-right font-mono font-bold whitespace-nowrap text-gray-900 dark:border-gray-700 dark:bg-gray-700/50 dark:text-white">
                    {formatMoney(b.salaire_brut)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono whitespace-nowrap text-gray-600 dark:text-gray-300">
                    {formatMoney(b.cnss_salariale)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-[11px] whitespace-nowrap text-gray-400 italic dark:text-gray-500">
                    {formatMoney(b.cnss_patronale)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono whitespace-nowrap text-gray-600 dark:text-gray-300">
                    {formatMoney(b.salaire_imposable)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-medium whitespace-nowrap text-red-600 dark:text-red-400">
                    {formatMoney(b.montant_its)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono whitespace-nowrap text-gray-500 dark:text-gray-400">
                    {b.prime_transport > 0 ? formatMoney(b.prime_transport) : '-'}
                  </td>
                  <td className="px-3 py-3 text-right font-mono whitespace-nowrap text-gray-500 dark:text-gray-400">
                    {b.prime_logement > 0 ? formatMoney(b.prime_logement) : '-'}
                  </td>
                  <td className="px-3 py-3 text-right font-mono whitespace-nowrap text-gray-500 dark:text-gray-400">
                    {b.retenue_waqf > 0 ? formatMoney(b.retenue_waqf) : '-'}
                  </td>
                  <td className="px-3 py-3 text-right font-mono whitespace-nowrap text-red-500 dark:text-red-400">
                    {b.retenue_avance > 0 ? formatMoney(b.retenue_avance) : '-'}
                  </td>
                  <td className="border-l-2 border-green-500 bg-green-50 px-3 py-3 text-right font-mono text-sm font-bold whitespace-nowrap text-green-700 dark:bg-green-900/20 dark:text-green-400">
                    {formatMoney(b.salaire_net)}
                  </td>
                </tr>
              ))}
              {bulletins.length > 0 && (
                <tr className="border-t-2 border-gray-300 bg-gray-100 font-bold dark:border-gray-600 dark:bg-gray-900">
                  <td
                    colSpan={3}
                    className="sticky left-0 z-10 border-r border-gray-300 bg-gray-100 px-3 py-4 text-center text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                  >
                    TOTAUX
                  </td>
                  <td className="px-3 py-4 text-right font-mono text-gray-900 dark:text-white">
                    {formatMoney(totals.base)}
                  </td>
                  <td className="px-3 py-4 text-right font-mono text-gray-900 dark:text-white">
                    {formatMoney(totals.p_fonc)}
                  </td>
                  <td className="px-3 py-4 text-right font-mono text-indigo-700 dark:text-indigo-400">
                    {formatMoney(totals.p_resp)}
                  </td>
                  <td className="px-3 py-4 text-right font-mono text-gray-900 dark:text-white">
                    {formatMoney(totals.p_spec)}
                  </td>
                  <td className="px-3 py-4 text-right font-mono text-gray-900 dark:text-white">
                    {formatMoney(totals.p_forf)}
                  </td>
                  <td className="px-3 py-4 text-right font-mono text-red-600 dark:text-red-400">
                    {formatMoney(totals.abs)}
                  </td>
                  <td className="border-x border-gray-300 bg-gray-200 px-3 py-4 text-right font-mono text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                    {formatMoney(totals.brut)}
                  </td>
                  <td className="px-3 py-4 text-right font-mono text-gray-900 dark:text-white">
                    {formatMoney(totals.cnss_sal)}
                  </td>
                  <td className="px-3 py-4 text-right font-mono text-[11px] text-gray-500 dark:text-gray-400">
                    {formatMoney(totals.cnss_pat)}
                  </td>
                  <td className="px-3 py-4 text-right font-mono text-gray-900 dark:text-white">
                    {formatMoney(totals.imposable)}
                  </td>
                  <td className="px-3 py-4 text-right font-mono text-red-700 dark:text-red-400">
                    {formatMoney(totals.its)}
                  </td>
                  <td className="px-3 py-4 text-right font-mono text-gray-900 dark:text-white">
                    {formatMoney(totals.transp)}
                  </td>
                  <td className="px-3 py-4 text-right font-mono text-gray-900 dark:text-white">
                    {formatMoney(totals.log)}
                  </td>
                  <td className="px-3 py-4 text-right font-mono text-gray-900 dark:text-white">
                    {formatMoney(totals.waqf)}
                  </td>
                  <td className="px-3 py-4 text-right font-mono text-red-600 dark:text-red-400">
                    {formatMoney(totals.avance)}
                  </td>
                  <td className="border-l-2 border-green-700 bg-green-600 px-3 py-4 text-right font-mono text-white">
                    {formatMoney(totals.net)}
                  </td>
                </tr>
              )}
              {bulletins.length === 0 && (
                <tr>
                  <td
                    colSpan={19}
                    className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <svg
                        className="mb-4 h-12 w-12 text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <p className="text-lg font-medium">
                        Aucun bulletin généré pour cette période.
                      </p>
                      <p className="mt-2 text-sm">
                        Sélectionnez une autre période ou générez la paie.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedBulletin && (
        <PayrollDetails bulletin={selectedBulletin} onClose={() => setSelectedBulletin(null)} />
      )}

      {showEmployeeForm && (
        <EmployeePayrollForm
          onClose={() => setShowEmployeeForm(false)}
          onSuccess={() => {
            if (selectedPeriode) fetchBulletins(selectedPeriode);
          }}
        />
      )}
    </div>
  );
};
