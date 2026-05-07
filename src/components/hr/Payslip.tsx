import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { PaieBulletin } from '../../types/payroll';
import { supabase } from '@/integrations/supabase/client';

interface PayslipProps {
  bulletin: PaieBulletin;
  periodName: string;
  onClose?: () => void;
}

export const Payslip: React.FC<PayslipProps> = ({
  bulletin: initialBulletin,
  periodName,
  onClose,
}) => {
  const componentRef = useRef<HTMLDivElement>(null);
  const [bulletin, setBulletin] = useState<PaieBulletin>(initialBulletin);

  // Fallback: Fetch employee details if missing date_embauche needed for bonus display
  useEffect(() => {
    const fetchMissingDetails = async () => {
      // Check if we need more info (missing date_embauche)
      if (!bulletin.employe?.date_embauche && bulletin.employe_id) {
        try {
          // 1. Try paie_employes first
          let { data: rawEmp, error } = await supabase
            .from('paie_employes')
            .select('date_embauche, user_id')
            .eq('id', bulletin.employe_id)
            .single();

          // Cast to avoid TS errors
          let emp = rawEmp as { date_embauche: string | null; user_id: string | null } | null;

          // 2. If not found or null, try employees table via user_id
          if (!emp?.date_embauche && emp?.user_id) {
            const { data: userEmp } = await supabase
              .from('employees')
              .select('hire_date')
              .eq('id', emp.user_id)
              .single();

            if (userEmp?.hire_date) {
              // Use hire_date as date_embauche
              emp = { ...emp, date_embauche: userEmp.hire_date };
            }
          }

          if (emp && emp.date_embauche) {
            setBulletin(prev => ({
              ...prev,
              employe: {
                ...prev.employe!,
                date_embauche: emp.date_embauche,
              },
            }));
          }
        } catch (e) {
          console.error('Error fetching extra details:', e);
        }
      }
    };

    // Always try to update state if props change
    if (initialBulletin !== bulletin) {
      setBulletin(initialBulletin);
    }

    fetchMissingDetails();
  }, [initialBulletin.id, initialBulletin.employe_id]); // Re-run if bulletin ID changes

  const handlePrint = () => {
    const printContent = componentRef.current;
    if (printContent) {
      const originalContents = document.body.innerHTML;
      const printContents = printContent.innerHTML;

      // Create a temporary container for printing to preserve styles
      const printWindow = window.open('', '', 'height=800,width=1000');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Bulletin de Paie</title>');
        // Add Tailwind CDN for printing if local styles don't carry over easily,
        // or copy relevant styles. For a robust solution in this environment,
        // we'll inject the specific CSS provided by the user + Tailwind basics.
        printWindow.document.write(`
          <style>
            body { font-family: 'Arial', sans-serif; margin: 0; padding: 20px; background-color: white; }
            .bulletin-paie { width: 100%; max-width: 800px; margin: 0 auto; padding: 30px; border: 1px solid #eee; }
            header { display: flex; justify-content: space-between; padding-bottom: 10px; border-bottom: 3px solid #003366; margin-bottom: 20px; }
            .header-left h1 { font-size: 1.5em; margin: 0; color: #333; }
            .header-right h2 { color: #003366; margin: 0; font-size: 1.8em; text-align: right; }
            .header-right p, .header-left p { margin: 5px 0; color: #666; font-size: 0.9em; }
            
            h3 { background-color: #e9e9e9; padding: 8px 10px; margin-top: 20px; margin-bottom: 10px; font-size: 1.1em; border-left: 5px solid #003366; color: #333; }
            
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
            .info-grid p { margin: 5px 0; font-size: 0.95em; }
            
            table { width: 100%; border-collapse: collapse; font-size: 0.9em; margin-bottom: 20px; }
            th { background-color: #003366; color: white; padding: 8px; text-align: left; }
            td { border-bottom: 1px solid #ddd; padding: 8px; color: #333; }
            td:nth-child(4) { text-align: right; font-weight: bold; }
            .accent td { background-color: #f0f8ff; }
            .total-line td { border-top: 2px solid #003366; font-weight: bold; background-color: #fafafa; }
            
            .section-synthese { margin-top: 30px; }
            .synthese-grid { display: grid; grid-template-columns: 1fr 1fr; border: 1px solid #ccc; padding: 15px; background-color: #f9f9f9; }
            .synthese-grid p { margin: 5px 0; }
            .synthese-grid p:nth-child(odd) { font-weight: bold; color: #003366; }
            .synthese-grid p:nth-child(even) { text-align: right; }
            
            .net-a-payer { margin-top: 30px; text-align: right; border-top: 3px double #003366; padding-top: 15px; }
            .montant-final { font-size: 2em; font-weight: bold; color: #d9534f; margin: 10px 0; }
            .lettres { font-style: italic; font-size: 0.9em; color: #666; }
            .mention { font-size: 0.8em; color: #999; margin-top: 20px; }
            
            @media print {
              body { background-color: white; -webkit-print-color-adjust: exact; }
              .no-print { display: none; }
            }
          </style>
        `);
        printWindow.document.write('</head><body>');
        printWindow.document.write(printContent.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('fr-DJ', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Helper to convert number to words (simplified for now, ideally use a library)
  const numberToWords = (num: number) => {
    // Placeholder for number to words conversion
    return 'Montant en toutes lettres à implémenter';
  };

  const currentDate = new Date().toLocaleDateString('fr-FR');
  // periodName is now passed as prop

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-100 p-2 md:p-8 dark:bg-gray-900">
      <div className="no-print mb-4 flex w-full max-w-[850px] items-center justify-between print:hidden">
        <Button variant="outline" onClick={onClose}>
          Retour
        </Button>
        <Button onClick={handlePrint} className="bg-[#003366] hover:bg-[#002244]">
          <Printer className="mr-2 h-4 w-4" />
          Imprimer / PDF
        </Button>
      </div>

      <div
        ref={componentRef}
        className="min-h-[1100px] w-full max-w-[850px] overflow-x-auto bg-white p-4 text-black shadow-2xl md:p-10 print:m-0 print:w-full print:max-w-none print:p-0 print:shadow-none"
      >
        <div className="bulletin-paie min-w-[600px] md:min-w-0 print:w-full print:min-w-0">
          <header className="mb-6 flex flex-col justify-between gap-4 border-b-[3px] border-[#003366] pb-4 md:flex-row">
            <div className="header-left">
              <h1 className="text-xl font-bold text-gray-800 uppercase md:text-2xl">WADASHAQEEN</h1>
              <p className="mt-1 text-sm text-gray-600">Adresse : Djibouti, Zone Industrielle</p>
              <p className="text-sm text-gray-600">Convention Collective : Commerce</p>
            </div>
            <div className="header-right text-left md:text-right">
              <h2 className="m-0 text-xl font-bold text-[#003366] md:text-2xl">BULLETIN DE PAIE</h2>
              <p className="mt-1 text-sm text-gray-600">
                Période : <strong>{periodName}</strong>
              </p>
              <p className="text-sm text-gray-600">Date de Paiement : {currentDate}</p>
            </div>
          </header>

          <section className="info-salarie mb-6">
            {/* DEBUG DATA - Will be removed later */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mb-4 hidden bg-yellow-100 p-2 font-mono text-xs text-black">
                DEBUG: Date Embauche: {String(bulletin.employe?.date_embauche)}
                <br />
                DEBUG: Prime: {bulletin.prime_anciennete}
              </div>
            )}

            <h3 className="mb-3 border-l-[5px] border-[#003366] bg-[#e9e9e9] px-3 py-2 text-[1.1em] font-bold text-gray-800">
              INFORMATIONS SALARIÉ
            </h3>
            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              <p>
                <strong>Nom & Prénom :</strong> {bulletin.employe?.nom_complet}
              </p>
              <p>
                <strong>Fonction :</strong> {bulletin.employe?.fonction}
              </p>
              <p>
                <strong>N° Matricule :</strong> {bulletin.employe_id.substring(0, 6).toUpperCase()}
              </p>
              {bulletin.employe?.date_embauche && (
                <p>
                  <strong>Date d'embauche :</strong>{' '}
                  {new Date(bulletin.employe.date_embauche).toLocaleDateString('fr-FR')}
                </p>
              )}
              <p>
                <strong>Statut :</strong> Cadre
              </p>
            </div>
          </section>

          <section className="section-table mb-6">
            <h3 className="mb-3 border-l-[5px] border-[#003366] bg-[#e9e9e9] px-3 py-2 text-[1.1em] font-bold text-gray-800">
              1. ÉLÉMENTS DE LA RÉMUNÉRATION BRUTE (GAINS)
            </h3>
            <table className="w-full border-collapse text-[0.9em]">
              <thead>
                <tr>
                  <th className="bg-[#003366] p-2 text-left text-white">Désignation</th>
                  <th className="bg-[#003366] p-2 text-left text-white">Base de Calcul</th>
                  <th className="bg-[#003366] p-2 text-left text-white">Taux</th>
                  <th className="bg-[#003366] p-2 text-right text-white">À Payer (Gains)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border-b border-gray-300 p-2">Salaire de Base</td>
                  <td className="border-b border-gray-300 p-2">
                    {formatMoney(bulletin.salaire_base)}
                  </td>
                  <td className="border-b border-gray-300 p-2"></td>
                  <td className="border-b border-gray-300 p-2 text-right font-bold">
                    {formatMoney(bulletin.salaire_base)}
                  </td>
                </tr>

                {/* Prime d'Ancienneté avec calcul détaillé */}
                {!!bulletin.employe?.date_embauche && (
                  <tr className="bg-purple-50">
                    <td className="border-b border-gray-300 p-2">
                      <div className="font-semibold text-purple-700">Prime d'Ancienneté</div>
                      <div className="mt-1 text-xs text-gray-600">
                        Embauché le:{' '}
                        {new Date(bulletin.employe.date_embauche).toLocaleDateString('fr-FR')}
                      </div>
                    </td>
                    <td className="border-b border-gray-300 p-2">
                      <div className="text-sm">
                        {formatMoney(bulletin.salaire_base)}
                        {(() => {
                          const hireDate = new Date(bulletin.employe.date_embauche!);
                          const today = new Date();
                          const years = Math.floor(
                            (today.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
                          );
                          const months =
                            Math.floor(
                              (today.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
                            ) % 12;
                          return (
                            <div className="mt-1 text-xs text-gray-600">
                              Ancienneté: {years} an{years > 1 ? 's' : ''}
                              {months > 0 ? ` et ${months} mois` : ''}
                            </div>
                          );
                        })()}
                      </div>
                    </td>
                    <td className="border-b border-gray-300 p-2">
                      {(() => {
                        const bonus = bulletin.prime_anciennete || 0;
                        const rate =
                          bonus > 0
                            ? ((bonus / bulletin.salaire_base) * 100).toFixed(1) + '%'
                            : '0%';
                        return <div className="text-sm font-medium text-purple-700">{rate}</div>;
                      })()}
                    </td>
                    <td className="border-b border-gray-300 p-2 text-right font-bold text-purple-700">
                      {formatMoney(bulletin.prime_anciennete || 0)}
                    </td>
                  </tr>
                )}

                {bulletin.prime_specifique > 0 && (
                  <tr>
                    <td className="border-b border-gray-300 p-2">Prime Spécifique</td>
                    <td className="border-b border-gray-300 p-2"></td>
                    <td className="border-b border-gray-300 p-2"></td>
                    <td className="border-b border-gray-300 p-2 text-right font-bold">
                      {formatMoney(bulletin.prime_specifique)}
                    </td>
                  </tr>
                )}
                {bulletin.prime_responsabilite > 0 && (
                  <tr className="bg-[#f0f8ff]">
                    <td className="border-b border-gray-300 p-2">
                      Prime de Responsabilité (Nouvelle)
                    </td>
                    <td className="border-b border-gray-300 p-2"></td>
                    <td className="border-b border-gray-300 p-2"></td>
                    <td className="border-b border-gray-300 p-2 text-right font-bold">
                      {formatMoney(bulletin.prime_responsabilite)}
                    </td>
                  </tr>
                )}

                {bulletin.prime_fonction > 0 && (
                  <tr>
                    <td className="border-b border-gray-300 p-2">Prime de Fonction</td>
                    <td className="border-b border-gray-300 p-2"></td>
                    <td className="border-b border-gray-300 p-2"></td>
                    <td className="border-b border-gray-300 p-2 text-right font-bold">
                      {formatMoney(bulletin.prime_fonction)}
                    </td>
                  </tr>
                )}
                <tr className="border-t-2 border-[#003366] bg-[#fafafa] font-bold">
                  <td className="p-2">TOTAL BRUT</td>
                  <td className="p-2"></td>
                  <td className="p-2"></td>
                  <td className="p-2 text-right">{formatMoney(bulletin.salaire_brut)}</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className="section-table mb-6">
            <h3 className="mb-3 border-l-[5px] border-[#003366] bg-[#e9e9e9] px-3 py-2 text-[1.1em] font-bold text-gray-800">
              2. COTISATIONS ET DÉDUCTIONS (Part Salariale)
            </h3>
            <table className="w-full border-collapse text-[0.9em]">
              <thead>
                <tr>
                  <th className="bg-[#003366] p-2 text-left text-white">Libellé</th>
                  <th className="bg-[#003366] p-2 text-left text-white">Base Imposable</th>
                  <th className="bg-[#003366] p-2 text-left text-white">Taux Salarial</th>
                  <th className="bg-[#003366] p-2 text-right text-white">À Déduire (Retenues)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-[#f0f8ff]">
                  <td className="border-b border-gray-300 p-2">CNSS (Part Salariale)</td>
                  <td className="border-b border-gray-300 p-2">
                    {formatMoney(bulletin.salaire_brut)}
                  </td>
                  <td className="border-b border-gray-300 p-2">6,00%</td>
                  <td className="border-b border-gray-300 p-2 text-right font-bold">
                    {formatMoney(bulletin.cnss_salariale)}
                  </td>
                </tr>
                <tr>
                  <td className="border-b border-gray-300 p-2">
                    Impôt sur les Traitements et Salaires (ITS)
                  </td>
                  <td className="border-b border-gray-300 p-2">
                    {formatMoney(bulletin.salaire_imposable)}
                  </td>
                  <td className="border-b border-gray-300 p-2">[Barème]</td>
                  <td className="border-b border-gray-300 p-2 text-right font-bold">
                    {formatMoney(bulletin.montant_its)}
                  </td>
                </tr>
                {bulletin.retenue_waqf > 0 && (
                  <tr>
                    <td className="border-b border-gray-300 p-2">Retenue Waqf</td>
                    <td className="border-b border-gray-300 p-2"></td>
                    <td className="border-b border-gray-300 p-2"></td>
                    <td className="border-b border-gray-300 p-2 text-right font-bold">
                      {formatMoney(bulletin.retenue_waqf)}
                    </td>
                  </tr>
                )}
                {bulletin.retenue_avance > 0 && (
                  <tr>
                    <td className="border-b border-gray-300 p-2">Retenue Avance Salaire</td>
                    <td className="border-b border-gray-300 p-2"></td>
                    <td className="border-b border-gray-300 p-2"></td>
                    <td className="border-b border-gray-300 p-2 text-right font-bold">
                      {formatMoney(bulletin.retenue_avance)}
                    </td>
                  </tr>
                )}
                {bulletin.retenue_pret && bulletin.retenue_pret > 0 && (
                  <tr>
                    <td className="border-b border-gray-300 p-2">Retenue Prêt</td>
                    <td className="border-b border-gray-300 p-2"></td>
                    <td className="border-b border-gray-300 p-2"></td>
                    <td className="border-b border-gray-300 p-2 text-right font-bold">
                      {formatMoney(bulletin.retenue_pret)}
                    </td>
                  </tr>
                )}
                {bulletin.total_retenues_absences > 0 && (
                  <tr>
                    <td className="border-b border-gray-300 p-2">Retenue Absences</td>
                    <td className="border-b border-gray-300 p-2"></td>
                    <td className="border-b border-gray-300 p-2"></td>
                    <td className="border-b border-gray-300 p-2 text-right font-bold">
                      {formatMoney(bulletin.total_retenues_absences)}
                    </td>
                  </tr>
                )}
                <tr className="border-t-2 border-[#003366] bg-[#fafafa] font-bold">
                  <td className="p-2">TOTAL DES RETENUES</td>
                  <td className="p-2"></td>
                  <td className="p-2"></td>
                  <td className="p-2 text-right">
                    {formatMoney(
                      (bulletin.cnss_salariale || 0) +
                        (bulletin.montant_its || 0) +
                        (bulletin.retenue_waqf || 0) +
                        (bulletin.retenue_avance || 0) +
                        (bulletin.retenue_pret || 0) +
                        (bulletin.total_retenues_absences || 0)
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {(bulletin.prime_transport > 0 || bulletin.prime_logement > 0) && (
            <section className="section-table mb-6">
              <h3 className="mb-3 border-l-[5px] border-[#003366] bg-[#e9e9e9] px-3 py-2 text-[1.1em] font-bold text-gray-800">
                3. INDEMNITÉS NON SOUMISES
              </h3>
              <table className="w-full border-collapse text-[0.9em]">
                <thead>
                  <tr>
                    <th className="bg-[#003366] p-2 text-left text-white">Désignation</th>
                    <th className="bg-[#003366] p-2 text-right text-white">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {bulletin.prime_transport > 0 && (
                    <tr>
                      <td className="border-b border-gray-300 p-2">Prime de Transport</td>
                      <td className="border-b border-gray-300 p-2 text-right font-bold">
                        {formatMoney(bulletin.prime_transport)}
                      </td>
                    </tr>
                  )}
                  {bulletin.prime_logement > 0 && (
                    <tr>
                      <td className="border-b border-gray-300 p-2">Prime de Logement</td>
                      <td className="border-b border-gray-300 p-2 text-right font-bold">
                        {formatMoney(bulletin.prime_logement)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>
          )}

          <section className="section-synthese mt-8">
            <h3 className="mb-3 border-l-[5px] border-[#003366] bg-[#e9e9e9] px-3 py-2 text-[1.1em] font-bold text-gray-800">
              4. SYNTHÈSE DE PAIEMENT
            </h3>
            <div className="grid grid-cols-2 border border-gray-300 bg-[#f9f9f9] p-4">
              <p className="my-1 font-bold text-[#003366]">SALAIRE NET IMPOSABLE</p>
              <p className="my-1 text-right">{formatMoney(bulletin.salaire_imposable)}</p>

              <p className="my-1 font-bold text-[#003366]">Total Déductions</p>
              <p className="my-1 text-right">
                {formatMoney(
                  (bulletin.cnss_salariale || 0) +
                    (bulletin.montant_its || 0) +
                    (bulletin.retenue_waqf || 0) +
                    (bulletin.retenue_avance || 0) +
                    (bulletin.retenue_pret || 0) +
                    (bulletin.total_retenues_absences || 0)
                )}
              </p>
            </div>
          </section>

          <footer className="net-a-payer mt-8 border-t-[3px] border-double border-[#003366] pt-4 text-right">
            <p className="text-lg font-bold text-gray-800">SALAIRE NET À PAYER</p>
            <p className="montant-final my-2 text-3xl font-bold text-[#d9534f]">
              {formatMoney(bulletin.salaire_net)} FDJ
            </p>
            <p className="lettres text-sm text-gray-600 italic">
              Montant en toutes lettres : {numberToWords(bulletin.salaire_net)}
            </p>
            <p className="mention mt-6 text-xs text-gray-400">
              Ce document peut être imprimé. Il vaut quittance.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
};
