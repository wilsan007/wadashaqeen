/**
 * LanguageToggle — Bouton de bascule FR ↔ EN
 * Style similaire au ThemeToggle pour cohérence visuelle.
 */
import React from 'react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import type { Locale } from '@/i18n/index';

interface LanguageToggleProps {
    className?: string;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ className }) => {
    const { locale, setLocale } = useTranslation();

    const toggle = () => {
        const next: Locale = locale === 'fr' ? 'en' : 'fr';
        setLocale(next);
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={toggle}
            title={locale === 'fr' ? 'Switch to English' : 'Passer en Français'}
            aria-label={locale === 'fr' ? 'Switch to English' : 'Passer en Français'}
            className={`h-8 min-w-[3rem] rounded-md px-2 font-semibold text-xs tracking-wide transition-all duration-150 hover:bg-accent hover:text-accent-foreground ${className ?? ''}`}
        >
            <span className="flex items-center gap-1">
                <span className={locale === 'fr' ? 'text-foreground' : 'text-muted-foreground/50'}>FR</span>
                <span className="text-muted-foreground/40">|</span>
                <span className={locale === 'en' ? 'text-foreground' : 'text-muted-foreground/50'}>EN</span>
            </span>
        </Button>
    );
};
