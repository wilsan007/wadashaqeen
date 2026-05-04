import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CheckCircle2, Zap, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

const tiers = [
  {
    name: 'Petite Équipe',
    price: '25 000',
    description: 'Pour les startups ambitieuses',
    features: ['1-20 utilisateurs', 'Tous les modules', '10 GB Stockage', 'Support Email'],
    neon: 'cyan',
    popular: false,
  },
  {
    name: 'Moyenne Équipe',
    price: '60 000',
    description: 'Pour les entreprises en croissance',
    features: ['21-50 utilisateurs', 'API Access', '50 GB Stockage', 'Support Prioritaire 24/7'],
    neon: 'purple',
    popular: true,
  },
  {
    name: 'Grande Équipe',
    price: 'Sur mesure',
    description: 'Pour les grandes structures',
    features: [
      '+50 utilisateurs',
      'SSO & Audit Logs',
      'Stockage Illimité',
      'Account Manager dédié',
    ],
    neon: 'pink',
    popular: false,
  },
];

export const CyberpunkPricing = () => {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <div className="perspective-1000 relative mx-auto w-full max-w-7xl px-4">
      {/* 3D Grid Floor */}
      <div className="pointer-events-none absolute inset-0 scale-150 rotate-x-60 transform bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] bg-[size:4rem_4rem]" />

      {/* Cyberpunk Toggles */}
      <div className="relative z-10 mb-16 flex justify-center">
        <div className="flex rounded-full border border-white/10 bg-slate-900/80 p-1 backdrop-blur-md">
          {['monthly', 'yearly'].map(cycle => (
            <button
              key={cycle}
              onClick={() => setBilling(cycle as any)}
              className={cn(
                'rounded-full px-6 py-2 text-sm font-bold transition-all duration-300',
                billing === cycle
                  ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.5)]'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              {cycle === 'monthly' ? 'Mensuel' : 'Annuel (-20%)'}
            </button>
          ))}
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-1 gap-8 md:grid-cols-3">
        {tiers.map((tier, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={cn(
              'relative flex flex-col rounded-2xl border bg-slate-900/40 p-8 backdrop-blur-xl transition-all duration-300',
              tier.popular
                ? 'z-20 scale-105 border-purple-500/50 bg-slate-900/60 shadow-[0_0_30px_rgba(168,85,247,0.15)]'
                : 'border-white/10 hover:-translate-y-1 hover:border-white/30 hover:bg-slate-900/60 hover:shadow-xl'
            )}
          >
            {tier.popular && (
              <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-1 text-xs font-bold text-white shadow-lg">
                  <Star className="h-3 w-3 fill-white" /> POPULAIRE
                </span>
              </div>
            )}

            {/* Rotating Ring for popular tier */}
            {tier.popular && (
              <div className="pointer-events-none absolute inset-0 animate-pulse rounded-2xl border border-purple-500/30" />
            )}

            <div className="mb-6">
              <h3
                className={cn(
                  'mb-2 text-xl font-bold tracking-wide uppercase',
                  `text-${tier.neon}-400`
                )}
              >
                {tier.name}
              </h3>
              <div className="flex items-baseline gap-1">
                <span
                  className={cn(
                    'bg-gradient-to-r bg-clip-text text-4xl font-black text-transparent',
                    tier.neon === 'cyan'
                      ? 'from-cyan-300 to-blue-400'
                      : tier.neon === 'purple'
                        ? 'from-purple-300 to-pink-400'
                        : 'from-pink-300 to-rose-400'
                  )}
                >
                  {tier.price}
                </span>
                {tier.price !== 'Sur mesure' && (
                  <span className="font-semibold text-gray-400">DJF</span>
                )}
              </div>
              <p className="mt-2 text-sm font-medium text-gray-400">{tier.description}</p>
            </div>

            <div className="mb-8 flex-grow space-y-4">
              {tier.features.map((feat, i) => (
                <div key={i} className="group/feat flex items-center gap-3">
                  <div
                    className={cn(
                      'group-hover/feat:bg-opacity-100 rounded-full p-1 transition-colors',
                      `bg-${tier.neon}-500/10`
                    )}
                  >
                    <CheckCircle2 className={cn('h-4 w-4', `text-${tier.neon}-400`)} />
                  </div>
                  <span className="text-sm text-gray-300 transition-colors group-hover/feat:text-white">
                    {feat}
                  </span>
                </div>
              ))}
            </div>

            <Button
              className={cn(
                'h-12 w-full font-bold tracking-wide transition-all duration-300',
                tier.popular
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg shadow-purple-500/25 hover:scale-[1.02] hover:from-purple-500 hover:to-pink-500 hover:shadow-purple-500/40'
                  : 'border border-white/10 bg-white/5 text-white hover:border-white/20 hover:bg-white/10 hover:text-cyan-300'
              )}
            >
              Choisir ce plan
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
