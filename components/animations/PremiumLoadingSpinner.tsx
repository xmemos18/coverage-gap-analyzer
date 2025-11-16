'use client';

import { motion } from 'framer-motion';

interface PremiumLoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * PremiumLoadingSpinner - Branded loading animation
 * Smooth, premium loading indicator with brand colors
 */
export default function PremiumLoadingSpinner({
  size = 'md',
  className = ''
}: PremiumLoadingSpinnerProps) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <motion.div
      className={`${sizes[size]} ${className} relative`}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      {[0, 1, 2].map((i) => {
        const colors = ['#2563eb', '#16a34a', '#f59e0b'];

        return (
          <motion.div
            key={i}
            className="absolute inset-0 border-4 rounded-full"
            style={{
              borderColor: colors[i],
              borderTopColor: 'transparent',
            }}
            animate={{
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
              ease: 'easeInOut',
            }}
          />
        );
      })}
    </motion.div>
  );
}
