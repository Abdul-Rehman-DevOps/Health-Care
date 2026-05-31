import type { ReactNode } from 'react';

export function fieldInputClass(hasError?: boolean, extra = '') {
  const err = hasError ? 'border-red-300 focus:border-red-500 focus:ring-red-500/25' : '';
  return ['input', extra, err].filter(Boolean).join(' ');
}

export default function FormField({
  label,
  required,
  error,
  children,
  className = '',
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block text-sm font-medium text-slate-700 ${className}`}>
      {label}
      {required && <span className="text-red-500"> *</span>}
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </label>
  );
}
