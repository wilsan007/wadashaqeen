import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PointMaterial, Points } from '@react-three/drei';
import * as THREE from 'three';

// --- Configuration ---
const PARTICLE_COUNT = 2000;
const PARTICLE_SIZE = 0.02;
const PARTICLE_COLOR = '#00ffff'; // Cyan accent
const MOUSE_INFLUENCE_RADIUS = 2; // Radius of mouse repulsion
const MOUSE_STRENGTH = 2; // Strength of repulsion

interface MouseRef {
  current: {
    x: number;
    y: number;
    isActive: boolean;
  };
}

function ParticleField({ mouseRef }: { mouseRef: MouseRef }) {
  const points = useRef<THREE.Points>(null!);

  // Create particles
  const [positions, initialPositions] = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const initPos = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const x = (Math.random() - 0.5) * 15; // Spread on X
      const y = (Math.random() - 0.5) * 15; // Spread on Y
      const z = (Math.random() - 0.5) * 5; // Depth

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      initPos[i * 3] = x;
      initPos[i * 3 + 1] = y;
      initPos[i * 3 + 2] = z;
    }

    return [pos, initPos];
  }, []);

  useFrame((state, delta) => {
    if (!points.current) return;

    const time = state.clock.getElapsedTime();
    const currentPositions = points.current.geometry.attributes.position.array as Float32Array;

    // Mouse position in 3D space
    const mx = mouseRef.current.x * 10; // Scale to world units roughly
    const my = mouseRef.current.y * 10;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const ix = initialPositions[i3];
      const iy = initialPositions[i3 + 1];
      const iz = initialPositions[i3 + 2];

      // Organic movement
      const moveX = Math.sin(time * 0.2 + ix) * 0.2;
      const moveY = Math.cos(time * 0.3 + iy) * 0.2;

      let tx = ix + moveX;
      let ty = iy + moveY;
      let tz = iz;

      // Mouse interaction (Repulsion)
      if (mouseRef.current.isActive) {
        const dx = tx - mx;
        const dy = ty - my;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < MOUSE_INFLUENCE_RADIUS) {
          const force = (MOUSE_INFLUENCE_RADIUS - dist) / MOUSE_INFLUENCE_RADIUS;
          const angle = Math.atan2(dy, dx);

          tx += Math.cos(angle) * force * MOUSE_STRENGTH;
          ty += Math.sin(angle) * force * MOUSE_STRENGTH;
        }
      }

      // Apply easing for smooth transition back to original path
      // We lerp current position to target position
      currentPositions[i3] += (tx - currentPositions[i3]) * 5 * delta;
      currentPositions[i3 + 1] += (ty - currentPositions[i3 + 1]) * 5 * delta;
      currentPositions[i3 + 2] += (tz - currentPositions[i3 + 2]) * 5 * delta;
    }

    points.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <Points ref={points} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color={PARTICLE_COLOR}
        size={PARTICLE_SIZE}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={0.6}
      />
    </Points>
  );
}

// Mobile fallback component
const MobileFallback = () => (
  <div
    className="pointer-events-none fixed inset-0 z-[-1]"
    style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)', // Dark slate gradient
    }}
  />
);

export default function FuturisticBackground() {
  const mouseRef = useRef<MouseRef['current']>({ x: 0, y: 0, isActive: false });
  const [isVisible, setIsVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Simple mobile detection
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Visibility API to pause when tab is hidden
    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('resize', checkMobile);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    // Normalized coordinates -1 to 1
    mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    mouseRef.current.isActive = true;
  };

  // If mobile, return static fallback to save battery/performance
  if (isMobile) {
    return <MobileFallback />;
  }

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[-1] h-screen w-screen bg-neutral-950"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        mouseRef.current.isActive = false;
      }}
      style={{
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.5s ease-in-out',
      }}
    >
      {isVisible && (
        <Canvas
          camera={{ position: [0, 0, 5], fov: 60 }}
          gl={{
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance',
          }}
          dpr={[1, 2]} // Limit pixel ratio for performance
          frameloop={isVisible ? 'always' : 'never'} // Pause loop when not visible using visibilityState
        >
          <color attach="background" args={['#050505']} />
          <fog attach="fog" args={['#050505', 5, 15]} />
          <ParticleField mouseRef={mouseRef} />
        </Canvas>
      )}
    </div>
  );
}
