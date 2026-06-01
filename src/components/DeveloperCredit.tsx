import { APP_DEVELOPER } from '../lib/app-meta';

type Variant = 'sidebar' | 'login' | 'page';

const variantClass: Record<Variant, string> = {
  sidebar: 'text-center text-[10px] leading-relaxed text-brand-300/55',
  login: 'text-center text-xs font-medium tracking-wide text-white/35',
  page: 'text-center text-xs text-slate-400',
};

const nameClass: Record<Variant, string> = {
  sidebar: 'font-semibold text-brand-100/75',
  login: 'font-semibold text-white/55',
  page: 'font-semibold text-slate-600',
};

type Props = {
  variant?: Variant;
  className?: string;
};

export default function DeveloperCredit({ variant = 'page', className = '' }: Props) {
  return (
    <p className={`${variantClass[variant]} ${className}`.trim()}>
      Developed and Deployed by <span className={nameClass[variant]}>{APP_DEVELOPER}</span>
    </p>
  );
}
