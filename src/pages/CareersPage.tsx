import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight, MapPin, Clock } from 'lucide-react';

const openings = [
    {
        title: 'Développeur Full-Stack (React / Node.js)',
        team: 'Technique',
        type: 'CDI',
        location: 'Djibouti-Ville',
        color: 'border-cyan-500/30 bg-cyan-500/10',
        accent: 'text-cyan-400',
    },
    {
        title: 'Designer UX/UI',
        team: 'Produit',
        type: 'CDI',
        location: 'Djibouti-Ville',
        color: 'border-purple-500/30 bg-purple-500/10',
        accent: 'text-purple-400',
    },
    {
        title: 'Responsable Support Client',
        team: 'Support',
        type: 'CDI',
        location: 'Djibouti-Ville',
        color: 'border-emerald-500/30 bg-emerald-500/10',
        accent: 'text-emerald-400',
    },
    {
        title: 'Commercial B2B & Partenariats',
        team: 'Commercial',
        type: 'CDI',
        location: 'Djibouti-Ville',
        color: 'border-orange-500/30 bg-orange-500/10',
        accent: 'text-orange-400',
    },
];

const perks = [
    { emoji: '💰', title: 'Salaire compétitif', desc: 'Rémunération attractive alignée sur le marché' },
    { emoji: '📚', title: 'Formation continue', desc: 'Budget formation et accès aux meilleures ressources' },
    { emoji: '🏠', title: 'Télétravail flexible', desc: 'Hybride, avec des jours de remoter work réguliers' },
    { emoji: '🚀', title: 'Impact réel', desc: 'Construisez des produits utilisés chaque jour' },
    { emoji: '🤝', title: 'Ambiance bienveillante', desc: 'Une équipe soudée et un management de proximité' },
    { emoji: '🏆', title: 'Évolution rapide', desc: 'Progressez dans une startup qui grandit vite' },
];

export default function CareersPage() {
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
                    <span className="text-sm text-gray-400">Carrières</span>
                </div>
            </div>

            {/* Hero */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-orange-950/30 to-slate-900 py-24 text-center">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.1),transparent_70%)]" />
                <div className="relative container mx-auto px-4">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm text-orange-300">
                        🚀 Rejoignez l'aventure
                    </div>
                    <h1 className="mb-4 text-4xl font-extrabold md:text-6xl">
                        <span className="bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                            Carrières
                        </span>
                    </h1>
                    <p className="mx-auto max-w-2xl text-lg text-gray-400">
                        Construisez le futur de la gestion d'entreprise en Afrique avec une équipe passionnée et engagée.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-16">
                {/* Perks */}
                <h2 className="mb-8 text-2xl font-bold text-white text-center">Pourquoi nous rejoindre ?</h2>
                <div className="mb-16 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                    {perks.map((p) => (
                        <div key={p.title} className="rounded-xl border border-white/10 bg-slate-900/50 p-5">
                            <div className="mb-2 text-2xl">{p.emoji}</div>
                            <h3 className="mb-1 font-semibold text-white">{p.title}</h3>
                            <p className="text-sm text-gray-400">{p.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Open Positions */}
                <h2 className="mb-8 text-2xl font-bold text-white">Postes ouverts</h2>
                <div className="space-y-4 mb-12">
                    {openings.map((job) => (
                        <div
                            key={job.title}
                            className={`group cursor-pointer rounded-xl border p-5 transition-all hover:scale-[1.01] ${job.color}`}
                        >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h3 className="font-semibold text-white mb-2">{job.title}</h3>
                                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                                        <span className={`rounded-full border border-current/30 px-2 py-0.5 ${job.accent}`}>{job.team}</span>
                                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {job.type}</span>
                                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {job.location}</span>
                                    </div>
                                </div>
                                <div className={`flex items-center gap-1 text-sm font-medium ${job.accent} opacity-0 group-hover:opacity-100 transition-opacity`}>
                                    Postuler <ChevronRight className="h-4 w-4" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Spontaneous application */}
                <div className="rounded-2xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 p-8 text-center">
                    <h3 className="mb-2 text-xl font-bold text-white">Pas de poste qui vous correspond ?</h3>
                    <p className="mb-4 text-gray-400">Envoyez-nous une candidature spontanée, nous sommes toujours à la recherche de talents.</p>
                    <a
                        href="mailto:careers@wadashaqayn.org"
                        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 px-6 py-3 text-sm font-semibold text-white hover:from-cyan-400 hover:to-purple-400 transition-all"
                    >
                        Candidature spontanée
                        <ChevronRight className="h-4 w-4" />
                    </a>
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
