const styles = {
  default: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200/60',
  success: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/60',
  warning: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200/60',
  info: 'bg-brand-50 text-brand-800 ring-1 ring-brand-200/60',
} as const;

type Props = {
  children: React.ReactNode;
  variant?: keyof typeof styles;
};

export default function Badge({ children, variant = 'default' }: Props) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-sm ${styles[variant]}`}
    >
      {children}
    </span>
  );
}
