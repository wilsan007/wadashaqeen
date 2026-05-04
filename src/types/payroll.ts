export interface BaremeITS {
  id: string;
  tenant_id?: string;
  montant_min: number;
  montant_max: number;
  montant_impot: number;
  ecart?: number;
}

export interface PaieEmploye {
  id: string;
  tenant_id: string;
  nom_complet: string;
  fonction: string;
  salaire_base: number;
  prime_fonction_fixe: number;
  prime_responsabilite_fixe: number;
  prime_transport_fixe: number;
  prime_logement_fixe: number;
  retenue_waqf_fixe: number;
  date_embauche?: string | null;
  prime_anciennete_dernier_salaire?: number;
  prime_anciennete_derniere_maj?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PaiePeriode {
  id: string;
  tenant_id: string;
  mois: number;
  annee: number;
  est_cloture: boolean;
  created_at?: string;
}

export interface PaieElementVariable {
  id: string;
  tenant_id: string;
  periode_id: string;
  employe_id: string;
  prime_specifique: number;
  prime_forfaitaire: number;
  retenue_absences: number;
  retenue_avance: number;
  created_at?: string;
}

export interface PaieBulletin {
  id: string;
  tenant_id: string;
  periode_id: string;
  employe_id: string;

  // Snapshot
  salaire_base: number;
  prime_fonction: number;
  prime_responsabilite: number;
  prime_specifique: number;
  prime_forfaitaire: number;
  prime_transport: number;
  prime_logement: number;
  prime_anciennete: number;

  // Calculated
  total_primes_imposables: number;
  total_retenues_absences: number;
  salaire_brut: number;

  cnss_salariale: number;
  cnss_patronale: number;

  salaire_imposable: number;
  montant_its: number;

  retenue_waqf: number;
  retenue_avance: number;
  retenue_pret?: number; // Nouveau champ pour les prêts

  salaire_net: number;

  created_at?: string;

  // Relations
  employe?: PaieEmploye;
  periode?: PaiePeriode;
}

export interface CalculPaieResult {
  salaire_brut: number;
  cnss_salariale: number;
  cnss_patronale: number;
  salaire_imposable: number;
  montant_its: number;
  salaire_net: number;
  total_primes_imposables: number;
}
