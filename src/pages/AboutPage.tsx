import { Link } from 'react-router-dom';
import { ArrowLeft, Users, Target, Zap, Globe } from 'lucide-react';

const team = [
    { name: 'Équipe Produit', emoji: '🚀', desc: 'Conçoit et améliore la plateforme' },
    { name: 'Équipe Technique', emoji: '⚙️', desc: 'Développe et maintient l\'infrastructure' },
    { name: 'Équipe Support', emoji: '🛟', desc: 'Accompagne les clients au quotidien' },
    { name: 'Équipe Commerciale', emoji: '💼', desc: 'Développe les partenariats' },
];

const values = [
    { icon: '🇩🇯', title: 'Ancrage local', desc: 'Créés à Djibouti, pour les entrepreneurs djiboutiens et africains.' },
    { icon: '🔒', title: 'Confiance', desc: 'Vos données vous appartiennent. Sécurité et transparence sont au cœur de ce que nous faisons.' },
    { icon: '💡', title: 'Innovation', desc: 'Nous poussons sans cesse les limites de la technologie pour vous offrir le meilleur.' },
    { icon: '🤝', title: 'Partenariat', desc: 'Votre succès est notre succès. Nous grandissons ensemble.' },
];

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-slate-950 text-gray-100">
            {/* Header */}
            <div className="border-b border-cyan-500/20 bg-slate-900/80 backdrop-blur-xl">
                <div className="container mx-auto flex items-center gap-4 px-4 py-4">
                    <Link to="/" className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="text-sm">Accueil</span>
                    </Link>
                    <span className="text-gray-600">/</span>
                    <span className="text-sm text-gray-400">À propos</span>
                </div>
            </div>

            {/* Hero */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 py-24 text-center">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.12),transparent_70%)]" />
                <div className="relative container mx-auto px-4 max-w-3xl">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-300">
                        🇩🇯 100% Made in Djibouti
                    </div>
                    <h1 className="mb-6 text-4xl font-extrabold md:text-6xl">
                        <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Notre histoire
                        </span>
                    </h1>
                    <p className="text-lg text-gray-300 leading-relaxed">
                        Wadashaqayn est né d'un constat simple : les entreprises djiboutiennes méritent des outils de gestion modernes, fiables et adaptés à leur réalité. Nous avons construit la plateforme que nous aurions aimé avoir.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-16 max-w-4xl">
                {/* Mission */}
                <div className="mb-16 rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-8">
                    <div className="flex items-center gap-3 mb-4">
                        <Target className="h-6 w-6 text-indigo-400" />
                        <h2 className="text-xl font-bold text-white">Notre mission</h2>
                    </div>
                    <p className="text-gray-300 leading-relaxed text-lg">
                        Démocratiser l'accès aux outils de gestion d'entreprise de classe mondiale pour toutes les organisations djiboutiennes — PME, startups, ONG et institutions — en proposant une solution complète, intuitive et abordable.
                    </p>
                </div>

                {/* Valeurs */}
                <h2 className="mb-8 text-2xl font-bold text-white">Nos valeurs</h2>
                <div className="mb-16 grid gap-4 sm:grid-cols-2">
                    {values.map((v) => (
                        <div key={v.title} className="rounded-xl border border-white/10 bg-slate-900/50 p-5">
                            <div className="mb-2 text-2xl">{v.icon}</div>
                            <h3 className="mb-1 font-semibold text-white">{v.title}</h3>
                            <p className="text-sm text-gray-400">{v.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Équipe */}
                <h2 className="mb-8 text-2xl font-bold text-white">Nos équipes</h2>
                <div className="mb-16 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                    {team.map((t) => (
                        <div key={t.name} className="rounded-xl border border-white/10 bg-slate-900/50 p-5 text-center">
                            <div className="mb-2 text-3xl">{t.emoji}</div>
                            <h3 className="mb-1 text-sm font-semibold text-white">{t.name}</h3>
                            <p className="text-xs text-gray-400">{t.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Stats */}
                <div className="rounded-2xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 p-8">
                    <div className="grid grid-cols-3 gap-6 text-center">
                        {[{ v: '2024', l: 'Année de création' }, { v: '200+', l: 'Entreprises clientes' }, { v: '99.9%', l: 'Uptime garanti' }].map(s => (
                            <div key={s.l}>
                                <p className="text-3xl font-extrabold text-white mb-1">{s.v}</p>
                                <p className="text-sm text-gray-400">{s.l}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <footer className="border-t border-white/10 py-6 text-center text-sm text-gray-500">
                © {new Date().getFullYear()} Wadashaqayn ·{' '}
                <Link to="/privacy" className="hover:text-cyan-400">Confidentialité</Link>{' · '}
                <Link to="/terms" className="hover:text-cyan-400">CGU</Link>
            </footer>
        </div>
    );
}
