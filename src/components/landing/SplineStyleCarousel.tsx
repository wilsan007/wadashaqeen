/**
 * SplineStyleCarousel — Carousel 3D premium avec double rangée en sens opposé
 * Design: Spotlight cards + Infinite marquee + glassmorphism
 */

import React, { useRef, useState } from 'react';
import { motion, useSpring, useTransform, useMotionValue } from 'framer-motion';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ModuleCard {
  icon: string;
  title: string;
  description: string;
  tag: string;
  gradient: string;
  glow: string;
  available: boolean;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const MODULES: ModuleCard[] = [
  {
    icon: '📊',
    title: 'Tableaux de bord',
    description: 'KPIs en temps réel avec graphiques interactifs',
    tag: 'Disponible',
    gradient: 'from-blue-600 via-cyan-500 to-teal-500',
    glow: '#06b6d4',
    available: true,
  },
  {
    icon: '📋',
    title: 'Gestion de tâches',
    description: 'Organisez et suivez vos projets complexes',
    tag: 'Disponible',
    gradient: 'from-violet-600 via-purple-500 to-fuchsia-500',
    glow: '#a855f7',
    available: true,
  },
  {
    icon: '📅',
    title: 'Vue Gantt',
    description: 'Planification visuelle avec dépendances',
    tag: 'Disponible',
    gradient: 'from-emerald-600 via-green-500 to-teal-400',
    glow: '#10b981',
    available: true,
  },
  {
    icon: '🎯',
    title: 'Vue Kanban',
    description: 'Workflow agile et flexible par équipe',
    tag: 'Disponible',
    gradient: 'from-orange-600 via-amber-500 to-yellow-400',
    glow: '#f97316',
    available: true,
  },
  {
    icon: '👥',
    title: 'Gestion RH',
    description: 'Équipes, absences et performances',
    tag: 'Disponible',
    gradient: 'from-indigo-600 via-blue-500 to-cyan-400',
    glow: '#6366f1',
    available: true,
  },
  {
    icon: '⏱️',
    title: 'Suivi du temps',
    description: 'Timesheet et pointage intelligents',
    tag: 'Disponible',
    gradient: 'from-teal-600 via-cyan-500 to-sky-400',
    glow: '#14b8a6',
    available: true,
  },
  {
    icon: '💰',
    title: 'Notes de frais',
    description: 'Gestion et validation des dépenses',
    tag: 'Disponible',
    gradient: 'from-yellow-600 via-amber-500 to-orange-400',
    glow: '#f59e0b',
    available: true,
  },
  {
    icon: '🎓',
    title: 'Formation',
    description: 'Catalogue et suivi des compétences',
    tag: 'Disponible',
    gradient: 'from-pink-600 via-rose-500 to-red-400',
    glow: '#ec4899',
    available: true,
  },
  {
    icon: '🤖',
    title: 'Automatisations',
    description: 'Workflows sans code, IA intégrée',
    tag: 'Bientôt',
    gradient: 'from-violet-700 via-purple-600 to-indigo-500',
    glow: '#8b5cf6',
    available: false,
  },
  {
    icon: '📈',
    title: 'Analytics IA',
    description: 'Prédictions et insights avancés',
    tag: 'Bientôt',
    gradient: 'from-blue-700 via-indigo-600 to-violet-500',
    glow: '#6366f1',
    available: false,
  },
  {
    icon: '🔔',
    title: 'Notifications',
    description: 'Alertes temps réel multi-canal',
    tag: 'Disponible',
    gradient: 'from-red-600 via-rose-500 to-pink-400',
    glow: '#ef4444',
    available: true,
  },
  {
    icon: '📱',
    title: 'App Mobile',
    description: 'iOS et Android natif',
    tag: 'Bientôt',
    gradient: 'from-cyan-600 via-blue-500 to-indigo-400',
    glow: '#0ea5e9',
    available: false,
  },
];

// Split into two rows
const ROW_1 = MODULES.slice(0, 6);
const ROW_2 = MODULES.slice(6, 12);

// ─── 3D Spotlight Card ────────────────────────────────────────────────────────

const SpotlightCard = ({ card }: { card: ModuleCard }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [12, -12]), {
    stiffness: 400, damping: 35,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-12, 12]), {
    stiffness: 400, damping: 35,
  });
  const scale = useSpring(1, { stiffness: 400, damping: 35 });

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
    scale.set(1.04);
    e.currentTarget.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - rect.top}px`);
  };

  const onMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    scale.set(1);
  };

  return (
    <motion.div
      ref={cardRef}
      style={{ rotateX, rotateY, scale, transformStyle: 'preserve-3d' }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="group relative flex h-[200px] w-[260px] flex-shrink-0 cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl backdrop-blur-xl transition-shadow duration-300"
    >
      {/* Spotlight effect */}
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(300px circle at var(--mx, 50%) var(--my, 50%), ${card.glow}30, transparent 50%)`,
        }}
      />

      {/* Ambient glow */}
      <div
        className={`absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br ${card.gradient} opacity-10 blur-xl transition-opacity duration-500 group-hover:opacity-30`}
      />

      {/* Top row: icon + badge */}
      <div className="flex items-start justify-between" style={{ transform: 'translateZ(30px)' }}>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${card.gradient} text-2xl shadow-lg ring-1 ring-white/20`}
        >
          {card.icon}
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
            card.available
              ? 'border border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
              : 'border border-amber-500/40 bg-amber-500/20 text-amber-300'
          }`}
        >
          {card.tag}
        </span>
      </div>

      {/* Text */}
      <div style={{ transform: 'translateZ(20px)' }}>
        <h3 className="mb-1 text-base font-bold text-white">{card.title}</h3>
        <p className="text-xs leading-relaxed text-slate-400">{card.description}</p>
      </div>

      {/* Bottom gradient bar */}
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${card.gradient} opacity-40 group-hover:opacity-80 transition-opacity duration-300`} />
    </motion.div>
  );
};

// ─── Marquee Row ──────────────────────────────────────────────────────────────

const MarqueeRow = ({
  cards,
  direction = 1,
  duration = 40,
}: {
  cards: ModuleCard[];
  direction?: 1 | -1;
  duration?: number;
}) => {
  const doubled = [...cards, ...cards];

  return (
    <div className="relative overflow-hidden">
      <motion.div
        className="flex gap-5 py-4"
        animate={{ x: direction === 1 ? '-50%' : '0%' }}
        initial={{ x: direction === 1 ? '0%' : '-50%' }}
        transition={{ ease: 'linear', duration, repeat: Infinity }}
        style={{ width: 'max-content' }}
      >
        {doubled.map((card, i) => (
          <SpotlightCard key={`${card.title}-${i}`} card={card} />
        ))}
      </motion.div>
    </div>
  );
};

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function SplineStyleCarousel() {
  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ perspective: '1200px' }}
    >
      {/* Side fades */}
      <div className="pointer-events-none absolute top-0 left-0 z-20 h-full w-24 bg-gradient-to-r from-slate-950 to-transparent md:w-40" />
      <div className="pointer-events-none absolute top-0 right-0 z-20 h-full w-24 bg-gradient-to-l from-slate-950 to-transparent md:w-40" />

      <div className="space-y-2">
        <MarqueeRow cards={ROW_1} direction={1} duration={45} />
        <MarqueeRow cards={ROW_2} direction={-1} duration={38} />
      </div>
    </div>
  );
}
