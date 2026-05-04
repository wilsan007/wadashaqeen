import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { BarChart3, Users, Zap, Shield, Globe, Clock, CheckCircle2 } from 'lucide-react';

const bentoItems = [
  {
    title: 'Tableaux de bord',
    description: 'Données en temps réel.',
    header: (
      <div className="relative flex h-full min-h-[6rem] w-full flex-1 overflow-hidden rounded-xl border border-cyan-500/20 bg-slate-900/40 backdrop-blur-md transition-transform duration-500 group-hover/bento:scale-105">
        {/* Mini Interface Layout */}
        <div className="absolute inset-0 flex">
          {/* Sidebar */}
          <div className="flex h-full w-8 flex-col gap-2 border-r border-cyan-500/10 bg-cyan-950/30 p-1.5 pt-3">
            <div className="aspect-square w-full rounded bg-cyan-500/30" />
            <div className="aspect-square w-full rounded bg-cyan-500/10" />
            <div className="aspect-square w-full rounded bg-cyan-500/10" />
          </div>
          {/* Main Content */}
          <div className="flex flex-1 flex-col">
            {/* Header */}
            <div className="flex h-6 items-center gap-2 border-b border-cyan-500/10 px-2">
              <div className="h-2 w-16 rounded-full bg-cyan-500/20" />
              <div className="flex-1" />
              <div className="h-3 w-3 rounded-full bg-cyan-500/30" />
            </div>
            {/* Body */}
            <div className="flex flex-1 gap-2 p-2">
              <div className="relative flex flex-1 items-end overflow-hidden rounded-lg border border-cyan-500/10 bg-cyan-500/5">
                {/* Area Chart */}
                <svg
                  className="absolute bottom-0 h-16 w-full fill-current text-cyan-500/40"
                  viewBox="0 0 100 40"
                  preserveAspectRatio="none"
                >
                  <path d="M0 40 L0 25 Q 20 10 40 20 T 80 25 L 100 15 L 100 40 Z" />
                </svg>
                <svg
                  className="absolute bottom-0 h-16 w-full fill-none stroke-current stroke-[1.5] text-cyan-400/60"
                  viewBox="0 0 100 40"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0 25 Q 20 10 40 20 T 80 25 L 100 15"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              </div>
              <div className="flex w-16 flex-col gap-2">
                <div className="flex-1 rounded-lg border border-cyan-500/10 bg-cyan-500/5" />
                <div className="flex-1 rounded-lg border border-cyan-500/10 bg-cyan-500/5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    icon: <BarChart3 className="h-6 w-6 text-cyan-300" />,
    className: 'md:col-span-2',
  },
  {
    title: 'Collaboration',
    description: "Travail d'équipe fluide.",
    header: (
      <div className="relative flex h-full min-h-[6rem] w-full flex-1 overflow-hidden rounded-xl border border-purple-500/20 bg-slate-900/40 backdrop-blur-md transition-transform duration-500 group-hover/bento:scale-105">
        {/* Chat Interface Mockup */}
        <div className="absolute inset-0 flex">
          {/* Channel List */}
          <div className="flex w-10 flex-col items-center gap-2 border-r border-purple-500/10 bg-purple-950/30 py-2">
            <div className="h-6 w-6 rounded-full bg-purple-500/40" />
            <div className="h-6 w-6 rounded-full bg-purple-500/10" />
            <div className="h-6 w-6 rounded-full bg-purple-500/10" />
          </div>
          {/* Chat Area */}
          <div className="relative flex flex-1 flex-col gap-2 p-2">
            {/* Messages */}
            <div className="flex gap-2">
              <div className="h-5 w-5 shrink-0 rounded-full bg-purple-500/40" />
              <div className="w-24 rounded-lg rounded-tl-none bg-purple-500/20 p-1.5">
                <div className="h-1.5 w-16 rounded-full bg-purple-300/30" />
              </div>
            </div>
            <div className="flex flex-row-reverse gap-2">
              <div className="h-5 w-5 shrink-0 rounded-full bg-pink-500/40" />
              <div className="w-20 rounded-lg rounded-tr-none bg-pink-500/20 p-1.5">
                <div className="h-1.5 w-12 rounded-full bg-pink-300/30" />
              </div>
            </div>
            {/* Typing Indicator */}
            <div className="absolute bottom-2 left-2 flex gap-1 rounded-full bg-white/5 p-1 px-2">
              <div className="h-1 w-1 animate-bounce rounded-full bg-white/50" />
              <div className="h-1 w-1 animate-bounce rounded-full bg-white/50 delay-75" />
              <div className="h-1 w-1 animate-bounce rounded-full bg-white/50 delay-150" />
            </div>
          </div>
        </div>
      </div>
    ),
    icon: <Users className="h-6 w-6 text-purple-300" />,
    className: 'md:col-span-1',
  },
  {
    title: 'Automatisations',
    description: 'Workflows efficaces.',
    header: (
      <div className="relative flex h-full min-h-[6rem] w-full flex-1 overflow-hidden rounded-xl border border-amber-500/20 bg-slate-900/40 backdrop-blur-md transition-transform duration-500 group-hover/bento:scale-105">
        {/* Logic Tree UI */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 80">
            {/* Paths */}
            <path
              d="M 50 15 L 50 30 L 30 45"
              fill="none"
              stroke="rgba(245,158,11,0.3)"
              strokeWidth="1.5"
            />
            <path
              d="M 50 15 L 50 30 L 70 45"
              fill="none"
              stroke="rgba(245,158,11,0.3)"
              strokeWidth="1.5"
            />
            <path
              d="M 30 55 L 30 65"
              fill="none"
              stroke="rgba(245,158,11,0.3)"
              strokeWidth="1.5"
              strokeDasharray="2 2"
            />
          </svg>

          {/* Nodes */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2">
            {/* Trigger */}
            <div className="flex items-center gap-1 rounded border border-amber-500/40 bg-amber-500/20 px-2 py-1">
              <Zap size={10} className="text-amber-300" />
              <div className="h-1 w-8 rounded-full bg-amber-300/30" />
            </div>
          </div>

          <div className="absolute top-1/2 left-4 flex w-full translate-y-2 justify-center gap-8">
            {/* Condition Node */}
            <div className="flex h-8 w-8 rotate-45 items-center justify-center border border-orange-500/40 bg-orange-500/20">
              <div className="h-3 w-3 rounded-full bg-orange-400/30" />
            </div>
            {/* Action Node */}
            <div className="flex h-8 items-center gap-1 rounded border border-blue-500/40 bg-blue-500/20 px-2 py-1.5">
              <div className="h-1 w-6 rounded-full bg-blue-300/30" />
            </div>
          </div>
        </div>
      </div>
    ),
    icon: <Zap className="h-6 w-6 text-amber-300" />,
    className: 'md:col-span-1',
  },
  {
    title: 'Sécurité',
    description: 'Données protégées.',
    header: (
      <div className="relative flex h-full min-h-[6rem] w-full flex-1 overflow-hidden rounded-xl border border-emerald-500/20 bg-slate-900/40 backdrop-blur-md transition-transform duration-500 group-hover/bento:scale-105">
        {/* Threat Matrix Background */}
        <div className="absolute inset-0 grid grid-cols-12 grid-rows-6 gap-0.5 p-1 opacity-20">
          {Array.from({ length: 72 }).map((_, i) => (
            <div
              key={i}
              className={`rounded-[1px] ${Math.random() > 0.9 ? 'bg-red-500' : 'bg-emerald-500'}`}
            />
          ))}
        </div>

        {/* Radar Scan Line */}
        <div
          className="animate-scan pointer-events-none absolute inset-0 top-0 h-1/4 w-full border-b border-emerald-500/50 bg-gradient-to-b from-emerald-500/20 to-transparent shadow-[0_4px_20px_rgba(16,185,129,0.3)]"
          style={{ animationTimingFunction: 'linear' }}
        />

        {/* Central Status */}
        <div className="absolute inset-0 flex items-center justify-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 animate-pulse rounded-full bg-emerald-500/20 blur-xl" />
            <Shield size={40} className="relative z-10 text-emerald-400 drop-shadow-lg" />
            <div className="absolute right-0 bottom-0 z-20 rounded-full border border-emerald-500/50 bg-slate-900 p-0.5">
              <CheckCircle2 size={14} className="text-emerald-400" />
            </div>
          </div>
          {/* Console Log */}
          <div className="flex flex-col gap-1 font-mono text-[8px] text-emerald-400/80">
            <div className="flex gap-2">
              <span className="text-slate-500">10:42:01</span> <span>SCAN_COMPLETE</span>
            </div>
            <div className="flex gap-2">
              <span className="text-slate-500">10:42:02</span> <span>NO_THREATS</span>
            </div>
            <div className="flex gap-2">
              <span className="text-slate-500">10:42:03</span>{' '}
              <span className="rounded bg-emerald-500/20 px-1 text-emerald-300">SECURE</span>
            </div>
          </div>
        </div>
      </div>
    ),
    icon: <Shield className="h-6 w-6 text-green-300" />,
    className: 'md:col-span-2',
  },
];

export const HolographicBentoGrid = () => {
  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 md:grid-cols-3">
      {bentoItems.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: i * 0.1 }}
          className={cn(
            'group/bento relative row-span-1 flex flex-col justify-between space-y-6 overflow-hidden rounded-2xl border border-white/10 bg-slate-800/60 p-6 shadow-lg ring-1 ring-white/5 backdrop-blur-xl transition duration-300 hover:border-white/20 hover:shadow-2xl',
            item.className
          )}
        >
          {/* Border Beam Animation - Always visible but subtle */}
          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-2xl">
            <div className="animate-border-beam absolute top-1/2 left-1/2 h-[200%] w-[200%] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50 transition-opacity group-hover/bento:opacity-100" />
          </div>

          <div className="relative z-10 flex h-full flex-col transition duration-300 group-hover/bento:translate-x-2">
            <div className="mb-4 flex-grow">{item.header}</div>

            <div className="mb-2 flex items-center gap-3">
              <div className="rounded-lg border border-white/10 bg-white/10 p-2 shadow-inner transition-colors group-hover/bento:bg-white/20">
                {item.icon}
              </div>
              <div className="font-sans text-xl font-bold text-white transition-colors group-hover/bento:text-cyan-300">
                {item.title}
              </div>
            </div>

            <div className="pl-1 font-sans text-sm font-normal text-gray-300">
              {item.description}
            </div>
          </div>

          {/* Holographic Background */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 opacity-0 transition-opacity duration-500 group-hover/bento:opacity-100" />
        </motion.div>
      ))}
    </div>
  );
};
