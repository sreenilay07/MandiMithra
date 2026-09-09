import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  options,
  error,
  helperText,
  className = '',
  id,
  ...props
}, ref) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full text-left">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-bold text-slate-800 mb-1.5">
          {label}
        </label>
      )}
      <select
        id={selectId}
        ref={ref}
        className={`block w-full rounded-lg border-2 bg-white text-slate-900 text-base px-3.5 py-2.5 focus:outline-none transition-colors tap-target ${
          error
            ? 'border-rose-600 focus:border-rose-700'
            : 'border-slate-300 focus:border-blue-900'
        } ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error ? (
        <p className="mt-1.5 text-sm font-medium text-rose-700">{error}</p>
      ) : helperText ? (
        <p className="mt-1.5 text-xs text-slate-600">{helperText}</p>
      ) : null}
    </div>
  );
});

Select.displayName = 'Select';
