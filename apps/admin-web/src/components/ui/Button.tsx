import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-emerald-700 text-white hover:bg-emerald-800 focus:ring-emerald-600 shadow-sm',
    secondary: 'bg-slate-800 text-white hover:bg-slate-900 focus:ring-slate-700 shadow-sm',
    outline: 'border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 focus:ring-emerald-600 shadow-sm',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500 shadow-sm',
    ghost: 'text-slate-700 hover:bg-slate-100 focus:ring-slate-400',
  };

  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5 min-h-[32px]',
    md: 'text-sm px-4 py-2 gap-2 min-h-[40px]',
    lg: 'text-base px-5 py-2.5 gap-2.5 min-h-[48px]',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
};
