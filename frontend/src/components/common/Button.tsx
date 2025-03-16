import React from 'react';
import clsx from 'clsx';

type ButtonVariant = 'primary' | 'secondary' | 'white';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  isLoading = false,
  leftIcon,
  rightIcon,
  className,
  children,
  disabled,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center text-[15px] font-medium px-5 py-2 rounded-[3px] transition-colors";
  
  const variantStyles = {
    primary: "bg-[#2563EB] text-white hover:bg-[#1d4ed8]",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
    white: "bg-white text-[#2563EB] hover:bg-white/90"
  };

  const disabledStyles = disabled || isLoading ? 'opacity-75 cursor-not-allowed' : '';

  return (
    <button
      className={clsx(
        baseStyles,
        variantStyles[variant],
        disabledStyles,
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-current mr-2" />
      )}
      {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
}; 