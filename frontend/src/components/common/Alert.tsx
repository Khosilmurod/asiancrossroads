import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { colors, borderRadius } from '../../styles/tokens';

type AlertVariant = 'success' | 'error' | 'info' | 'white';

interface AlertProps {
  variant?: AlertVariant;
  children: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  children,
  className
}) => {
  const baseStyles = "text-sm px-4 py-3 rounded-[3px]";
  
  const variantStyles = {
    success: `bg-green-50 text-green-600 border border-green-100`,
    error: `bg-red-50 text-red-600 border border-red-100`,
    info: `bg-blue-50 text-blue-600 border border-blue-100`,
    white: `bg-white/10 text-white border border-white/20`
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={clsx(
        baseStyles,
        variantStyles[variant],
        className
      )}
    >
      {children}
    </motion.div>
  );
}; 