'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface ConfettiProps {
  active: boolean;
  duration?: number;
}

/**
 * Confetti - Celebration animation
 * Displays confetti particles for success moments
 */
export default function Confetti({ active, duration = 3000 }: ConfettiProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (active) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), duration);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [active, duration]);

  if (!show) return null;

  const colors = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#8b5cf6'];
  const confettiPieces = Array.from({ length: 50 }, (_, i) => i);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {confettiPieces.map((piece) => {
        const startX = Math.random() * 100;
        const endX = startX + (Math.random() - 0.5) * 40;
        const delay = Math.random() * 0.5;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const rotation = Math.random() * 360;

        return (
          <motion.div
            key={piece}
            className="absolute w-2 h-2 rounded-full"
            style={{
              backgroundColor: color,
              left: `${startX}%`,
              top: '-10px',
            }}
            initial={{
              y: -10,
              x: 0,
              rotate: 0,
              opacity: 1,
            }}
            animate={{
              y: window.innerHeight + 20,
              x: `${(endX - startX) * 10}px`,
              rotate: rotation,
              opacity: 0,
            }}
            transition={{
              duration: 2 + Math.random(),
              delay,
              ease: 'easeIn',
            }}
          />
        );
      })}
    </div>
  );
}
