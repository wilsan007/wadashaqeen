import fr from './fr.json';
import en from './en.json';

export type Locale = 'fr' | 'en';
type Translations = typeof fr;

const translations: Record<Locale, Translations> = { fr, en };

let currentLocale: Locale = 'fr';

try {
  const stored = localStorage.getItem('locale') as Locale | null;
  if (stored && stored in translations) currentLocale = stored;
} catch {
  // SSR / localStorage indisponible
}

export function setLocale(locale: Locale): void {
  currentLocale = locale;
  try { localStorage.setItem('locale', locale); } catch { /* noop */ }
}

export function getLocale(): Locale {
  return currentLocale;
}

export function t(key: string): string {
  const parts = key.split('.');
  let value: unknown = translations[currentLocale];
  for (const part of parts) {
    if (typeof value !== 'object' || value === null) break;
    value = (value as Record<string, unknown>)[part];
  }
  if (typeof value === 'string') return value;
  // Fallback français
  value = translations['fr'];
  for (const part of parts) {
    if (typeof value !== 'object' || value === null) break;
    value = (value as Record<string, unknown>)[part];
  }
  return typeof value === 'string' ? value : key;
}
