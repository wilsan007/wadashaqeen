import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Layout,
  Search,
  Bell,
  Settings,
  Users,
  Briefcase,
  Calendar,
  MessageSquare,
  PieChart,
  LogOut,
  Plus,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  Bot,
  Sparkles,
  Zap,
  Rocket,
  BrainCircuit,
  Cpu,
  AlertTriangle,
  FileText,
  Activity,
  Shield,
  Hammer,
  BarChart2,
} from 'lucide-react';

// --- Views Components ---

// 1. Analytics View (Based on Image 1)
const ViewAnalytics = () => (
  <div className="flex h-full flex-col gap-4">
    {/* Header */}
    <div className="mb-2 flex items-end justify-between">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold text-white">
          <PieChart className="text-purple-400" /> Analytics
        </h2>
        <p className="text-xs text-slate-400">Vue d'overview des performances</p>
      </div>
      <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
        Cette semaine
      </div>
    </div>

    {/* 4 Colored Cards */}
    <div className="grid grid-cols-4 gap-4">
      <StatCardV2
        title="Tâches Créées"
        value="24"
        sub="+12%"
        color="purple"
        icon={<Zap size={16} />}
      />
      <StatCardV2
        title="Terminées"
        value="18"
        sub="+8%"
        color="emerald"
        icon={<CheckCircle2 size={16} />}
      />
      <StatCardV2
        title="En Retard"
        value="3"
        sub="-2%"
        color="rose"
        icon={<AlertTriangle size={16} />}
      />
      <StatCardV2
        title="Efficacité"
        value="94%"
        sub="+5%"
        color="cyan"
        icon={<Activity size={16} />}
      />
    </div>

    {/* Performance & Champions */}
    <div className="grid min-h-0 flex-1 grid-cols-3 gap-4">
      {/* Performance Chart */}
      <div className="relative col-span-2 flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#0F1623] p-4">
        <h3 className="mb-6 text-sm font-bold text-slate-300">Performance par Priorité</h3>

        <div className="relative z-10 space-y-6">
          <ProgressBar label="Haute Priorité" value={75} color="cyan" count="6/8" />
          <ProgressBar label="Moyenne Priorité" value={45} color="amber" count="4/9" />
          <ProgressBar label="Basse Priorité" value={90} color="emerald" count="9/10" />
        </div>

        {/* Background Decor */}
        <div className="pointer-events-none absolute top-0 right-0 h-64 w-64 rounded-full bg-cyan-500/5 blur-3xl" />
      </div>

      {/* Champions */}
      <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/5 bg-[#0F1623] p-4 text-center">
        <h3 className="absolute top-4 left-4 text-sm font-bold text-slate-300">Champions</h3>
        <div className="mb-3 h-20 w-20 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 p-[2px] shadow-[0_0_20px_rgba(251,191,36,0.2)]">
          <div className="flex h-full w-full items-center justify-center rounded-full bg-[#0F1623]">
            <span className="text-2xl font-bold text-amber-400">1</span>
          </div>
        </div>
        <div className="font-bold text-white">Sarah M.</div>
        <div className="text-xs text-slate-500">24 Tâches</div>

        <div className="pointer-events-none absolute bottom-0 h-1/2 w-full bg-gradient-to-t from-amber-500/10 to-transparent" />
      </div>
    </div>
  </div>
);

// 2. Safety View (Based on Image 2)
const ViewSafety = () => (
  <div className="flex h-full flex-col gap-4">
    <div className="mb-2 flex items-end justify-between">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold text-white">
          <Shield className="text-emerald-400" /> Santé & Sécurité
        </h2>
        <p className="text-xs text-slate-400">Gestion des incidents et conformité</p>
      </div>
      <button className="flex items-center gap-2 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-red-600">
        <AlertTriangle size={12} /> Déclarer Incident
      </button>
    </div>

    {/* Top Stats Row */}
    <div className="grid grid-cols-5 gap-3">
      <SafetyStat
        label="Conformité"
        value="98%"
        icon={<CheckCircle2 size={14} />}
        color="emerald"
      />
      <SafetyStat label="Audits" value="12" icon={<FileText size={14} />} color="blue" />
      <SafetyStat label="Jours Sûrs" value="145" icon={<Shield size={14} />} color="cyan" />
      <SafetyStat label="Actions" value="8" icon={<Activity size={14} />} color="amber" />
      <SafetyStat label="Équipes" value="6" icon={<Users size={14} />} color="purple" />
    </div>

    {/* Documents Grid */}
    <div className="grid min-h-0 flex-1 grid-cols-2 gap-4">
      <DocCard title="Politique de Sécurité" type="Security" version="v2.1" status="active" />
      <DocCard title="Vérification Extincteurs" type="Equipment" version="v1.0" status="expiring" />
      <DocCard title="Procédures d'Évacuation" type="Urgence" version="v1.3" status="active" />
      <DocCard title="Rapport Inspection" type="Audit" version="v1.0" status="expired" />
    </div>
  </div>
);

// 3. Kanban View (Based on Image 3)
const ViewKanban = () => (
  <div className="flex h-full flex-col gap-4">
    <div className="mb-2 flex items-end justify-between">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold text-white">
          <Layout className="text-blue-400" /> Gestion des Tâches
        </h2>
        <p className="text-xs text-slate-400">Flux de travail KanBan</p>
      </div>
      <div className="flex gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 text-white">
          <Plus size={16} />
        </div>
      </div>
    </div>

    {/* Kanban Board */}
    <div className="grid h-full min-h-0 flex-1 grid-cols-4 gap-4">
      <KanbanColumn title="À faire" count={8} color="slate">
        <KanbanCard title="Documentation API" tag="Doc" priority="low" />
        <KanbanCard title="Review Design System" tag="UX" priority="med" />
        <KanbanCard title="Optimisation Images" tag="Perf" priority="low" />
        <KanbanCard title="Tests Unitaires" tag="QA" priority="high" />
      </KanbanColumn>
      <KanbanColumn title="En cours" count={5} color="blue">
        <KanbanCard title="Migration DB" tag="Dev" priority="high" />
        <KanbanCard title="Intégration Stripe" tag="Feat" priority="high" />
        <KanbanCard title="Refactor Auth" tag="Sec" priority="crit" />
      </KanbanColumn>
      <KanbanColumn title="Bloqué" count={2} color="rose">
        <KanbanCard title="Accès Serveur Prod" tag="Ops" priority="crit" />
        <KanbanCard title="Validation Contrat" tag="Legal" priority="med" />
      </KanbanColumn>
      <KanbanColumn title="Terminé" count={12} color="emerald">
        <KanbanCard title="Setup Projet Initial" tag="Init" priority="low" />
        <KanbanCard title="Maquettes Figma" tag="UI" priority="med" />
        <KanbanCard title="Config CI/CD" tag="DevOps" priority="high" />
        <KanbanCard title="Landing Page V1" tag="Web" priority="med" />
      </KanbanColumn>
    </div>
  </div>
);

export const DashboardPreview = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [ViewAnalytics, ViewSafety, ViewKanban];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 5000); // Rotate every 5 seconds
    return () => clearInterval(timer);
  }, []);

  const CurrentView = slides[currentSlide];

  return (
    <div className="group relative flex h-full w-full overflow-hidden rounded-xl bg-[#050B14] font-sans text-slate-300">
      {/* Background elements */}
      <div className="pointer-events-none absolute top-0 right-0 h-96 w-96 rounded-full bg-purple-600/10 blur-[80px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-96 w-96 rounded-full bg-cyan-600/10 blur-[80px]" />

      {/* Floating "Astronaut" Elements */}
      <motion.div
        animate={{ y: [-5, 5, -5] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute top-1/4 left-1/4 z-20 opacity-80"
      >
        <Bot className="h-6 w-6 text-pink-400 drop-shadow-[0_0_10px_rgba(244,114,182,0.5)]" />
      </motion.div>
      <motion.div
        animate={{ y: [5, -5, 5] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="pointer-events-none absolute right-12 bottom-1/3 z-20 opacity-80"
      >
        <Rocket className="h-5 w-5 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
      </motion.div>

      {/* Sidebar (Constant) */}
      <div className="z-30 flex w-16 flex-col items-center gap-6 border-r border-white/5 bg-[#0F1623]/50 py-4 backdrop-blur-md">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 font-bold text-white shadow-lg shadow-cyan-500/20">
          W
        </div>
        <div className="flex flex-col gap-4">
          <SidebarIcon icon={<PieChart size={20} />} active={currentSlide === 0} />
          <SidebarIcon icon={<Shield size={20} />} active={currentSlide === 1} />
          <SidebarIcon icon={<Layout size={20} />} active={currentSlide === 2} />
          <SidebarIcon icon={<Users size={20} />} />
          <SidebarIcon icon={<Settings size={20} />} />
        </div>
      </div>

      {/* Main Content Area (Carousel) */}
      <div className="z-10 flex min-w-0 flex-1 flex-col bg-transparent">
        {/* Header (Constant) */}
        <header className="flex h-14 items-center justify-between border-b border-white/5 bg-[#0F1623]/30 px-6 backdrop-blur-sm">
          <div className="flex h-8 w-48 items-center rounded-full border border-white/5 bg-[#0F1623] px-3">
            <Search size={14} className="mr-2 text-slate-600" />
            <span className="text-xs text-slate-600">Rechercher...</span>
          </div>
          <div className="flex items-center gap-3">
            <Bell size={16} className="text-slate-400" />
            <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 ring-2 ring-white/10" />
          </div>
        </header>

        {/* Animated View Container */}
        <div className="relative flex-1 overflow-hidden p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.5 }}
              className="h-full w-full"
            >
              <CurrentView />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Carousel Indicators */}
      <div className="absolute bottom-4 left-1/2 z-40 flex -translate-x-1/2 gap-2 rounded-full border border-white/5 bg-black/20 px-2 py-1 backdrop-blur-xl">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={cn(
              'h-2 w-2 rounded-full transition-all duration-300',
              currentSlide === idx ? 'w-6 bg-cyan-400' : 'bg-slate-600 hover:bg-slate-400'
            )}
          />
        ))}
      </div>
    </div>
  );
};

