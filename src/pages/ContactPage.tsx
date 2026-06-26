import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, MessageCircle, MapPin, Send, CheckCircle2 } from 'lucide-react';

export default function ContactPage() {
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
    };

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
                    <span className="text-sm text-gray-400">Contact</span>
                </div>
            </div>

            {/* Hero */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-pink-950/30 to-slate-900 py-20 text-center">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(236,72,153,0.1),transparent_70%)]" />
                <div className="relative container mx-auto px-4">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-pink-500/30 bg-pink-500/10 px-4 py-2 text-sm text-pink-300">
                        💬 On vous répond rapidement
                    </div>
                    <h1 className="mb-4 text-4xl font-extrabold md:text-6xl">
                        <span className="bg-gradient-to-r from-pink-400 via-rose-400 to-orange-400 bg-clip-text text-transparent">
                            Contactez-nous
                        </span>
                    </h1>
                    <p className="mx-auto max-w-2xl text-lg text-gray-400">
                        Une question, un projet, une démo ? Nous sommes là pour vous aider.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-16 max-w-5xl">
                <div className="grid gap-12 md:grid-cols-2">
                    {/* Contact info */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-white">Nos coordonnées</h2>

                        <div className="flex items-start gap-4 rounded-xl border border-white/10 bg-slate-900/50 p-5">
                            <Mail className="mt-1 h-5 w-5 flex-shrink-0 text-cyan-400" />
                            <div>
                                <p className="font-medium text-white">Email</p>
                                <a href="mailto:contact@wadashaqayn.org" className="text-sm text-cyan-400 hover:text-cyan-300">
                                    contact@wadashaqayn.org
                                </a>
                                <p className="mt-1 text-xs text-gray-500">Réponse sous 24h ouvrées</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 rounded-xl border border-white/10 bg-slate-900/50 p-5">
                            <MessageCircle className="mt-1 h-5 w-5 flex-shrink-0 text-emerald-400" />
                            <div>
                                <p className="font-medium text-white">WhatsApp</p>
                                <a href="https://wa.me/25377621524" target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-400 hover:text-emerald-300">
                                    +253 77 62 15 24
                                </a>
                                <p className="mt-1 text-xs text-gray-500">Du dim. au ven., 8h–18h (heure de Djibouti)</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 rounded-xl border border-white/10 bg-slate-900/50 p-5">
                            <MapPin className="mt-1 h-5 w-5 flex-shrink-0 text-purple-400" />
                            <div>
                                <p className="font-medium text-white">Adresse</p>
                                <p className="text-sm text-gray-400">Djibouti-Ville, République de Djibouti</p>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <div>
                        <h2 className="mb-6 text-xl font-bold text-white">Envoyer un message</h2>
                        {submitted ? (
                            <div className="flex flex-col items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-12 text-center">
                                <CheckCircle2 className="mb-4 h-12 w-12 text-emerald-400" />
                                <h3 className="mb-2 text-lg font-bold text-white">Message envoyé !</h3>
                                <p className="text-gray-400">Nous vous répondrons dans les plus brefs délais.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-300">Nom complet</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Votre nom"
                                        className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-300">Email</label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="votre@email.com"
                                        className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-300">Sujet</label>
                                    <select className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-4 py-3 text-sm text-white focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50">
                                        <option value="">Choisir un sujet</option>
                                        <option>Demande de démo</option>
                                        <option>Question commerciale</option>
                                        <option>Support technique</option>
                                        <option>Partenariat</option>
                                        <option>Autre</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-300">Message</label>
                                    <textarea
                                        required
                                        rows={5}
                                        placeholder="Décrivez votre besoin…"
                                        className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 resize-none"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 font-semibold text-white transition-all hover:from-cyan-400 hover:to-blue-400"
                                >
                                    <Send className="h-4 w-4" />
                                    Envoyer le message
                                </button>
                            </form>
                        )}
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
