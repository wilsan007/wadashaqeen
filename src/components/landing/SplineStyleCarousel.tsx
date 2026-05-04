import React, { useRef, useState, useEffect } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  animate,
  useMotionTemplate,
} from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Users,
  Zap,
  Clock,
  Shield,
  Globe,
  Sparkles,
  Layout,
  Cpu,
  Lock,
} from 'lucide-react';

// --- Types ---
interface Feature {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string; // Tailwind gradient class
  glowColor: string; // CSS hex color for spotlight
}

// --- Spotlight 3D Card ---
const SpotlightCard = ({ feature }: { feature: Feature }) => {
  const ref = useRef<HTMLDivElement>(null);

  // Mouse tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // 3D Tilt Values
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [15, -15]), {
    stiffness: 300,
    damping: 30,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-15, 15]), {
    stiffness: 300,
    damping: 30,
  });
  const scale = useSpring(1, { stiffness: 300, damping: 30 });

  function onMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const x = (clientX - left) / width - 0.5;
    const y = (clientY - top) / height - 0.5;

    mouseX.set(x);
    mouseY.set(y);
    scale.set(1.05);

    // For spotlight
    (currentTarget as HTMLElement).style.setProperty('--mouse-x', `${clientX - left}px`);
    (currentTarget as HTMLElement).style.setProperty('--mouse-y', `${clientY - top}px`);
  }

  function onMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
    scale.set(1);
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <motion.div
      ref={ref}
      style={{
        rotateX,
        rotateY,
        scale,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="group relative h-[380px] w-[320px] flex-shrink-0 cursor-pointer rounded-3xl border border-white/5 bg-slate-900/60 p-8 backdrop-blur-xl transition-colors duration-500"
    >
      {/* 🔦 Spotlight Effect (The "Reveal") */}
      <div
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), ${feature.glowColor}25, transparent 40%)`,
          zIndex: 0,
        }}
      />

      {/* Soft animated border gradient */}
      <div
        className={`absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br opacity-20 transition-opacity duration-500 group-hover:opacity-60 ${feature.color} blur-xl`}
      />

      {/* 🧊 Content Layer (Floating Deep) */}
      <div style={{ transform: 'translateZ(75px)' }} className="relative z-10 flex h-full flex-col">
        {/* Floating Icon */}
        <div
          className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.color} text-white shadow-lg ring-1 shadow-black/40 ring-white/20`}
          style={{ transform: 'translateZ(20px)' }} // Extra pop for icon
        >
          <feature.icon className="h-8 w-8" />
        </div>

        <h3 className="mb-3 text-3xl font-bold text-white drop-shadow-lg">{feature.title}</h3>

        <p className="flex-grow text-base leading-relaxed font-medium text-slate-300">
          {feature.description}
        </p>

        {/* Action Button */}
        <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-6">
          <span
            className="text-xs font-bold tracking-widest uppercase"
            style={{ color: feature.glowColor }}
          >
            Explorer
          </span>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 transition-transform group-hover:scale-110 group-hover:bg-white/20">
            <ArrowRight className="h-5 w-5 text-white" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// --- Features Data ---
const FEATURES: Feature[] = [
  {
    icon: Layout,
    title: 'Tableaux Modernes',
    description: 'Une vue claire de vos KPIs avec des graphiques interactifs en temps réel.',
    color: 'from-blue-600 to-cyan-500',
    glowColor: '#06b6d4',
  },
  {
    icon: Users,
    title: 'Collaboration',
    description: 'Un espace unifié pour vos équipes, éliminant les silos de communication.',
    color: 'from-purple-600 to-fuchsia-500',
    glowColor: '#d946ef',
  },
  {
    icon: Zap,
    title: 'Workflow IA',
    description: 'Automatisez 80% de vos tâches répétitives grâce à notre moteur intelligent.',
    color: 'from-amber-500 to-orange-500',
    glowColor: '#f97316',
  },
  {
    icon: Shield,
    title: 'Sécurité Max',
    description: 'Chiffrement de bout en bout et protection avancée des données sensibles.',
    color: 'from-emerald-500 to-green-500',
    glowColor: '#10b981',
  },
  {
    icon: Globe,
    title: 'Global Ready',
    description: 'Support multi-langue et multi-devises pour une expansion sans limites.',
    color: 'from-indigo-600 to-violet-600',
    glowColor: '#6366f1',
  },
  {
    icon: Cpu,
    title: 'Performance',
    description: 'Une infrastructure ultra-rapide optimisée pour les charges lourdes.',
    color: 'from-rose-500 to-pink-500',
    glowColor: '#ec4899',
  },
];

// --- Infinite Marquee Carousel ---
export default function SplineStyleCarousel() {
  return (
    <div className="perspective-1000 relative mx-auto w-full max-w-[100vw] overflow-hidden py-10">
      {/* Side Fades for Seamless Look */}
      <div className="pointer-events-none absolute top-0 left-0 z-20 h-full w-32 bg-gradient-to-r from-slate-950 to-transparent" />
      <div className="pointer-events-none absolute top-0 right-0 z-20 h-full w-32 bg-gradient-to-l from-slate-950 to-transparent" />

      {/* Infinite Scroll Track */}
      <div className="flex w-fit">
        {/* Track 1 */}
        <motion.div
          className="flex gap-10 px-5"
          animate={{ x: '-50%' }}
          transition={{
            ease: 'linear',
            duration: 40, // Adjust speed (seconds to scroll half width)
            repeat: Infinity,
          }}
          style={{ width: 'max-content' }}
        >
          {[...FEATURES, ...FEATURES].map((feature, idx) => (
            <div key={`${feature.title}-${idx}`} className="py-10">
              <SpotlightCard feature={feature} />
            </div>
          ))}
        </motion.div>

        {/* Track 2 (Duplicate for seamless loop if needed, but the map above handles it via pure CSS/motion repeat usually, 
             actually simpler to just map list twice in one container and slide that container) 
             Wait, I mapped FEATURES twice above. If the container is wide enough, transform x -50% works perfectly.
         */}
      </div>
    </div>
  );
}
