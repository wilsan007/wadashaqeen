import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar, ChevronRight } from 'lucide-react';

const posts = [
    {
        tag: 'Produit',
        tagColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
        title: 'Wadashaqayn lance sa nouvelle vue Gantt interactive',
        excerpt: 'Découvrez comment la nouvelle vue Gantt révolutionne la planification de projet avec des fonctionnalités de glisser-déposer, des dépendances visuelles et la collaboration en temps réel.',
        date: '5 mai 2026',
        readTime: '4 min',
        emoji: '📅',
    },
    {
        tag: 'Conseil',
        tagColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        title: '5 pratiques RH pour booster la productivité de votre équipe',
        excerpt: 'Des études montrent que les entreprises qui gèrent efficacement leurs ressources humaines sont 25% plus productives. Voici les 5 pratiques incontournables à adopter dès maintenant.',
        date: '28 avril 2026',
        readTime: '6 min',
        emoji: '👥',
    },
    {
        tag: 'Entreprise',
        tagColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        title: 'Wadashaqayn : 200 entreprises djiboutiennes nous font confiance',
        excerpt: 'En moins de deux ans, Wadashaqayn est devenu la référence locale en gestion d\'entreprise. Retour sur notre parcours et les leçons apprises.',
        date: '20 avril 2026',
        readTime: '5 min',
        emoji: '🏆',
    },
    {
        tag: 'Tutoriel',
        tagColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
        title: 'Comment automatiser vos rapports hebdomadaires en 3 étapes',
        excerpt: 'Gagnez du temps en automatisant la génération de vos rapports d\'activité. Suivez ce guide simple pour mettre en place des rapports automatiques adaptés à votre équipe.',
        date: '12 avril 2026',
        readTime: '7 min',
        emoji: '⚡',
    },
    {
        tag: 'Produit',
        tagColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
        title: 'Module de formation : gérez les compétences de vos équipes',
        excerpt: 'Le nouveau module Formation permet de créer un catalogue de formations, de suivre les inscriptions et de mesurer l\'impact sur les performances individuelles.',
        date: '5 avril 2026',
        readTime: '4 min',
        emoji: '🎓',
    },
    {
        tag: 'Conseil',
        tagColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        title: 'Digitaliser votre PME : par où commencer ?',
        excerpt: 'La transformation numérique peut sembler complexe pour une PME. Voici un guide pratique pour digitaliser vos processus étape par étape, sans vous ruiner.',
        date: '28 mars 2026',
        readTime: '8 min',
        emoji: '💡',
    },
];

export default function BlogPage() {
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
                    <span className="text-sm text-gray-400">Blog</span>
                </div>
            </div>

            {/* Hero */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950/30 to-slate-900 py-20 text-center">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.1),transparent_70%)]" />
                <div className="relative container mx-auto px-4">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
                        ✍️ Articles & Actualités
                    </div>
                    <h1 className="mb-4 text-4xl font-extrabold md:text-6xl">
                        <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                            Blog Wadashaqayn
                        </span>
                    </h1>
                    <p className="mx-auto max-w-2xl text-lg text-gray-400">
                        Actualités produit, conseils de gestion et inspiration pour les entreprises modernes.
                    </p>
                </div>
            </div>

            {/* Posts Grid */}
            <div className="container mx-auto px-4 py-16">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {posts.map((post) => (
                        <article
                            key={post.title}
                            className="group cursor-pointer rounded-2xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-sm transition-all hover:border-blue-500/40 hover:bg-slate-800/50"
                        >
                            <div className="mb-4 flex items-center justify-between">
                                <span className={`rounded-full border px-3 py-1 text-xs font-medium ${post.tagColor}`}>
                                    {post.tag}
                                </span>
                                <span className="text-3xl">{post.emoji}</span>
                            </div>
                            <h2 className="mb-3 text-base font-bold text-white leading-snug group-hover:text-cyan-300 transition-colors">
                                {post.title}
                            </h2>
                            <p className="mb-4 text-sm text-gray-400 leading-relaxed line-clamp-3">
                                {post.excerpt}
                            </p>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {post.date}
                                    </span>
                                    <span>{post.readTime} de lecture</span>
                                </div>
                                <ChevronRight className="h-4 w-4 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </article>
                    ))}
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
