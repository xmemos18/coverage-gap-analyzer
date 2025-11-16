'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface SlideInProps {
  children: ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  delay?: number;
  duration?: number;
  className?: string;
}

/**
 * SlideIn - Slide-in entrance animation
 * Use for prominent element reveals
 */
export default function SlideIn({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.5,
  className = ''
}: SlideInProps) {
  const directions = {
    up: { y: 40 },
    down: { y: -40 },
    left: { x: 40 },
    right: { x: -40 },
  };

  return (
    <motion.div
      initial={{
        opacity: 0,
        ...directions[direction]
      }}
      animate={{
        opacity: 1,
        y: 0,
        x: 0
      }}
      transition={{
        duration,
        delay,
        ease: [0.34, 1.56, 0.64, 1], // Spring easing
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
