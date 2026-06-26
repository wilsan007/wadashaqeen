// Background CSS-only adaptatif au thème — remplace l'ancien canvas WebGL Three.js.
// Avantages : zéro dépendance Three.js, aucun GPU overhead, s'adapte light/dark automatiquement.
export default function FuturisticBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[-1]"
      aria-hidden="true"
      style={{
        background: `
          radial-gradient(ellipse 90% 60% at 15% -15%, hsl(var(--primary) / 0.08) 0%, transparent 55%),
          radial-gradient(ellipse 60% 40% at 85% 110%, hsl(280 70% 60% / 0.06) 0%, transparent 55%),
          var(--gradient-bg)
        `,
      }}
    />
  );
}
