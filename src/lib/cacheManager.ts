/**
 * Cache Manager Enterprise - Pattern Stripe/Salesforce
 *
 * Fonctionnalités:
 * - Cache intelligent multi-niveau
 * - TTL adaptatif par type de données
 * - Invalidation sélective
 * - Métriques de performance
 * - Compression automatique
 */

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccess: number;
  compressed?: boolean;
}

interface CacheMetrics {
  hits: number;
  misses: number;
  size: number;
  totalEntries: number;
  hitRate: number;
  averageAccessTime: number;
}

export type CacheType =
  | 'user_roles'
  | 'tenant_data'
  | 'hr_data'
  | 'projects'
  | 'tasks'
  | 'permissions'
  | 'default';

class EnterpriseCache {
  private cache = new Map<string, CacheEntry>();
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    size: 0,
    totalEntries: 0,
    hitRate: 0,
    averageAccessTime: 0,
  };

  // TTL par type de données (comme Stripe)
  public readonly TTL_CONFIG = {
    user_roles: 5 * 60 * 1000, // 5 minutes
    tenant_data: 10 * 60 * 1000, // 10 minutes
    hr_data: 3 * 60 * 1000, // 3 minutes
    projects: 5 * 60 * 1000, // 5 minutes
    tasks: 2 * 60 * 1000, // 2 minutes
    permissions: 15 * 60 * 1000, // 15 minutes
    default: 5 * 60 * 1000, // 5 minutes par défaut
  };

  // Taille maximale du cache (comme Salesforce)
  private readonly MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB
  private readonly MAX_ENTRIES = 1000;

  /**
   * Obtenir une entrée du cache
   */
  get<T>(key: string): T | null {
    const startTime = performance.now();
    const entry = this.cache.get(key);

    if (!entry) {
      this.metrics.misses++;
      this.updateMetrics(performance.now() - startTime);
      return null;
    }

    // Vérifier l'expiration
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.metrics.misses++;
      this.updateMetrics(performance.now() - startTime);
      return null;
    }

    // Mettre à jour les statistiques d'accès
    entry.accessCount++;
    entry.lastAccess = Date.now();

    this.metrics.hits++;
    this.updateMetrics(performance.now() - startTime);

    return entry.data as T;
  }

  /**
   * Définir une entrée dans le cache
   */
  set<T>(key: string, data: T, cacheType: CacheType = 'default'): void {
    // Vérifier la taille avant d'ajouter
    this.enforceMemoryLimits();

    const ttl = this.TTL_CONFIG[cacheType] || this.TTL_CONFIG.default;
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
      lastAccess: Date.now(),
      compressed: this.shouldCompress(data),
    };

    this.cache.set(key, entry);
    this.updateCacheSize();
  }

  /**
   * Invalider une entrée spécifique
   */
  invalidate(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.updateCacheSize();
    }
    return deleted;
  }

  /**
   * Invalider par pattern (comme Redis)
   */
  invalidatePattern(pattern: string): number {
    let deletedCount = 0;
    // Échapper tous les caractères spéciaux regex sauf *
    const escapedPattern = pattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Échapper caractères spéciaux
      .replace(/\*/g, '.*'); // Convertir * en .*
    const regex = new RegExp(escapedPattern);

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      this.updateCacheSize();
    }

    return deletedCount;
  }

  /**
   * Vider tout le cache
   */
  clear(): void {
    this.cache.clear();
    this.metrics = {
      hits: 0,
      misses: 0,
      size: 0,
      totalEntries: 0,
      hitRate: 0,
      averageAccessTime: 0,
    };
  }

  /**
   * Obtenir les métriques de performance
   */
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  /**
   * Nettoyer les entrées expirées (garbage collection)
   */
  cleanup(): number {
    let cleanedCount = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.updateCacheSize();
    }

    return cleanedCount;
  }

  /**
   * Obtenir les statistiques détaillées
   */
  getStats(): any {
    const entries = Array.from(this.cache.entries());
    const now = Date.now();

    return {
      metrics: this.getMetrics(),
      entries: entries.length,
      expired: entries.filter(([_, entry]) => now - entry.timestamp > entry.ttl).length,
      mostAccessed: entries
        .sort((a, b) => b[1].accessCount - a[1].accessCount)
        .slice(0, 5)
        .map(([key, entry]) => ({ key, accessCount: entry.accessCount })),
      oldestEntry: entries.reduce(
        (oldest, [key, entry]) =>
          !oldest || entry.timestamp < oldest.timestamp
            ? { key, timestamp: entry.timestamp }
            : oldest,
        null as any
      ),
      memoryUsage: this.estimateMemoryUsage(),
    };
  }

  /**
   * Précharger des données critiques
   */
  preload(entries: Array<{ key: string; data: any; type?: CacheType }>): void {
    entries.forEach(({ key, data, type }) => {
      this.set(key, data, type);
    });
  }

  // Méthodes privées

  private shouldCompress(data: any): boolean {
    const size = JSON.stringify(data).length;
    return size > 10 * 1024; // Compresser si > 10KB
  }

  private enforceMemoryLimits(): void {
    // Nettoyer d'abord les entrées expirées
    this.cleanup();

    // Si toujours trop d'entrées, supprimer les moins utilisées
    if (this.cache.size >= this.MAX_ENTRIES) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].accessCount - b[1].accessCount);

      const toDelete = entries.slice(0, Math.floor(this.MAX_ENTRIES * 0.1)); // Supprimer 10%
      toDelete.forEach(([key]) => this.cache.delete(key));

    }
  }

  private updateCacheSize(): void {
    this.metrics.totalEntries = this.cache.size;
    this.metrics.size = this.estimateMemoryUsage();
  }

  private estimateMemoryUsage(): number {
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += JSON.stringify(entry.data).length;
    }
    return totalSize;
  }

  private updateMetrics(accessTime: number): void {
    const total = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRate = total > 0 ? (this.metrics.hits / total) * 100 : 0;
    this.metrics.averageAccessTime = (this.metrics.averageAccessTime + accessTime) / 2;
  }
}

// Instance globale du cache (Singleton pattern)
export const cacheManager = new EnterpriseCache();

// Auto-cleanup toutes les 5 minutes
setInterval(
  () => {
    cacheManager.cleanup();
  },
  5 * 60 * 1000
);

// Utilitaires pour les hooks
export const createCacheKey = (
  ...parts: (string | number | boolean | null | undefined)[]
): string => {
  return parts.filter(Boolean).join(':');
};

export const withCache = <T>(key: string, fetcher: () => Promise<T>, cacheType?: CacheType) => {
  return async (): Promise<T> => {
    // Vérifier le cache d'abord
    const cached = cacheManager.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetcher les données
    const data = await fetcher();

    // Mettre en cache
    cacheManager.set(key, data, cacheType);

    return data;
  };
};

export default cacheManager;
