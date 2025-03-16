import React from 'react';
import { colors, borderRadius, typography } from '../../styles/tokens';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'white';
}

export const Input: React.FC<InputProps> = ({
  variant = 'default',
  className,
  ...props
}) => {
  const baseStyles = "w-full px-5 py-2 transition-all text-[15px] focus:outline-none focus:ring-2";
  
  const variantStyles = {
    default: `bg-gray-50 border border-gray-200 rounded-[${borderRadius.button}] text-gray-900 placeholder-gray-500 focus:ring-[${colors.primary.light}]/20 focus:border-[${colors.primary.light}]`,
    white: `bg-white/10 border border-white/20 rounded-[${borderRadius.button}] text-white placeholder-white/60 focus:ring-white/40`
  };

  return (
    <input
      className={clsx(
        baseStyles,
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}; 