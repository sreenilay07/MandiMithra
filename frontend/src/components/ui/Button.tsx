import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'success' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 tap-target rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none';

  const variants = {
    primary: 'bg-blue-900 hover:bg-blue-950 text-white focus:ring-blue-900 border border-transparent shadow-sm',
    secondary: 'bg-slate-800 hover:bg-slate-900 text-white focus:ring-slate-800 border border-transparent',
    outline: 'bg-white hover:bg-slate-100 text-blue-900 border-2 border-blue-900 focus:ring-blue-900',
    success: 'bg-emerald-700 hover:bg-emerald-800 text-white focus:ring-emerald-700 border border-transparent shadow-sm',
    danger: 'bg-rose-700 hover:bg-rose-800 text-white focus:ring-rose-700 border border-transparent shadow-sm',
    ghost: 'bg-transparent hover:bg-slate-200/60 text-slate-800 focus:ring-slate-400'
  };

  const sizes = {
    sm: 'text-sm px-3 py-1.5 min-h-[38px]',
    md: 'text-base px-4 py-2.5 min-h-[44px]',
    lg: 'text-lg px-6 py-3 min-h-[50px]'
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-current fill-none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : icon ? (
        <span className="mr-2 inline-flex items-center">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};
