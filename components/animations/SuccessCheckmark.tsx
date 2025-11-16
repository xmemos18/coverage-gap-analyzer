'use client';

import { motion } from 'framer-motion';

interface SuccessCheckmarkProps {
  size?: number;
  color?: string;
  className?: string;
}

/**
 * SuccessCheckmark - Animated checkmark for success states
 * Draws checkmark path with satisfying animation
 */
export default function SuccessCheckmark({
  size = 24,
  color = '#16a34a',
  className = ''
}: SuccessCheckmarkProps) {
  const checkVariants = {
    hidden: {
      pathLength: 0,
      opacity: 0,
    },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: {
          type: 'spring' as const,
          duration: 0.6,
          bounce: 0,
        },
        opacity: { duration: 0.1 },
      },
    },
  };

  const circleVariants = {
    hidden: {
      scale: 0,
      opacity: 0,
    },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 260,
        damping: 20,
      },
    },
  };

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      initial="hidden"
      animate="visible"
    >
      <motion.circle
        cx="12"
        cy="12"
        r="11"
        stroke={color}
        strokeWidth="2"
        variants={circleVariants}
      />
      <motion.path
        d="M7 12L10.5 15.5L17 9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        variants={checkVariants}
      />
    </motion.svg>
  );
}
