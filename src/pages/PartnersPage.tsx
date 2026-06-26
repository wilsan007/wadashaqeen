import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Globe, Users, Zap } from 'lucide-react';

const partners = [
    {
        category: 'Partenaires Technologiques',
        emoji: '⚙️',
        color: 'border-cyan-500/30 bg-cyan-500/10',
        accent: 'text-cyan-400',
        list: [
            { name: 'Supabase', desc: 'Infrastructure base de données et authentification', logo: '🗄️' },
            { name: 'Vercel', desc: 'Hébergement et déploiement cloud', logo: '▲' },
            { name: 'Stripe', desc: 'Traitement des paiements sécurisés', logo: '💳' },
        ],
    },
    {
        category: 'Partenaires Commerciaux',
        emoji: '🤝',
        color: 'border-purple-500/30 bg-purple-500/10',
        accent: 'text-purple-400',
        list: [
            { name: 'Intégrateurs certifiés', desc: 'Revendeurs et consultants agréés Wadashaqayn', logo: '🏢' },
            { name: 'Cabinets RH', desc: 'Partenaires en conseil en ressources humaines', logo: '👔' },
            { name: 'Associations métier', desc: 'Chambres de commerce et syndicats professionnels', logo: '🏛️' },
        ],
    },
    {
        category: 'Partenaires Institutionnels',
        emoji: '🏛️',
        color: 'border-emerald-500/30 bg-emerald-500/10',
        accent: 'text-emerald-400',
        list: [
            { name: 'Gouvernement Djiboutien', desc: 'Soutien au développement de solutions locales', logo: '🇩🇯' },
            { name: 'Incubateurs Tech', desc: 'Partenaires pour l\'écosystème startup africain', logo: '🚀' },
            { name: 'Universités', desc: 'Programmes de formation et de recherche', logo: '🎓' },
        ],
    },
];

const benefits = [
    { icon: '💡', title: 'Formation & Support', desc: 'Accès prioritaire à la formation et aux ressources techniques' },
    { icon: '📈', title: 'Commission attractive', desc: 'Programme de commission compétitif sur les ventes générées' },
    { icon: '🏷️', title: 'Badge Partenaire', desc: 'Certification officielle et mise en avant sur notre plateforme' },
    { icon: '🤝', title: 'Co-marketing', desc: 'Actions marketing conjointes et visibilité partagée' },
];

export default function PartnersPage() {
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
                    <span className="text-sm text-gray-400">Partenaires</span>
                </div>
            </div>

            {/* Hero */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-teal-950/30 to-slate-900 py-24 text-center">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(20,184,166,0.1),transparent_70%)]" />
                <div className="relative container mx-auto px-4">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-2 text-sm text-teal-300">
                        <Globe className="h-4 w-4" />
                        Réseau de partenaires
                    </div>
                    <h1 className="mb-4 text-4xl font-extrabold md:text-6xl">
                        <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                            Partenaires
                        </span>
                    </h1>
                    <p className="mx-auto max-w-2xl text-lg text-gray-400">
                        Ensemble, nous construisons l'écosystème numérique de demain. Rejoignez notre réseau de partenaires de confiance.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-16">
                {/* Partners list */}
                {partners.map((group) => (
                    <div key={group.category} className="mb-12">
                        <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-white">
                            <span>{group.emoji}</span>
                            {group.category}
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-3">
                            {group.list.map((p) => (
                                <div
                                    key={p.name}
                                    className={`rounded-xl border p-5 transition-all hover:scale-[1.02] ${group.color}`}
                                >
                                    <div className="mb-3 text-2xl">{p.logo}</div>
                                    <h3 className={`mb-1 font-semibold ${group.accent}`}>{p.name}</h3>
                                    <p className="text-sm text-gray-400">{p.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Become a partner */}
                <div className="mt-8 rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 p-8 md:p-12">
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="mb-4 text-2xl font-bold text-white">Devenez partenaire</h2>
                        <p className="mb-8 text-gray-400">
                            Rejoignez notre réseau et bénéficiez d'avantages exclusifs pour développer votre activité.
                        </p>
                        <div className="mb-8 grid gap-4 sm:grid-cols-2">
                            {benefits.map((b) => (
                                <div key={b.title} className="rounded-xl border border-white/10 bg-slate-900/50 p-4 text-left">
                                    <div className="mb-1 text-xl">{b.icon}</div>
                                    <h4 className="mb-1 text-sm font-semibold text-white">{b.title}</h4>
                                    <p className="text-xs text-gray-400">{b.desc}</p>
                                </div>
                            ))}
                        </div>
                        <a
                            href="mailto:partenaires@wadashaqayn.org"
                            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 px-8 py-3 font-semibold text-white hover:from-cyan-400 hover:to-purple-400 transition-all"
                        >
                            Devenir partenaire
                            <ChevronRight className="h-4 w-4" />
                        </a>
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
