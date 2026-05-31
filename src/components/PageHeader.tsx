import type { ReactNode } from 'react';

type Props = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export default function PageHeader({ title, subtitle, action }: Props) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="relative">
        <div className="page-header-glow" aria-hidden />
        <span className="page-title-accent" aria-hidden />
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {action && (
        <div className="shrink-0 animate-slide-up" style={{ animationDelay: '80ms' }}>
          {action}
        </div>
      )}
    </div>
  );
}
