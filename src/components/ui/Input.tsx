import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const inputId = id || (label ? label.replace(/\s+/g, '-').toLowerCase() : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 mb-1">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={twMerge(
            clsx(
              'w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors disabled:bg-slate-100 disabled:text-slate-500',
              error && 'border-rose-500 focus:ring-rose-500 focus:border-rose-500',
              className
            )
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
        {helperText && !error && <p className="mt-1 text-xs text-slate-500">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
