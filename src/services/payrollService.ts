import { supabase } from '@/integrations/supabase/client';
import {
  BaremeITS,
  PaieEmploye,
  PaieElementVariable,
  CalculPaieResult,
  PaieBulletin,
} from '../types/payroll';
import SeniorityBonusService from './seniorityBonusService';

export class PayrollService {
  /**
   * Récupère le barème ITS (Global ou spécifique au tenant si implémenté)
   */
  async getBaremeITS(): Promise<BaremeITS[]> {
    const { data, error } = await supabase
      .from('ref_bareme_its' as any)
      .select('*')
      .order('montant_min', { ascending: true });

    if (error) throw error;
    return (data || []) as unknown as BaremeITS[];
  }

  /**
   * Calcule le bulletin de paie pour un employé donné
   */
  async calculerBulletin(
    employe: PaieEmploye,
    variables: PaieElementVariable,
    bareme: BaremeITS[]
  ): Promise<CalculPaieResult> {
    // 1. Récupération des éléments fixes (depuis fiche employé)
    const base = employe.salaire_base || 0;
    const p_fct = employe.prime_fonction_fixe || 0;
    const p_resp = employe.prime_responsabilite_fixe || 0;
    const p_transp = employe.prime_transport_fixe || 0;
    const p_log = employe.prime_logement_fixe || 0;
    const waqf = employe.retenue_waqf_fixe || 0;

    // 2. Récupération des éléments variables (du mois)
    const p_spec = variables.prime_specifique || 0;
    const p_forf = variables.prime_forfaitaire || 0;
    const absences = variables.retenue_absences || 0;
    const avance = variables.retenue_avance || 0;

    // 3. Calcul du Salaire Brut
    const total_primes_imposables = p_fct + p_resp + p_spec + p_forf;
    const salaire_brut = base + total_primes_imposables - absences;

    // Note: prime_anciennete sera ajoutée séparément dans genererBulletin car elle nécessite
    // la date d'embauche et la période, informations non disponibles dans cette méthode

    // 4. Calcul Cotisations Sociales
    const taux_cnss_salarial = 0.06; // 6%
    const taux_cnss_patronal = 0.157; // 15.7%

    const cnss_salariale = Math.round(salaire_brut * taux_cnss_salarial);
    const cnss_patronale = Math.round(salaire_brut * taux_cnss_patronal);

    // 5. Calcul Base Imposable
    const salaire_imposable = salaire_brut - cnss_salariale;

    // 6. Calcul de l'Impôt (ITS) via Barème
    let montant_its = 0;

    const tranche = bareme.find(
      t => salaire_imposable >= t.montant_min && salaire_imposable <= t.montant_max
    );

    if (tranche) {
      montant_its = tranche.montant_impot;
    } else {
      if (bareme.length > 0 && salaire_imposable > bareme[bareme.length - 1].montant_max) {
        montant_its = bareme[bareme.length - 1].montant_impot;
      }
    }

    // 7. Calcul du Net
    const salaire_net = salaire_imposable - montant_its + (p_transp + p_log) - (waqf + avance);

    return {
      salaire_brut,
      cnss_salariale,
      cnss_patronale,
      salaire_imposable,
      montant_its,
      salaire_net,
      total_primes_imposables,
    };
  }

  /**
   * Récupère les absences validées pour un employé sur une période
   */
  async getAbsences(employeeId: string, periodStart: string, periodEnd: string) {
    // 1. Récupérer le user_id de l'employé paie
    const { data: paieEmp, error: errEmp } = await (supabase as any)
      .from('paie_employes')
      .select('user_id')
      .eq('id', employeeId)
      .single();

    if (errEmp || !paieEmp?.user_id) return [];

    // 2. Récupérer les absences validées
    const { data: absences, error: errAbs } = await supabase
      .from('leave_requests' as any)
      .select('*')
      .eq('employee_id', paieEmp.user_id)
      .eq('status', 'approved')
      .gte('start_date', periodStart)
      .lte('end_date', periodEnd);

    if (errAbs) {
      console.error('Erreur récupération absences:', errAbs);
      return [];
    }

    return absences || [];
  }

