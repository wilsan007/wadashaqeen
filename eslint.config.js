import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: [
    "dist", 
    ".vite/**/*",
    "node_modules/**/*",
    "scripts/**/*", 
    "supabase/functions/**/*",
    "coverage/**/*",
    "build/**/*",
    "*.config.js",
    "*.config.ts"
  ] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    linterOptions: {
      reportUnusedDisableDirectives: false, // Ne pas bloquer sur les directives disable inutilisées
    },
    rules: {
      // ✅ Règles de sécurité ACTIVÉES (importantes)
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      
      // ⚠️ Règles en WARNING — visibles mais non bloquantes
      "@typescript-eslint/no-explicit-any": "warn",   // Surface la dette `any`
      "no-console": ["warn", { allow: ["warn", "error"] }], // Autorise warn/error, bloque log/info/debug

      // ⚠️ Règles DÉSACTIVÉES — à activer progressivement
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "react-hooks/exhaustive-deps": "warn",          // Passer en warn pour détecter les dépendances manquantes
      "react-hooks/rules-of-hooks": "error",          // Toujours enforcer les règles des hooks
      "react-refresh/only-export-components": "off",
      "no-case-declarations": "off",

      // ℹ️ Autres règles
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "prefer-const": "warn"
    },
  },
);
