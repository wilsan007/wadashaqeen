import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  Zap,
  Users,
  BarChart3,
  Shield,
  Clock,
  Globe,
  Menu,
  X,
  Mail,
  MessageCircle,
  TrendingUp,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import FuturisticBackground from '@/components/ui/FuturisticBackground';
import SplineStyleCarousel from '@/components/landing/SplineStyleCarousel';
import { HolographicBentoGrid } from '@/components/landing/HolographicBento';
import { NeonSolutionCards } from '@/components/landing/NeonSolutions';
import { CyberpunkPricing } from '@/components/landing/CyberpunkPricing';
import { StatsExcellence } from '@/components/landing/StatsExcellence';
import { DashboardPreview } from '@/components/landing/DashboardPreview';
import { Testimonials } from '@/components/landing/Testimonials';

// Module Card Component
interface ModuleCardProps {
  icon: string;
  title: string;
  description: string;
  status: 'Disponible' | 'Bientôt';
  color: string;
}

function ModuleCard({ icon, title, description, status, color }: ModuleCardProps) {
  return (
    <div
      className={`group min-w-[280px] flex-shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br shadow-xl transition-all hover:scale-105 hover:shadow-2xl sm:min-w-[320px] md:min-w-[380px] ${color}`}
    >
      <div className="p-6 sm:p-8">
        <div className="mb-4 flex items-start justify-between sm:mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-4xl backdrop-blur-sm sm:h-20 sm:w-20 sm:text-5xl">
            {icon}
          </div>
          <span
            className={`rounded-full px-3 py-1.5 text-xs font-bold sm:px-4 sm:py-2 ${
              status === 'Disponible' ? 'bg-white/90 text-green-700' : 'bg-white/60 text-orange-700'
            }`}
          >
            {status}
          </span>
        </div>
        <h3 className="mb-2 text-xl font-bold text-white sm:mb-3 sm:text-2xl">{title}</h3>
        <p className="text-sm leading-relaxed text-white/90 sm:text-base">{description}</p>
      </div>
      <div className="h-2 w-full bg-white/20"></div>
    </div>
  );
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const navigate = useNavigate();
  const location = useLocation();

  // Redirection automatique si on détecte une invitation sur la page d'accueil
  // (Cas où Supabase redirige vers la Site URL au lieu de /auth/callback)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('invitation') === 'true') {
      console.log('🔄 Redirection invitation détectée vers /auth/callback');
      navigate(`/auth/callback${location.search}${location.hash}`);
    }
  }, [location, navigate]);

  const pricingMultiplier = {
    monthly: 1,
    quarterly: 0.9, // 10% réduction
    yearly: 0.75, // 25% réduction
  };

  // Modules data for infinite carousel
  const modules = [
    {
      icon: '📊',
      title: 'Tableaux de bord',
      description: 'Visualisez vos KPIs en temps réel',
      status: 'Disponible' as const,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: '📋',
      title: 'Gestion de tâches',
      description: 'Organisez et suivez vos projets',
      status: 'Disponible' as const,
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: '📅',
      title: 'Vue Gantt',
      description: 'Planification visuelle de projets',
      status: 'Disponible' as const,
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: '🎯',
      title: 'Vue Kanban',
      description: 'Workflow agile et flexible',
      status: 'Disponible' as const,
      color: 'from-orange-500 to-red-500',
    },
    {
      icon: '👥',
      title: 'Gestion RH',
      description: 'Équipes, absences, performances',
      status: 'Disponible' as const,
      color: 'from-indigo-500 to-purple-500',
    },
    {
      icon: '⏱️',
      title: 'Suivi du temps',
      description: 'Timesheet et pointage',
      status: 'Disponible' as const,
      color: 'from-teal-500 to-cyan-500',
    },
    {
      icon: '💰',
      title: 'Notes de frais',
      description: 'Gestion des dépenses',
      status: 'Disponible' as const,
      color: 'from-yellow-500 to-orange-500',
    },
    {
      icon: '🎓',
      title: 'Formation',
      description: 'Catalogue et suivi des formations',
      status: 'Disponible' as const,
      color: 'from-pink-500 to-rose-500',
    },
    {
      icon: '🤖',
      title: 'Automatisations',
      description: 'Workflows sans code',
      status: 'Bientôt' as const,
      color: 'from-violet-500 to-purple-500',
    },
    {
      icon: '📈',
      title: 'Analytics avancés',
      description: 'IA et prédictions',
      status: 'Bientôt' as const,
      color: 'from-blue-600 to-indigo-600',
    },
    {
      icon: '🔔',
      title: 'Notifications',
      description: 'Alertes temps réel',
      status: 'Disponible' as const,
      color: 'from-red-500 to-pink-500',
    },
    {
      icon: '📱',
      title: 'Application mobile',
      description: 'iOS et Android',
      status: 'Bientôt' as const,
      color: 'from-cyan-500 to-blue-500',
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <FuturisticBackground />
      {/* Background Overlay for slight tint */}
      <div className="pointer-events-none absolute inset-0 bg-blue-950/10 mix-blend-overlay" />
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-slate-900/80 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <img src="/logo-w.svg" alt="Wadashaqayn" className="h-8 w-8" />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-lg font-bold text-transparent md:text-xl">
              Wadashaqayn
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="font-medium text-gray-300 transition-colors hover:text-cyan-400"
            >
              Fonctionnalités
            </a>
            <a
              href="#solutions"
              className="font-medium text-gray-300 transition-colors hover:text-cyan-400"
            >
              Solutions
            </a>
            <a
              href="#pricing"
              className="font-medium text-gray-300 transition-colors hover:text-cyan-400"
            >
              Tarifs
            </a>
            <a
              href="#about"
              className="font-medium text-gray-300 transition-colors hover:text-cyan-400"
            >
              À propos
            </a>
          </div>

          {/* CTA Buttons */}
          <div className="hidden sm:block">
            <Link to="/login">
              <Button
                variant="outline"
                size="sm"
                className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
              >
                Se connecter
              </Button>
            </Link>
            <Link to="/auth/signup">
              <Button
                size="sm"
                className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 shadow-lg shadow-cyan-500/50 hover:from-cyan-400 hover:via-blue-400 hover:to-purple-400"
              >
                Commencer gratuitement
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-gray-300 transition-colors hover:bg-cyan-500/10 md:hidden"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-white/10 bg-slate-900/95 backdrop-blur-xl md:hidden">
            <div className="container mx-auto flex flex-col gap-3 px-4 py-4">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-base font-medium text-gray-300 transition-colors hover:text-cyan-400"
              >
                Fonctionnalités
              </a>
              <a
                href="#solutions"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-base font-medium text-gray-300 transition-colors hover:text-cyan-400"
              >
                Solutions
              </a>
              <a
                href="#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-base font-medium text-gray-300 transition-colors hover:text-cyan-400"
              >
                Tarifs
              </a>
              <a
                href="#about"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-base font-medium text-gray-300 transition-colors hover:text-cyan-400"
              >
                À propos
              </a>
              <div className="flex flex-col gap-2 border-t border-white/10 pt-3">
                <Link to="/login" className="w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
                  >
                    Se connecter
                  </Button>
                </Link>
                <Link to="/auth/signup" className="w-full">
                  <Button
                    size="sm"
                    className="w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 shadow-lg shadow-cyan-500/50"
                  >
                    Commencer gratuitement
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-4 pt-20 pb-10 text-center sm:pt-24 sm:pb-12 md:pt-32 md:pb-20">
        <div className="mx-auto max-w-5xl">
          {/* Badge new */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-gradient-to-r from-cyan-500/15 to-purple-500/15 px-4 py-2 text-sm font-medium text-cyan-300 shadow-lg shadow-cyan-500/20 backdrop-blur-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500" />
            </span>
            <Zap className="h-4 w-4 text-cyan-400" />
            <span>La plateforme de gestion tout-en-un · 100% Djiboutienne</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mb-4 px-2 text-3xl leading-tight font-extrabold text-white drop-shadow-2xl sm:text-4xl md:text-6xl lg:text-7xl"
          >
            Pilotez tout votre{' '}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                business
              </span>
              <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-cyan-400/0 via-blue-400/70 to-purple-400/0" />
            </span>
            {' '}depuis un seul endroit
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mb-8 px-4 text-base leading-relaxed text-gray-300 sm:text-xl md:text-2xl"
          >
            Projets · Équipes · RH · Temps · Dépenses — tout centralisé, en temps réel.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col items-center justify-center gap-3 px-4 sm:flex-row sm:gap-4"
          >
            <Link to="/auth/signup" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="group h-14 w-full transform bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 px-8 text-base font-bold shadow-2xl shadow-cyan-500/40 transition-all duration-300 hover:scale-105 hover:shadow-cyan-500/60 sm:w-auto sm:text-lg"
              >
                Démarrer gratuitement
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="h-14 w-full border-white/20 bg-white/5 text-white backdrop-blur-sm hover:border-cyan-500/50 hover:bg-cyan-500/10 sm:w-auto"
              >
                Se connecter
              </Button>
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-4 px-4 text-xs text-gray-400 sm:text-sm"
          >
            {['Essai gratuit 14 jours', 'Sans carte bancaire', 'Configuration 2 min'].map(item => (
              <span key={item} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                {item}
              </span>
            ))}
          </motion.p>

          {/* Social proof numbers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-6 sm:gap-10"
          >
            {[
              { value: '200+', label: 'Entreprises clientes' },
              { value: '12', label: 'Modules intégrés' },
              { value: '99.9%', label: 'Uptime garanti' },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-extrabold text-white sm:text-3xl">{stat.value}</p>
                <p className="text-xs text-slate-400 sm:text-sm">{stat.label}</p>
              </div>
            ))}
            <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2">
              <span className="text-2xl">🇩🇯</span>
              <div className="text-left">
                <p className="text-xs font-bold text-emerald-300">100% Local</p>
                <p className="text-[10px] text-emerald-500">Made in Djibouti</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3D Platform Preview - Immersive */}
      <section className="relative z-10 overflow-hidden py-12 sm:py-20">
        <div className="perspective-1000 container mx-auto px-4">
          <div className="relative mb-12 text-center">
            <div className="pointer-events-none absolute top-1/2 left-1/2 h-32 w-1/2 -translate-x-1/2 -translate-y-1/2 bg-purple-500/20 blur-[100px]" />
            <h2 className="relative z-10 mb-3 bg-gradient-to-r from-white via-cyan-100 to-purple-200 bg-clip-text px-2 text-3xl font-bold text-transparent sm:mb-4 sm:text-4xl md:text-5xl">
              Aperçu de la plateforme
            </h2>
            <p className="relative z-10 mx-auto max-w-2xl px-4 text-base text-gray-400 sm:text-xl">
              Tableau de bord intuitif pour piloter votre activité
            </p>
          </div>

          <motion.div
            initial={{ transform: 'rotateX(20deg) scale(0.9)', opacity: 0 }}
            whileInView={{ transform: 'rotateX(0deg) scale(1)', opacity: 1 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="relative mx-auto w-full max-w-[90rem] rounded-2xl border border-white/10 bg-slate-900/50 p-2 shadow-2xl backdrop-blur-sm sm:p-4 md:rounded-3xl md:p-6"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Glow behind image */}
            <div className="absolute -inset-4 -z-10 rounded-[3rem] bg-gradient-to-r from-cyan-500/30 to-purple-500/30 blur-2xl" />

            {/* Browser Bezel */}
            <div className="relative overflow-hidden rounded-xl border border-white/5 bg-slate-950 shadow-2xl md:rounded-2xl">
              {/* Browser Header */}
              <div className="flex items-center gap-2 border-b border-white/5 bg-slate-900/50 px-4 py-3 backdrop-blur-md">
                <div className="flex gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500/50" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/50" />
                  <div className="h-3 w-3 rounded-full bg-green-500/50" />
                </div>
                <div className="mx-auto flex h-6 w-1/2 max-w-md items-center justify-center rounded-full bg-slate-800/50 text-[10px] text-slate-500">
                  wadashaqayn.app/dashboard
                </div>
              </div>

              {/* Live Dashboard Preview */}
              <div className="group relative aspect-[16/10] w-full overflow-hidden bg-slate-950 md:aspect-[16/9] lg:aspect-[20/10] xl:aspect-auto xl:h-[700px]">
                <DashboardPreview />

                {/* Interactive Shine Effect on Hover */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Excellence Locale Section - Redesignée */}
      <section className="relative z-10 border-y border-cyan-500/20 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 py-10 backdrop-blur-sm sm:py-12 md:py-16">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzIxMjEyMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20"></div>
        <div className="relative z-10 container mx-auto px-4">
          <div className="mb-6 text-center sm:mb-8">
            <h2 className="mb-2 bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text px-2 text-2xl font-bold text-transparent sm:mb-3 sm:text-3xl">
              Une Solution 100% Locale, Une Expertise Internationale
            </h2>
            <p className="px-4 text-base text-gray-300 sm:text-lg">
              Faites confiance à l'excellence des compétences nationales
            </p>
          </div>

          <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
            <div className="group rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-green-500/10 p-6 text-center shadow-xl shadow-emerald-500/20 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-emerald-500/40 sm:rounded-2xl sm:p-8">
              <div className="mb-3 text-4xl sm:mb-4 sm:text-5xl">🇩🇯</div>
              <h3 className="mb-2 text-lg font-bold text-emerald-300 sm:text-xl">
                Développé à Djibouti
              </h3>
              <p className="text-sm text-gray-300 sm:text-base">
                Par des talents locaux, pour les entreprises djiboutiennes et au-delà
              </p>
            </div>

            <div className="group rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-6 text-center shadow-xl shadow-cyan-500/20 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-cyan-500/40 sm:rounded-2xl sm:p-8">
              <div className="mb-3 text-4xl sm:mb-4 sm:text-5xl">🏆</div>
              <h3 className="mb-2 text-lg font-bold text-cyan-300 sm:text-xl">
                Expertise Nationale
              </h3>
              <p className="text-sm text-gray-300 sm:text-base">
                Innovation technologique portée par des compétences djiboutiennes qualifiées
              </p>
            </div>

            <div className="group rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-6 text-center shadow-xl shadow-purple-500/20 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-purple-500/40 sm:rounded-2xl sm:p-8">
              <div className="mb-3 text-4xl sm:mb-4 sm:text-5xl">💼</div>
              <h3 className="mb-2 text-lg font-bold text-purple-300 sm:text-xl">Support Local</h3>
              <p className="text-sm text-gray-300 sm:text-base">
                Assistance en français et arabe, adaptée à votre contexte culturel
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Holographic Bento */}
      <section
        id="features"
        className="relative z-10 container mx-auto px-4 py-12 sm:py-16 md:py-20"
      >
        <div className="mb-10 text-center sm:mb-12 md:mb-16">
          <h2 className="mb-3 bg-gradient-to-r from-white via-cyan-100 to-white bg-clip-text px-2 text-3xl font-bold text-transparent sm:mb-4 sm:text-4xl md:text-5xl">
            Tout ce dont vous avez besoin pour réussir
          </h2>
          <p className="mx-auto max-w-2xl px-4 text-base text-gray-300 sm:text-xl">
            Une suite complète d'outils pour gérer vos projets, équipes et processus
          </p>
        </div>

        <HolographicBentoGrid />
      </section>

      {/* Modules Carousel Section - Spline Style */}
      <section className="relative z-10 overflow-hidden border-y border-cyan-500/10 bg-gradient-to-b from-slate-900/30 to-slate-800/30 py-12 backdrop-blur-sm sm:py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="mb-8 text-center sm:mb-10 md:mb-12">
            <h2 className="mb-3 bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text px-2 text-3xl font-bold text-transparent sm:mb-4 sm:text-4xl md:text-5xl">
              Tous vos outils en un seul endroit
            </h2>
            <p className="mx-auto max-w-2xl px-4 text-base text-gray-300 sm:text-xl">
              Une plateforme complète au design immersif
            </p>
          </div>

          {/* 3D Spline Style Carousel */}
          <SplineStyleCarousel />
        </div>
      </section>

      {/* Solutions Section - Neon Glass */}
      <section
        id="solutions"
        className="relative z-10 border-y border-purple-500/10 bg-slate-900/50 py-20 backdrop-blur-sm"
      >
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center sm:mb-16">
            <h2 className="mb-3 bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text px-2 text-3xl font-bold text-transparent sm:mb-4 sm:text-4xl md:text-5xl">
              Des solutions pour chaque équipe
            </h2>
            <p className="mx-auto max-w-2xl px-4 text-base text-gray-300 sm:text-xl">
              De la gestion de projet aux RH, Wadashaqayn s'adapte à tous vos besoins
            </p>
          </div>

          <NeonSolutionCards />
        </div>
      </section>

      {/* Pricing Section - Cyberpunk Style */}
      <section id="pricing" className="relative z-10 container mx-auto px-4 py-20">
        <div className="mb-12 text-center sm:mb-16">
          <h2 className="mb-3 bg-gradient-to-r from-cyan-300 via-white to-purple-300 bg-clip-text px-2 text-3xl font-bold text-transparent sm:mb-4 sm:text-4xl md:text-5xl">
            Des tarifs adaptés à votre équipe
          </h2>
          <p className="mx-auto max-w-2xl px-4 text-base text-gray-300 sm:text-xl">
            Choisissez la formule qui correspond à la taille de votre entreprise
          </p>
        </div>

        <CyberpunkPricing />
        {/* Moyens de Paiement */}
        <div className="mx-2 mt-8 rounded-xl border-2 border-gray-200 bg-white p-5 sm:mx-0 sm:mt-12 sm:rounded-2xl sm:p-6 md:mt-16 md:p-8">
          <div className="text-center">
            <p className="mb-4 px-4 text-sm text-gray-600 sm:mb-6 sm:text-base">
              Notre équipe est là pour vous accompagner
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <a href="mailto:support@wadashaqayn.org" className="inline-flex w-full sm:w-auto">
                <Button variant="outline" className="w-full gap-2 text-xs sm:w-auto sm:text-sm">
                  <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="truncate">support@wadashaqayn.org</span>
                </Button>
              </a>
              <a
                href="https://wa.me/25377621524"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full sm:w-auto"
              >
                <Button className="w-full gap-2 bg-green-600 text-xs hover:bg-green-700 sm:w-auto sm:text-sm">
                  <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="truncate">WhatsApp: +253 77 62 15 24</span>
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      <StatsExcellence />

      {/* Testimonials */}
      <Testimonials />

      {/* CTA Section */}
      <section className="relative z-10 container mx-auto px-4 py-12 sm:py-16 md:py-20">
        <div className="rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 p-8 text-center text-white shadow-2xl shadow-cyan-500/30 sm:rounded-3xl sm:p-10 md:p-12 lg:p-16">
          <h2 className="mb-3 text-2xl font-bold sm:mb-4 sm:text-3xl md:text-4xl lg:text-5xl">
            Prêt à transformer votre façon de travailler ?
          </h2>
          <p className="mb-6 px-4 text-base opacity-90 sm:mb-8 sm:text-lg md:text-xl">
            Rejoignez les entreprises qui ont choisi Wadashaqayn
          </p>
          <div className="flex flex-col items-center justify-center gap-3 px-4 sm:gap-4">
            <Link to="/auth/signup" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="secondary"
                className="h-12 w-full px-6 text-base shadow-lg hover:shadow-xl sm:h-14 sm:w-auto sm:px-8 sm:text-lg"
              >
                Commencer gratuitement
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="h-12 w-full border-2 border-white px-6 text-base text-white hover:bg-white hover:text-cyan-600 sm:h-14 sm:w-auto sm:px-8 sm:text-lg"
            >
              Contacter les ventes
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-cyan-500/20 bg-gradient-to-b from-slate-900 to-slate-950 py-10 text-gray-300 sm:py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-6 sm:gap-8 md:grid-cols-3 lg:grid-cols-5">
            {/* Column 1 */}
            <div>
              <div className="mb-4 flex items-center gap-2">
                <img src="/logo-w.svg" alt="Wadashaqayn" className="h-8 w-8 invert" />
                <span className="text-xl font-bold text-white">Wadashaqayn</span>
              </div>
              <p className="text-sm">
                La plateforme tout-en-un pour gérer vos projets, équipes et processus avec
                efficacité.
              </p>
            </div>

            {/* Column 2 */}
            <div>
              <h4 className="mb-4 font-semibold text-white">Produit</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white">
                    Fonctionnalités
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Tarifs
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Sécurité
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Intégrations
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3 */}
            <div>
              <h4 className="mb-4 font-semibold text-white">Ressources</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Guides
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Support
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 4 */}
            <div>
              <h4 className="mb-4 font-semibold text-white">Entreprise</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white">
                    À propos
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Carrières
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Partenaires
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 5 - Légal */}
            <div>
              <h4 className="mb-4 font-semibold text-white">Légal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/privacy" className="transition-colors hover:text-cyan-400">
                    Politique de confidentialité
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="transition-colors hover:text-cyan-400">
                    Conditions d'utilisation
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-gray-800 pt-8 text-center text-sm">
            <p>© {new Date().getFullYear()} Wadashaqayn. Tous droits réservés.</p>
            <p className="mt-2 text-xs text-gray-400">
              <Link to="/privacy" className="transition-colors hover:text-cyan-400">
                Politique de confidentialité
              </Link>
              {' · '}
              <Link to="/terms" className="transition-colors hover:text-cyan-400">
                Conditions d'utilisation
              </Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
