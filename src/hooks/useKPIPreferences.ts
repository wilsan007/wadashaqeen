import { useState, useEffect } from 'react';

export function useKPIPreferences(dashboardKey: string, defaultKeys: string[]) {
  const customKey = `wadashaqayn_kpi_prefs_${dashboardKey}`;
  const [preferences, setPreferences] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem(customKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure all default keys exist
        const merged = { ...parsed };
        defaultKeys.forEach(k => {
          if (merged[k] === undefined) merged[k] = true;
        });
        return merged;
      } catch (e) {}
    }
    const initial: Record<string, boolean> = {};
    defaultKeys.forEach(key => initial[key] = true);
    return initial;
  });

  useEffect(() => {
    localStorage.setItem(customKey, JSON.stringify(preferences));
  }, [preferences, customKey]);

  const toggleKPI = (key: string) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const showAll = () => {
    const updated: Record<string, boolean> = {};
    defaultKeys.forEach(key => updated[key] = true);
    setPreferences(updated);
  };

  const hideAll = () => {
    const updated: Record<string, boolean> = {};
    defaultKeys.forEach(key => updated[key] = false);
    setPreferences(updated);
  }

  return { preferences, toggleKPI, showAll, hideAll };
}
