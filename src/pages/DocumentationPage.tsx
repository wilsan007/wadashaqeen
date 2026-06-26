import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Search, ChevronRight, Zap, Users, BarChart3, Clock } from 'lucide-react';

const sections = [
    {
        icon: '🚀',
        title: 'Démarrage rapide',
        description: 'Installez et configurez Wadashaqayn en moins de 5 minutes.',
        links: ['Créer votre compte', 'Configurer votre espace', 'Inviter votre équipe'],
    },
    {
        icon: '📋',
        title: 'Gestion de tâches',
        description: 'Apprenez à créer, assigner et suivre vos tâches efficacement.',
        links: ['Créer une tâche', 'Vue Kanban', 'Vue Gantt', 'Filtres et tris'],
    },
    {
        icon: '👥',
        title: 'Ressources Humaines',
        description: 'Gérez vos collaborateurs, congés, pointages et performances.',
        links: ['Ajouter un employé', 'Gérer les congés', 'Suivi des présences', 'Fiches de paie'],
    },
    {
        icon: '📊',
        title: 'Rapports & Analytics',
        description: 'Analysez vos données et prenez de meilleures décisions.',
        links: ['Tableaux de bord', 'Exporter les données', 'Rapports personnalisés'],
    },
    {
        icon: '⚙️',
        title: 'Administration',
        description: 'Configurez les permissions, rôles et paramètres de votre organisation.',
        links: ['Gérer les rôles', 'Paramètres de sécurité', 'Intégrations API'],
    },
    {
        icon: '🔗',
        title: 'Intégrations',
        description: 'Connectez Wadashaqayn à vos outils existants.',
        links: ['API REST', 'Webhooks', 'Export/Import CSV'],
    },
];

export default function DocumentationPage() {
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
                    <span className="text-sm text-gray-400">Documentation</span>
                </div>
            </div>

            {/* Hero */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-cyan-950/30 to-slate-900 py-20 text-center">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.1),transparent_70%)]" />
                <div className="relative container mx-auto px-4">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-300">
                        <BookOpen className="h-4 w-4" />
                        Documentation officielle
                    </div>
                    <h1 className="mb-4 text-4xl font-extrabold md:text-6xl">
                        <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                            Documentation
                        </span>
                    </h1>
                    <p className="mx-auto max-w-2xl text-lg text-gray-400">
                        Tout ce dont vous avez besoin pour maîtriser Wadashaqayn et optimiser votre productivité.
                    </p>
                    {/* Search bar */}
                    <div className="mx-auto mt-8 flex max-w-xl items-center gap-3 rounded-xl border border-cyan-500/30 bg-slate-800/50 px-4 py-3 backdrop-blur-sm">
                        <Search className="h-5 w-5 text-gray-500" />
                        <span className="text-gray-500">Rechercher dans la documentation…</span>
                    </div>
                </div>
            </div>

            {/* Sections Grid */}
            <div className="container mx-auto px-4 py-16">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {sections.map((section) => (
                        <div
                            key={section.title}
                            className="group rounded-2xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-sm transition-all hover:border-cyan-500/40 hover:bg-slate-800/50"
                        >
                            <div className="mb-3 text-3xl">{section.icon}</div>
                            <h2 className="mb-2 text-lg font-bold text-white">{section.title}</h2>
                            <p className="mb-4 text-sm text-gray-400">{section.description}</p>
                            <ul className="space-y-2">
                                {section.links.map((link) => (
                                    <li key={link} className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 cursor-pointer">
                                        <ChevronRight className="h-3 w-3" />
                                        {link}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <div className="mt-16 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 p-8 text-center">
                    <h3 className="mb-2 text-xl font-bold text-white">Besoin d'aide supplémentaire ?</h3>
                    <p className="mb-4 text-gray-400">Notre équipe support est disponible pour vous accompagner.</p>
                    <Link
                        to="/support"
                        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 text-sm font-semibold text-white hover:from-cyan-400 hover:to-blue-400 transition-all"
                    >
                        Contacter le support
                        <ChevronRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>

            {/* Footer mini */}
            <footer className="border-t border-white/10 py-6 text-center text-sm text-gray-500">
                © {new Date().getFullYear()} Wadashaqayn ·{' '}
                <Link to="/privacy" className="hover:text-cyan-400">Confidentialité</Link>{' · '}
                <Link to="/terms" className="hover:text-cyan-400">CGU</Link>
            </footer>
        </div>
    );
}
