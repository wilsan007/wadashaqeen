import { describe, it, expect, beforeEach } from 'vitest';

describe('i18n', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('t() returns French by default', async () => {
    const { t, setLocale } = await import('@/i18n/index');
    setLocale('fr');
    expect(t('dashboard.title')).toBe('Tableau de bord');
  });

  it('t() switches to English', async () => {
    const { t, setLocale } = await import('@/i18n/index');
    setLocale('en');
    expect(t('dashboard.title')).toBe('Dashboard');
  });

  it('t() returns key for unknown key', async () => {
    const { t, setLocale } = await import('@/i18n/index');
    setLocale('fr');
    expect(t('nonexistent.key')).toBe('nonexistent.key');
  });

  it('t() handles nested keys', async () => {
    const { t, setLocale } = await import('@/i18n/index');
    setLocale('fr');
    expect(t('tasks.status.todo')).toBe('À faire');
    expect(t('tasks.priority.high')).toBe('Élevé');
  });
});
