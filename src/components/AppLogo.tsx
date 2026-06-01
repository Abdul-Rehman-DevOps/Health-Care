import { HeartPulse } from 'lucide-react';

type Props = {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark';
  showPulse?: boolean;
};

const sizes = {
  sm: { box: 'h-9 w-9 rounded-xl', icon: 'h-4 w-4' },
  md: { box: 'h-11 w-11 rounded-2xl', icon: 'h-6 w-6' },
  lg: { box: 'h-16 w-16 rounded-2xl', icon: 'h-8 w-8' },
};

export default function AppLogo({
  size = 'md',
  variant = 'dark',
  showPulse = true,
}: Props) {
  const s = sizes[size];
  const light = variant === 'light';

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center ${s.box} ${
        light
          ? 'bg-white/15 shadow-lg ring-1 ring-white/20 backdrop-blur-md'
          : 'bg-gradient-to-br from-brand-500 to-teal-500 shadow-md shadow-brand-500/25 ring-1 ring-brand-400/30'
      }`}
    >
      <HeartPulse className={`${s.icon} ${light ? 'text-brand-100' : 'text-white'}`} />
      {showPulse && (
        <span
          className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full ${
            light ? 'bg-emerald-300' : 'bg-emerald-400'
          } ring-2 ${light ? 'ring-brand-900/40' : 'ring-white'}`}
        />
      )}
    </div>
  );
}
