import type { LucideIcon } from 'lucide-react';

type Props = {
  label: string;
  value: number | string;
  icon: LucideIcon;
  hint?: string;
  gradient?: string;
  onClick?: () => void;
  delay?: number;
};

export default function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  gradient = 'from-brand-500 to-brand-700',
  onClick,
  delay = 0,
}: Props) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
      className={`card group relative animate-slide-up w-full overflow-hidden p-5 text-left ${
        onClick
          ? 'card-interactive cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2'
          : 'hover:shadow-card-hover'
      }`}
    >
      <div className="absolute inset-x-0 top-0 h-0.5 scale-x-0 bg-gradient-to-r from-brand-400 to-teal-400 transition-transform duration-300 group-hover:scale-x-100" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 bg-gradient-to-br from-slate-900 to-slate-700 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            {value}
          </p>
          {hint && (
            <p className="mt-1 text-xs font-medium text-amber-600">{hint}</p>
          )}
          {onClick && (
            <p className="mt-2 text-xs font-semibold text-brand-600 opacity-0 transition-all duration-200 group-hover:translate-x-1 group-hover:opacity-100">
              Open section →
            </p>
          )}
        </div>
        <div
          className={`icon-badge group h-12 w-12 bg-gradient-to-br ${gradient}`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Tag>
  );
}
