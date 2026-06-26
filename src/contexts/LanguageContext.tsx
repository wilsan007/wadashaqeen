/**
 * LanguageContext — Contexte React pour l'internationalisation FR/EN
 * Rend le changement de langue réactif dans toute l'application.
 */
import React, { createContext, useContext, useState, useCallback } from 'react';
import { getLocale, setLocale as setModuleLocale, t as moduleT, type Locale } from '@/i18n/index';

interface LanguageContextValue {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [locale, setLocaleState] = useState<Locale>(getLocale);

    const setLocale = useCallback((newLocale: Locale) => {
        setModuleLocale(newLocale);
        setLocaleState(newLocale);
    }, []);

    // t() réactif : chaque appel utilise la locale courante du state
    // On recrée la fonction à chaque changement de locale pour forcer le re-render
    const t = useCallback((key: string) => moduleT(key), [locale]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <LanguageContext.Provider value={{ locale, setLocale, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = (): LanguageContextValue => {
    const ctx = useContext(LanguageContext);
    if (!ctx) {
        throw new Error('useLanguage must be used within a <LanguageProvider>');
    }
    return ctx;
};