// --- Helper Components ---

const SidebarIcon = ({ icon, active }: { icon: any; active?: boolean }) => (
  <div
    className={cn(
      'cursor-pointer rounded-lg p-2 transition-all duration-300',
      active
        ? 'bg-cyan-500/10 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
        : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
    )}
  >
    {icon}
  </div>
);

const StatCardV2 = ({ title, value, sub, color, icon }: any) => (
  <div className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-white/5 bg-[#0F1623] p-3 transition-colors hover:border-white/10">
    <div className="mb-2 flex items-start justify-between">
      <div className={`rounded-lg p-1.5 bg-${color}-500/10 text-${color}-400`}>{icon}</div>
    </div>
    <div>
      <div className="mb-1 text-2xl font-bold text-white">{value}</div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500">{title}</span>
        <span className={`text-${color}-400 font-medium`}>{sub}</span>
      </div>
    </div>
    <div
      className={`absolute bottom-0 left-0 h-0.5 w-full bg-${color}-500/50 opacity-0 transition-opacity group-hover:opacity-100`}
    />
  </div>
);

const ProgressBar = ({ label, value, color, count }: any) => (
  <div>
    <div className="mb-1.5 flex justify-between text-xs">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-300">{count}</span>
    </div>
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
      <motion.div
        initial={{ width: 0 }}
        whileInView={{ width: `${value}%` }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className={`h-full bg-${color}-500 rounded-full shadow-[0_0_10px_currentColor]`}
      />
    </div>
  </div>
);

const SafetyStat = ({ label, value, icon, color }: any) => (
  <div className="flex items-center justify-between rounded-xl border border-white/5 bg-[#0F1623] p-3">
    <div>
      <div className="text-[10px] font-bold text-slate-500 uppercase">{label}</div>
      <div className="text-lg font-bold text-white">{value}</div>
    </div>
    <div className={`text-${color}-400`}>{icon}</div>
  </div>
);

const DocCard = ({ title, type, version, status }: any) => (
  <div className="group flex flex-col justify-between rounded-xl border border-white/5 bg-[#0F1623] p-3 transition-colors hover:bg-white/5">
    <div className="mb-2 flex items-center gap-2">
      <FileText size={16} className="text-slate-400" />
      <div className="truncate text-xs font-semibold text-white">{title}</div>
    </div>
    <div className="flex items-center justify-between text-[10px]">
      <span className="text-slate-500">
        {type} • {version}
      </span>
      <span
        className={cn(
          'rounded px-1.5 py-0.5 font-bold uppercase',
          status === 'active'
            ? 'bg-emerald-500/10 text-emerald-400'
            : status === 'expiring'
              ? 'bg-amber-500/10 text-amber-400'
              : 'bg-red-500/10 text-red-400'
        )}
      >
        {status}
      </span>
    </div>
  </div>
);

const KanbanColumn = ({ title, count, color, children }: any) => (
  <div className="flex h-full flex-col rounded-xl border border-white/5 bg-[#0F1623]/50 p-2">
    <div className="mb-3 flex items-center justify-between px-1">
      <span className="text-xs font-bold text-slate-300">{title}</span>
      <span
        className={`bg-${color}-500/10 text-${color}-400 rounded px-1.5 py-0.5 text-[10px] font-bold`}
      >
        {count}
      </span>
    </div>
    <div className="custom-scrollbar flex-1 space-y-2 overflow-y-auto pr-1">{children}</div>
  </div>
);

const KanbanCard = ({ title, tag, priority }: any) => (
  <div className="group cursor-pointer rounded-lg border border-white/5 bg-[#1E293B] p-3 shadow-sm transition-colors hover:bg-[#283548]">
    <div className="mb-2 text-xs font-medium text-slate-200">{title}</div>
    <div className="flex items-center justify-between">
      <div className="rounded border border-white/5 bg-slate-700/50 px-1.5 py-0.5 text-[9px] text-slate-400">
        {tag}
      </div>
      <div
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          priority === 'low'
            ? 'bg-blue-400'
            : priority === 'med'
              ? 'bg-amber-400'
              : priority === 'high'
                ? 'bg-orange-400'
                : 'bg-red-400'
        )}
      />
    </div>
  </div>
);
