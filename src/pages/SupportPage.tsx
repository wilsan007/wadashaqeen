import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, MessageCircle, Clock, CheckCircle2, ChevronRight } from 'lucide-react';

const faqs = [
    { q: 'Comment réinitialiser mon mot de passe ?', a: 'Rendez-vous sur la page de connexion, cliquez sur "Mot de passe oublié" et suivez les instructions envoyées à votre email.' },
    { q: 'Comment inviter des membres à mon organisation ?', a: 'Dans les paramètres de votre organisation, allez dans "Membres" puis cliquez sur "Inviter". Entrez l\'email de la personne et choisissez son rôle.' },
    { q: 'Est-ce que mes données sont sécurisées ?', a: 'Oui, toutes vos données sont chiffrées en transit (TLS) et au repos (AES-256). Nos serveurs respectent les normes ISO 27001.' },
    { q: 'Comment exporter mes données ?', a: 'Dans les paramètres > Données, vous pouvez exporter l\'ensemble de vos données au format CSV ou JSON à tout moment.' },
    { q: 'Puis-je changer de formule tarifaire ?', a: 'Oui, vous pouvez passer à une formule supérieure ou inférieure à tout moment depuis votre espace de facturation.' },
    { q: 'Quelle est la durée de l\'essai gratuit ?', a: 'L\'essai gratuit dure 14 jours, sans carte bancaire requise. Toutes les fonctionnalités sont disponibles pendant cette période.' },
];

export default function SupportPage() {
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
                    <span className="text-sm text-gray-400">Support</span>
                </div>
            </div>

            {/* Hero */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-950/30 to-slate-900 py-20 text-center">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.1),transparent_70%)]" />
                <div className="relative container mx-auto px-4">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
                        🛟 Centre d'aide
                    </div>
                    <h1 className="mb-4 text-4xl font-extrabold md:text-6xl">
                        <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                            Support & Assistance
                        </span>
                    </h1>
                    <p className="mx-auto max-w-2xl text-lg text-gray-400">
                        Notre équipe est disponible pour vous aider à chaque étape.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-16">
                {/* Contact Cards */}
                <div className="mb-16 grid gap-6 md:grid-cols-3">
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
                        <Mail className="mx-auto mb-3 h-8 w-8 text-emerald-400" />
                        <h3 className="mb-1 font-bold text-white">Par email</h3>
                        <p className="mb-3 text-sm text-gray-400">Réponse sous 24h ouvrées</p>
                        <a href="mailto:support@wadashaqayn.org" className="text-emerald-400 hover:text-emerald-300 text-sm font-medium">
                            support@wadashaqayn.org
                        </a>
                    </div>
                    <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-6 text-center">
                        <MessageCircle className="mx-auto mb-3 h-8 w-8 text-cyan-400" />
                        <h3 className="mb-1 font-bold text-white">WhatsApp</h3>
                        <p className="mb-3 text-sm text-gray-400">Du dim. au ven., 8h–18h</p>
                        <a href="https://wa.me/25377621524" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 text-sm font-medium">
                            +253 77 62 15 24
                        </a>
                    </div>
                    <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-6 text-center">
                        <Clock className="mx-auto mb-3 h-8 w-8 text-blue-400" />
                        <h3 className="mb-1 font-bold text-white">Documentation</h3>
                        <p className="mb-3 text-sm text-gray-400">Disponible 24h/24</p>
                        <Link to="/documentation" className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center justify-center gap-1">
                            Voir la doc <ChevronRight className="h-3 w-3" />
                        </Link>
                    </div>
                </div>

                {/* FAQ */}
                <h2 className="mb-8 text-2xl font-bold text-white">Questions fréquentes</h2>
                <div className="space-y-4">
                    {faqs.map((faq) => (
                        <div key={faq.q} className="rounded-xl border border-white/10 bg-slate-900/50 p-5">
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400" />
                                <div>
                                    <h3 className="mb-2 font-semibold text-white">{faq.q}</h3>
                                    <p className="text-sm text-gray-400 leading-relaxed">{faq.a}</p>
                                </div>
                            </div>
                        </div>
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