  /**
   * Récupère les avances et prêts à déduire pour la période
   */
  async getAvancesPrets(employeeId: string, periodStart: string, periodEnd: string) {
    const { data, error } = await (supabase as any)
      .from('paie_avances_prets')
      .select('*')
      .eq('employe_id', employeeId)
      .eq('statut', 'en_cours')
      .lte('date_demande', periodEnd); // Demande faite avant la fin de la période

    if (error) {
      console.error('Erreur récupération avances/prêts:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Génère et sauvegarde le bulletin pour un employé et une période
   */
  async genererBulletin(
    employeId: string,
    periodeId: string,
    variables: Partial<PaieElementVariable> = {}
  ) {
    // 1. Fetch Employé
    const { data: employe, error: errEmp } = await (supabase as any)
      .from('paie_employes')
      .select('*')
      .eq('id', employeId)
      .single();

    if (errEmp || !employe) throw new Error('Employé introuvable');

    // 2. Fetch Période pour les dates
    const { data: periode, error: errPer } = await (supabase as any)
      .from('paie_periodes')
      .select('*')
      .eq('id', periodeId)
      .single();

    if (errPer || !periode) throw new Error('Période introuvable');

    // 3. Calcul Automatique des Variables (Absences & Avances)
    const absences = await this.getAbsences(employeId, periode.date_debut, periode.date_fin);
    const avancesPrets = await this.getAvancesPrets(
      employeId,
      periode.date_debut,
      periode.date_fin
    );

    // Calcul retenue absences (Règle : Salaire Base / 30 * Jours d'absence)
    const totalJoursAbsence = absences.reduce(
      (acc: number, abs: any) => acc + (abs.total_days || 0),
      0
    );
    const montantRetenueAbsence = Math.round((employe.salaire_base / 30) * totalJoursAbsence);

    // Calcul retenue avances/prêts
    let montantRetenueAvance = 0;
    let montantRetenuePret = 0;

    avancesPrets.forEach((item: any) => {
      if (item.type === 'avance') {
        // Avance sur salaire : on déduit tout
        montantRetenueAvance += item.montant;
      } else if (item.type === 'pret') {
        // Prêt : on déduit la mensualité
        montantRetenuePret += item.mensualite || 0;
      }
    });

    // 4. Fusion avec les variables manuelles (priorité aux calculs auto si non forcés)
    let varData = {
      id: variables.id || '',
      tenant_id: employe.tenant_id,
      periode_id: periodeId,
      employe_id: employeId,
      prime_specifique: variables.prime_specifique || 0,
      prime_forfaitaire: variables.prime_forfaitaire || 0,
      retenue_absences:
        variables.retenue_absences !== undefined
          ? variables.retenue_absences
          : montantRetenueAbsence,
      retenue_avance:
        variables.retenue_avance !== undefined ? variables.retenue_avance : montantRetenueAvance,
      // Note: retenue_pret n'est pas dans PaieElementVariable standard, on l'ajoute au bulletin directement
    };

    // 5. Fetch Barème
    const bareme = await this.getBaremeITS();

    // 5.5. Calculer la Prime d'Ancienneté
    const dateBulletin = `${periode.annee}-${String(periode.mois).padStart(2, '0')}-01`;
    const primeAnciennete = await SeniorityBonusService.calculateBonusForPayroll(
      employeId,
      employe.salaire_base,
      employe.date_embauche || null,
      dateBulletin,
      employe.tenant_id
    );

    // 6. Calcul
    const resultat = await this.calculerBulletin(employe as PaieEmploye, varData, bareme);

    // Ajustement Net pour Prêt (hors calcul standard qui ne connait pas le prêt)
    const salaire_net_final = resultat.salaire_net - montantRetenuePret;

    // 7. Sauvegarde Bulletin
    const bulletin: any = {
      periode_id: periodeId,
      employe_id: employeId,
      tenant_id: employe.tenant_id,

      salaire_base: employe.salaire_base,
      prime_fonction: employe.prime_fonction_fixe,
      prime_responsabilite: employe.prime_responsabilite_fixe,
      prime_transport: employe.prime_transport_fixe,
      prime_logement: employe.prime_logement_fixe,

      prime_specifique: varData.prime_specifique || 0,
      prime_forfaitaire: varData.prime_forfaitaire || 0,
      prime_anciennete: primeAnciennete,

      total_primes_imposables: resultat.total_primes_imposables + primeAnciennete,
      total_retenues_absences: varData.retenue_absences || 0,

      salaire_brut: resultat.salaire_brut,
      cnss_salariale: resultat.cnss_salariale,
      cnss_patronale: resultat.cnss_patronale,
      salaire_imposable: resultat.salaire_imposable,
      montant_its: resultat.montant_its,

      retenue_waqf: employe.retenue_waqf_fixe,
      retenue_avance: varData.retenue_avance || 0,
      retenue_pret: montantRetenuePret, // Nouveau champ

      salaire_net: salaire_net_final,
    };

    const { data: savedBulletin, error: errSave } = await (supabase as any)
      .from('paie_bulletins')
      .upsert(bulletin, { onConflict: 'periode_id, employe_id' })
      .select()
      .single();

    if (errSave) throw errSave;
    return savedBulletin as PaieBulletin;
  }
  /**
   * Génère la paie en lot pour tous les employés d'un tenant sur une période
   * Optimisé pour la performance (batch processing) et la sécurité (tenant isolation)
   */
  async genererPaieLot(tenantId: string, periodeId: string) {
    // 1. Fetch Période
    const { data: periode, error: errPer } = await (supabase as any)
      .from('paie_periodes')
      .select('*')
      .eq('id', periodeId)
      .eq('tenant_id', tenantId) // Security: Ensure period belongs to tenant
      .single();

    if (errPer || !periode) throw new Error('Période introuvable ou accès refusé');

    // 2. Fetch All Employees for Tenant
    const { data: employees, error: errEmp } = await (supabase as any)
      .from('paie_employes')
      .select('*')
      .eq('tenant_id', tenantId);

    if (errEmp) throw new Error('Erreur lors de la récupération des employés');
    if (!employees || employees.length === 0) return { count: 0, bulletins: [] };

    // 3. Fetch All Absences for Tenant in Period
    // Note: This assumes leave_requests has tenant_id. If not, we filter by employee IDs.
    const employeeUserIds = employees.map((e: any) => e.user_id).filter(Boolean);

    let absences = [];
    if (employeeUserIds.length > 0) {
      const { data: absData } = await supabase
        .from('leave_requests' as any)
        .select('*')
        .in('employee_id', employeeUserIds) // Filter by our employees
        .eq('status', 'approved')
        .gte('start_date', periode.date_debut)
        .lte('end_date', periode.date_fin);
      absences = absData || [];
    }

    // 4. Fetch All Advances/Loans for Tenant
    const employeeIds = employees.map((e: any) => e.id);
    let avancesPrets = [];
    if (employeeIds.length > 0) {
      const { data: avData } = await (supabase as any)
        .from('paie_avances_prets')
        .select('*')
        .in('employe_id', employeeIds)
        .eq('statut', 'en_cours')
        .lte('date_demande', periode.date_fin);
      avancesPrets = avData || [];
    }

    // 5. Fetch Barème
    const bareme = await this.getBaremeITS();

    // 6. Calculate All Bulletins in Memory
    const bulletinsToUpsert = [];

    for (const emp of employees) {
      // Filter absences for this employee
      const empAbsences = absences.filter((a: any) => a.employee_id === emp.user_id);
      const totalJoursAbsence = empAbsences.reduce(
        (acc: number, abs: any) => acc + (abs.total_days || 0),
        0
      );
      const montantRetenueAbsence = Math.round((emp.salaire_base / 30) * totalJoursAbsence);

      // Filter advances for this employee
      const empAvances = avancesPrets.filter((a: any) => a.employe_id === emp.id);
      let montantRetenueAvance = 0;
      let montantRetenuePret = 0;

      empAvances.forEach((item: any) => {
        if (item.type === 'avance') montantRetenueAvance += item.montant;
        else if (item.type === 'pret') montantRetenuePret += item.mensualite || 0;
      });

      // Prepare variables
      const varData = {
        prime_specifique: 0,
        prime_forfaitaire: 0,
        retenue_absences: montantRetenueAbsence,
        retenue_avance: montantRetenueAvance,
      };

      // Calculate
      const resultat = await this.calculerBulletin(emp as PaieEmploye, varData as any, bareme);

      // Calculate Prime d'Ancienneté
      const dateBulletin = `${periode.annee}-${String(periode.mois).padStart(2, '0')}-01`;
      const primeAnciennete = await SeniorityBonusService.calculateBonusForPayroll(
        emp.id,
        emp.salaire_base,
        emp.date_embauche || null,
        dateBulletin,
        tenantId
      );

      const salaire_net_final = resultat.salaire_net - montantRetenuePret;

      // Prepare DB Object
      bulletinsToUpsert.push({
        periode_id: periodeId,
        employe_id: emp.id,
        tenant_id: tenantId,
        salaire_base: emp.salaire_base,
        prime_fonction: emp.prime_fonction_fixe,
        prime_responsabilite: emp.prime_responsabilite_fixe,
        prime_transport: emp.prime_transport_fixe,
        prime_logement: emp.prime_logement_fixe,
        prime_anciennete: primeAnciennete,
        prime_specifique: 0,
        prime_forfaitaire: 0,
        total_primes_imposables: resultat.total_primes_imposables + primeAnciennete,
        total_retenues_absences: montantRetenueAbsence,
        salaire_brut: resultat.salaire_brut,
        cnss_salariale: resultat.cnss_salariale,
        cnss_patronale: resultat.cnss_patronale,
        salaire_imposable: resultat.salaire_imposable,
        montant_its: resultat.montant_its,
        retenue_waqf: emp.retenue_waqf_fixe,
        retenue_avance: montantRetenueAvance,
        retenue_pret: montantRetenuePret,
        salaire_net: salaire_net_final,
      });
    }

    // 7. Bulk Upsert
    if (bulletinsToUpsert.length > 0) {
      const { error: upsertError } = await (supabase as any)
        .from('paie_bulletins')
        .upsert(bulletinsToUpsert, { onConflict: 'periode_id, employe_id' });

      if (upsertError) throw upsertError;
    }

    return { count: bulletinsToUpsert.length };
  }
}

export const payrollService = new PayrollService();
