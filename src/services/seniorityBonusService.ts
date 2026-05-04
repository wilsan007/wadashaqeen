import { supabase } from '@/integrations/supabase/client';

/**
 * Configuration de la prime d'ancienneté par tenant
 */
export interface SeniorityBonusConfig {
  id: string;
  tenant_id: string;
  pourcentage_augmentation: number; // Exemple: 2.00 pour 2%
  periode_augmentation_mois: number; // Exemple: 24 pour 2 ans
  plafond_pourcentage: number; // Exemple: 50.00 pour 50% max
  utiliser_mois_embauche: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Période de gel de la prime d'ancienneté
 */
export interface FreezePeriod {
  id: string;
  tenant_id: string;
  date_debut: string;
  date_fin: string | null; // null = gel en cours
  motif: string;
  created_by?: string;
  created_at: string;
}

/**
 * Configuration par défaut si aucune n'existe
 */
const DEFAULT_CONFIG: Omit<SeniorityBonusConfig, 'id' | 'tenant_id' | 'created_at' | 'updated_at'> =
  {
    pourcentage_augmentation: 2.0, // 2% par défaut
    periode_augmentation_mois: 24, // 2 ans
    plafond_pourcentage: 50.0, // 50% du salaire de base
    utiliser_mois_embauche: true,
  };

/**
 * Service de gestion de la prime d'ancienneté
 */
export class SeniorityBonusService {
  /**
   * Récupère la configuration de la prime pour le tenant actuel
   * Crée une configuration par défaut si elle n'existe pas
   */
  static async getConfig(tenantId: string): Promise<SeniorityBonusConfig> {
    const { data, error } = await (supabase as any)
      .from('config_prime_anciennete')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Erreur récupération config prime ancienneté:', error);
      throw error;
    }

    // Si aucune config n'existe, en créer une par défaut
    if (!data) {
      const { data: newConfig, error: createError } = await (supabase as any)
        .from('config_prime_anciennete')
        .insert({
          tenant_id: tenantId,
          ...DEFAULT_CONFIG,
        })
        .select()
        .single();

      if (createError) {
        console.error('Erreur création config par défaut:', createError);
        throw createError;
      }

      return newConfig;
    }

    return data;
  }

  /**
   * Met à jour la configuration de la prime
   */
  static async updateConfig(
    tenantId: string,
    updates: Partial<Omit<SeniorityBonusConfig, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>
  ): Promise<SeniorityBonusConfig> {
    const { data, error } = await (supabase as any)
      .from('config_prime_anciennete')
      .update(updates)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      console.error('Erreur mise à jour config:', error);
      throw error;
    }

    return data;
  }

  /**
   * Récupère toutes les périodes de gel pour un tenant
   */
  static async getFreezePeriods(tenantId: string): Promise<FreezePeriod[]> {
    const { data, error } = await (supabase as any)
      .from('periodes_gel_anciennete')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('date_debut', { ascending: false });

    if (error) {
      console.error('Erreur récupération périodes de gel:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Ajoute une nouvelle période de gel
   */
  static async addFreezePeriod(
    tenantId: string,
    dateDebut: string,
    dateFin: string | null,
    motif: string,
    createdBy?: string
  ): Promise<FreezePeriod> {
    const { data, error } = await (supabase as any)
      .from('periodes_gel_anciennete')
      .insert({
        tenant_id: tenantId,
        date_debut: dateDebut,
        date_fin: dateFin,
        motif: motif,
        created_by: createdBy,
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur ajout période de gel:', error);
      throw error;
    }

    return data;
  }

  /**
   * Met fin à une période de gel en cours
   */
  static async endFreezePeriod(freezeId: string, dateFin: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('periodes_gel_anciennete')
      .update({ date_fin: dateFin })
      .eq('id', freezeId);

    if (error) {
      console.error('Erreur fin période de gel:', error);
      throw error;
    }
  }

  /**
   * Supprime une période de gel
   */
  static async deleteFreezePeriod(freezeId: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('periodes_gel_anciennete')
      .delete()
      .eq('id', freezeId);

    if (error) {
      console.error('Erreur suppression période de gel:', error);
      throw error;
    }
  }

  /**
   * Calcule l'ancienneté effective en mois en excluant les périodes de gel
   * Utilise la fonction PostgreSQL optimisée
   */
  static async calculateEffectiveSeniority(
    dateEmbauche: string,
    dateReference: string,
    tenantId: string
  ): Promise<number> {
    const { data, error } = await (supabase as any).rpc('calculer_anciennete_effective', {
      p_date_embauche: dateEmbauche,
      p_date_reference: dateReference,
      p_tenant_id: tenantId,
    });

    if (error) {
      console.error('Erreur calcul ancienneté effective:', error);
      throw error;
    }

    return parseFloat(String(data)) || 0;
  }

  /**
   * Calcule le montant de la prime d'ancienneté pour un employé
   *
   * @param salaireBase - Salaire de base actuel de l'employé
   * @param dateEmbauche - Date d'embauche de l'employé
   * @param dateReference - Date à laquelle calculer la prime (généralement date du bulletin)
   * @param tenantId - ID du tenant
   * @returns Montant de la prime d'ancienneté
   */
  static async calculateSeniorityBonus(
    salaireBase: number,
    dateEmbauche: string | null,
    dateReference: string,
    tenantId: string
  ): Promise<number> {
    // Si pas de date d'embauche, pas de prime
    if (!dateEmbauche) {
      return 0;
    }

    // Si salaire de base est 0 ou négatif, pas de prime
    if (salaireBase <= 0) {
      return 0;
    }

    // Récupérer la configuration
    const config = await this.getConfig(tenantId);

    // Calculer l'ancienneté effective en mois (hors périodes de gel)
    const ancienneteMois = await this.calculateEffectiveSeniority(
      dateEmbauche,
      dateReference,
      tenantId
    );

    // Calculer le nombre de périodes d'augmentation acquises
    const nombrePeriodes = Math.floor(ancienneteMois / config.periode_augmentation_mois);

    // Si aucune période acquise, pas de prime
    if (nombrePeriodes === 0) {
      return 0;
    }

    // Calculer le pourcentage total de la prime
    const pourcentageTotal = config.pourcentage_augmentation * nombrePeriodes;

    // Appliquer le plafond
    const pourcentageFinal = Math.min(pourcentageTotal, config.plafond_pourcentage);

    // Calculer le montant de la prime
    const montantPrime = (salaireBase * pourcentageFinal) / 100;

    return Math.round(montantPrime); // Arrondir à l'entier le plus proche
  }

  /**
   * Détermine si la prime doit être recalculée pour un employé
   * La prime est TOUJOURS recalculée automatiquement selon l'ancienneté
   * (gel intelligent désactivé par demande utilisateur)
   *
   * @returns toujours true
   */
  static async shouldUpdateBonus(): Promise<boolean> {
    // La prime progresse toujours automatiquement
    return true;
  }

  /**
   * Calcule la prime d'ancienneté pour un employé
   * La prime progresse automatiquement selon l'ancienneté, peu importe le salaire de base
   * Cette méthode est celle à utiliser lors de la génération des bulletins
   */
  static async calculateBonusForPayroll(
    employeId: string,
    salaireBase: number,
    dateEmbauche: string | null,
    dateBulletin: string,
    tenantId: string
  ): Promise<number> {
    // Calculer la prime (toujours recalculée automatiquement)
    const prime = await this.calculateSeniorityBonus(
      salaireBase,
      dateEmbauche,
      dateBulletin,
      tenantId
    );

    return prime;
  }
}

export default SeniorityBonusService;
