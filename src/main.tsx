import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from 'next-themes';
import { initSentry } from './lib/sentry';
import { LanguageProvider } from './contexts/LanguageContext';

// Initialiser Sentry en premier (avant le rendu React)
initSentry();

createRoot(document.getElementById('root')!).render(
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </ThemeProvider>
);
