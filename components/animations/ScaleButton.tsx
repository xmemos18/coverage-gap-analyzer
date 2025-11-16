'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface ScaleButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  ariaLabel?: string;
}

/**
 * ScaleButton - Button with premium press/hover animations
 * Adds satisfying tactile feedback
 */
export default function ScaleButton({
  children,
  className = '',
  onClick,
  disabled,
  type = 'button',
  ariaLabel,
}: ScaleButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 25,
      }}
      className={className}
      onClick={onClick}
      disabled={disabled}
      type={type}
      aria-label={ariaLabel}
    >
      {children}
    </motion.button>
  );
}
