import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CheckCircle2, ArrowRight } from 'lucide-react';

interface SolutionItem {
  id: number;
  title: string;
  subtitle: string;
  features: string[];
  color: string; // from-color-500
  glow: string; // hex color
}

const solutions: SolutionItem[] = [
  {
    id: 1,
    title: 'Gestion de Projet',
    subtitle: 'Pour les chefs de projet',
    features: ['Vue Gantt & Kanban', 'Allocation des ressources', 'Suivi des délais'],
    color: 'from-blue-600 via-cyan-500', // More vibrant gradient
    glow: '#0ea5e9',
  },
  {
    id: 2,
    title: 'Ressources Humaines',
    subtitle: 'Pour les équipes RH',
    features: ['Gestion des congés', 'Dossiers employés', 'Suivi des compétences'],
    color: 'from-purple-600 via-pink-500',
    glow: '#d946ef',
  },
  {
    id: 3,
    title: 'Reporting & Analytics',
    subtitle: 'Pour les directeurs',
    features: ['KPIs en temps réel', 'Export automatisé', 'Prédictions IA'],
    color: 'from-emerald-500 via-green-400',
    glow: '#22c55e',
  },
];

export const NeonSolutionCards = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="perspective-1000 mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 md:grid-cols-3">
      {solutions.map((item, idx) => (
        <div
          key={item.id}
          className="group relative h-[420px] w-full"
          onMouseEnter={() => setHoveredIndex(idx)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {/* Background Glow - Always visible but intensifies on hover */}
          <div
            className={cn(
              'absolute inset-0 rounded-3xl opacity-20 blur-xl transition-all duration-500 group-hover:opacity-50',
              `bg-gradient-to-br ${item.color} to-transparent`
            )}
          />

          {/* Active Border Gradient - Always visible */}
          <div
            className={cn(
              'absolute -inset-[2px] rounded-[26px] bg-gradient-to-br opacity-40 blur-sm transition-all duration-500 group-hover:opacity-100',
              item.color,
              'to-transparent'
            )}
          />

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: idx * 0.2 }}
            viewport={{ once: true }}
            className={cn(
              'relative h-full w-full overflow-hidden rounded-3xl border border-white/10 bg-slate-900/90 p-8 backdrop-blur-xl transition-all duration-500',
              'hover:scale-105 hover:border-white/30'
            )}
            style={{ boxShadow: `inset 0 0 40px ${item.glow}15` }} // Permanent inner glow
          >
            {/* Neon Header Line */}
            <div
              className={cn(
                'mb-6 h-1 w-12 rounded-full bg-gradient-to-r shadow-[0_0_10px_currentColor]',
                item.color,
                'to-white'
              )}
              style={{ color: item.glow }}
            />

            <h3 className="mb-2 text-3xl font-bold text-white">{item.title}</h3>
            <p className="mb-8 text-gray-400">{item.subtitle}</p>

            <div className="space-y-4">
              {item.features.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ x: -10, opacity: 0 }}
                  animate={hoveredIndex === idx ? { x: 0, opacity: 1 } : { x: -10, opacity: 0.5 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <CheckCircle2 className="h-5 w-5 text-current" style={{ color: item.glow }} />
                  <span className="text-gray-200">{feature}</span>
                </motion.div>
              ))}
            </div>

            {/* Bottom Action */}
            <motion.div
              className="absolute bottom-8 left-8 flex items-center gap-2 text-sm font-bold tracking-wider uppercase"
              animate={{ x: hoveredIndex === idx ? 10 : 0 }}
              style={{ color: item.glow }}
            >
              En savoir plus <ArrowRight className="h-4 w-4" />
            </motion.div>
          </motion.div>
        </div>
      ))}
    </div>
  );
};
