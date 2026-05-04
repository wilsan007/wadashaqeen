import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Shield, Users, Zap, Globe, Award, Database } from 'lucide-react';

// --- Animated Counter ---
function Counter({ value, decimal = false }: { value: number; decimal?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
  const displayValue = useTransform(spring, current =>
    decimal ? current.toFixed(1) : Math.round(current).toLocaleString()
  );

  useEffect(() => {
    if (isInView) {
      spring.set(value);
    }
  }, [isInView, value, spring]);

  return <motion.span ref={ref}>{displayValue}</motion.span>;
}

interface Stat {
  label: string;
  value: number;
  icon: any;
  color: string;
  suffix: string;
  decimal?: boolean;
  description?: string;
}

const stats: Stat[] = [
  {
    label: 'Utilisateurs',
    value: 12500,
    icon: Users,
    color: 'cyan',
    suffix: '+',
  },
  {
    label: 'Projets',
    value: 850,
    icon: Zap,
    color: 'purple',
    suffix: '+',
  },
  {
    label: 'Satisfaction',
    value: 99,
    icon: Award,
    color: 'pink',
    suffix: '%',
  },
  {
    label: 'Gain de temps',
    value: 30,
    icon: Database,
    color: 'blue',
    suffix: '%',
    description: 'par équipe',
  },
];

export const StatsExcellence = () => {
  return (
    <section className="relative z-10 overflow-hidden border-t border-white/5 bg-slate-900/30 py-24 backdrop-blur-sm">
      {/* Background Gradients */}
      <div className="pointer-events-none absolute top-1/2 left-1/4 h-96 w-96 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-[100px]" />
      <div className="pointer-events-none absolute top-1/2 right-1/4 h-96 w-96 -translate-y-1/2 rounded-full bg-purple-500/10 blur-[100px]" />

      <div className="relative z-10 container mx-auto px-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              className="group relative flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/5 p-6 text-center backdrop-blur-md transition-all hover:border-white/20 hover:bg-white/10"
            >
              <div
                className={cn(
                  'relative z-10 mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg transition-transform group-hover:scale-110',
                  `from-${stat.color}-500/20 to-${stat.color}-500/5 text-${stat.color}-400 ring-1 ring-${stat.color}-500/40`
                )}
              >
                <stat.icon className="h-6 w-6" />
              </div>

              <div className="relative z-10 mb-1 flex items-baseline font-mono text-3xl font-black tracking-tight text-white md:text-5xl">
                <Counter value={stat.value} decimal={stat.decimal} />
                <span className={cn('ml-1 text-2xl md:text-3xl', `text-${stat.color}-400`)}>
                  {stat.suffix}
                </span>
              </div>

              <div className="relative z-10 text-xs font-bold tracking-wider text-gray-400 uppercase md:text-sm">
                {stat.label}
              </div>

              {/* Permanent Bottom Glow */}
              <div
                className={cn(
                  'absolute bottom-0 left-1/2 h-0.5 w-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-transparent to-transparent opacity-60 blur-[1px]',
                  `via-${stat.color}-500`
                )}
              />

              {/* Hover Bottom Glow */}
              <div
                className={cn(
                  'absolute bottom-0 left-1/2 h-1.5 w-2/3 -translate-x-1/2 rounded-full bg-gradient-to-r from-transparent to-transparent opacity-0 blur-md transition-opacity duration-500 group-hover:opacity-100',
                  `via-${stat.color}-500`
                )}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
