/**
 * Testimonials — Section témoignages avec cartes glassmorphism animées
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quote, Star, ChevronLeft, ChevronRight } from 'lucide-react';

interface Testimonial {
  name: string;
  role: string;
  company: string;
  avatar: string;
  quote: string;
  rating: number;
  gradient: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Amina H.',
    role: 'Directrice RH',
    company: 'Djibouti Telecom',
    avatar: 'AH',
    quote:
      'Wadashaqayn a transformé notre gestion RH. La validation des congés qui prenait 3 jours se fait maintenant en quelques clics. Nos équipes sont beaucoup plus autonomes.',
    rating: 5,
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    name: 'Omar A.',
    role: 'Chef de Projet',
    company: 'PAID Djibouti',
    avatar: 'OA',
    quote:
      'Le diagramme Gantt temps réel change tout. Je peux voir l\'avancement de mes 12 projets simultanément sans jongler entre 5 outils différents.',
    rating: 5,
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    name: 'Fatouma I.',
    role: 'Coordinatrice de Formation',
    company: 'ISFD',
    avatar: 'FI',
    quote:
      'La gestion du catalogue de formations et le suivi des compétences par employé est exactement ce dont nous avions besoin. Interface claire, données fiables.',
    rating: 5,
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    name: 'Karim B.',
    role: 'CEO',
    company: 'StartDJ',
    avatar: 'KB',
    quote:
      'En tant que startup, avoir tous nos outils centralisés dès le début nous a évité des années de dette organisationnelle. Support local réactif et compétent.',
    rating: 5,
    gradient: 'from-orange-500 to-amber-500',
  },
];

const Stars = ({ count }: { count: number }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < count ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`}
      />
    ))}
  </div>
);

export function Testimonials() {
  const [current, setCurrent] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAuto = () => {
    intervalRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % TESTIMONIALS.length);
    }, 5000);
  };

  useEffect(() => {
    startAuto();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const go = (dir: 1 | -1) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setCurrent(c => (c + dir + TESTIMONIALS.length) % TESTIMONIALS.length);
    startAuto();
  };

  const t = TESTIMONIALS[current];

  return (
    <section className="relative z-10 overflow-hidden py-20 sm:py-28">
      {/* Background glow */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-64 w-96 -translate-x-1/2 -translate-y-1/2 bg-violet-500/10 blur-[120px]" />

      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-sm font-medium text-violet-300">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            Témoignages
          </span>
          <h2 className="mt-4 bg-gradient-to-r from-white via-violet-100 to-white bg-clip-text text-3xl font-bold text-transparent sm:text-4xl md:text-5xl">
            Ce que nos clients disent
          </h2>
          <p className="mt-4 text-gray-400 sm:text-lg">
            Ils ont fait confiance à Wadashaqayn pour transformer leur gestion
          </p>
        </div>

        {/* Main testimonial card */}
        <div className="mx-auto max-w-3xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.97 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="relative rounded-3xl border border-white/10 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-xl sm:p-10"
            >
              {/* Ambient glow */}
              <div
                className={`absolute -inset-px -z-10 rounded-3xl bg-gradient-to-br ${t.gradient} opacity-10 blur-2xl`}
              />
              <div
                className={`absolute top-0 left-0 right-0 h-0.5 rounded-t-3xl bg-gradient-to-r ${t.gradient} opacity-60`}
              />

              {/* Quote icon */}
              <div
                className={`mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${t.gradient} shadow-lg`}
              >
                <Quote className="h-6 w-6 text-white" />
              </div>

              <Stars count={t.rating} />

              <blockquote className="mt-4 text-lg leading-relaxed text-slate-200 sm:text-xl">
                "{t.quote}"
              </blockquote>

              <div className="mt-8 flex items-center gap-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${t.gradient} text-sm font-bold text-white shadow-lg`}
                >
                  {t.avatar}
                </div>
                <div>
                  <p className="font-semibold text-white">{t.name}</p>
                  <p className="text-sm text-slate-400">
                    {t.role} · {t.company}
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              onClick={() => go(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-slate-800/60 text-slate-300 transition-all hover:border-violet-500/50 hover:bg-violet-500/10 hover:text-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="flex gap-2">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { if (intervalRef.current) clearInterval(intervalRef.current); setCurrent(i); startAuto(); }}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === current ? 'w-8 bg-violet-400' : 'w-2 bg-slate-600 hover:bg-slate-500'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => go(1)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-slate-800/60 text-slate-300 transition-all hover:border-violet-500/50 hover:bg-violet-500/10 hover:text-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Mini cards below */}
          <div className="mt-8 grid grid-cols-4 gap-3">
            {TESTIMONIALS.map((test, i) => (
              <button
                key={i}
                onClick={() => { if (intervalRef.current) clearInterval(intervalRef.current); setCurrent(i); startAuto(); }}
                className={`rounded-xl border p-3 text-left transition-all duration-200 ${
                  i === current
                    ? 'border-violet-500/40 bg-violet-500/10'
                    : 'border-white/5 bg-slate-900/40 hover:border-white/10'
                }`}
              >
                <div
                  className={`mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${test.gradient} text-xs font-bold text-white`}
                >
                  {test.avatar}
                </div>
                <p className="text-xs font-medium text-white truncate">{test.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{test.company}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
