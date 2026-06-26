/**
 * useTranslation — Hook léger pour accéder à l'i18n depuis n'importe quel composant.
 * Usage: const { t, locale, setLocale } = useTranslation();
 */
import { useLanguage } from '@/contexts/LanguageContext';

export const useTranslation = () => useLanguage();
