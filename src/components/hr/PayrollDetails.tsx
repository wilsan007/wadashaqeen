import React from 'react';
import { PaieBulletin } from '../../types/payroll';

interface PayrollDetailsProps {
  bulletin: PaieBulletin;
  onClose: () => void;
}

export const PayrollDetails: React.FC<PayrollDetailsProps> = ({ bulletin, onClose }) => {
  const DetailRow = ({
    label,
    value,
    isTotal = false,
  }: {
    label: string;
    value: number;
    isTotal?: boolean;
  }) => (
    <div
      className={`flex justify-between py-2 ${isTotal ? 'border-t-2 border-gray-300 text-lg font-bold dark:border-gray-600' : 'border-b border-gray-200 dark:border-gray-700'}`}
    >
      <span className="text-gray-700 dark:text-gray-300">{label}</span>
      <span
        className={isTotal ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}
      >
        {value.toLocaleString('fr-DJ')} FDJ
      </span>
    </div>
  );

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl dark:bg-gray-800">
        <div className="border-b border-gray-200 p-6 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Bulletin de Paie</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            <p>
              <strong>Employé:</strong> {bulletin.employe?.nom_complet}
            </p>
            <p>
              <strong>Fonction:</strong> {bulletin.employe?.fonction}
            </p>
          </div>
        </div>

        <div className="space-y-6 p-6">
          {/* Section: Éléments de Base */}
          <div>
            <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
              Éléments de Rémunération
            </h3>
            <DetailRow label="Salaire de Base" value={bulletin.salaire_base} />
            <DetailRow label="Prime de Fonction" value={bulletin.prime_fonction} />
            <DetailRow label="Prime de Responsabilité" value={bulletin.prime_responsabilite} />
            <DetailRow label="Prime Spécifique" value={bulletin.prime_specifique} />
            <DetailRow label="Prime Forfaitaire" value={bulletin.prime_forfaitaire} />
            {bulletin.total_retenues_absences > 0 && (
              <DetailRow label="Retenues Absences (-)" value={-bulletin.total_retenues_absences} />
            )}
            <DetailRow label="Salaire Brut" value={bulletin.salaire_brut} isTotal />
          </div>

          {/* Section: Cotisations Sociales */}
          <div>
            <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
              Cotisations Sociales
            </h3>
            <DetailRow label="CNSS Part Salariale (6%)" value={bulletin.cnss_salariale} />
            <DetailRow label="CNSS Part Patronale (15.7%)" value={bulletin.cnss_patronale} />
            <DetailRow label="Salaire Imposable" value={bulletin.salaire_imposable} isTotal />
          </div>

          {/* Section: Impôts et Retenues */}
          <div>
            <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
              Impôts et Retenues
            </h3>
            <DetailRow
              label="Impôt sur Traitements et Salaires (ITS)"
              value={bulletin.montant_its}
            />
            <DetailRow label="Retenue Waqf" value={bulletin.retenue_waqf} />
            {bulletin.retenue_avance > 0 && (
              <DetailRow label="Avance sur Salaire" value={bulletin.retenue_avance} />
            )}
          </div>

          {/* Section: Primes Non Imposables */}
          <div>
            <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
              Primes Non Imposables
            </h3>
            <DetailRow label="Prime de Transport" value={bulletin.prime_transport} />
            <DetailRow label="Prime de Logement" value={bulletin.prime_logement} />
          </div>

          {/* Section: Net à Payer */}
          <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
            <DetailRow label="NET À PAYER" value={bulletin.salaire_net} isTotal />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 p-6 dark:border-gray-700">
          <button
            onClick={onClose}
            className="rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            Fermer
          </button>
          <button
            onClick={() => window.print()}
            className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
          >
            Imprimer
          </button>
        </div>
      </div>
    </div>
  );
};
