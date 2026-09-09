import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full text-left">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-bold text-slate-800 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative rounded-lg shadow-xs">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`block w-full rounded-lg border-2 bg-white text-slate-900 text-base placeholder-slate-400 focus:outline-none transition-colors tap-target ${
            leftIcon ? 'pl-11' : 'px-3.5'
          } py-2.5 ${
            error
              ? 'border-rose-600 focus:border-rose-700 focus:ring-1 focus:ring-rose-700'
              : 'border-slate-300 focus:border-blue-900 focus:ring-1 focus:ring-blue-900'
          } ${className}`}
          {...props}
        />
      </div>
      {error ? (
        <p className="mt-1.5 text-sm font-medium text-rose-700">{error}</p>
      ) : helperText ? (
        <p className="mt-1.5 text-xs text-slate-600">{helperText}</p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
