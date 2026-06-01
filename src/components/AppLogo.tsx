import { HeartPulse } from 'lucide-react';
import { useHospitalBranding } from '../context/HospitalBrandingContext';
import { prescriptionHeaderLogo, resolvePublicUrl } from '../lib/hospital-logo';

type Props = {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark';
  showPulse?: boolean;
};

const sizes = {
  sm: { box: 'h-9 w-9 rounded-xl', icon: 'h-4 w-4', img: 'h-7 w-7' },
  md: { box: 'h-11 w-11 rounded-2xl', icon: 'h-6 w-6', img: 'h-9 w-9' },
  lg: { box: 'h-16 w-16 rounded-2xl', icon: 'h-8 w-8', img: 'h-14 w-14' },
};

export default function AppLogo({
  size = 'md',
  variant = 'dark',
  showPulse = false,
}: Props) {
  const branding = useHospitalBranding();
  const s = sizes[size];
  const light = variant === 'light';
  const src = resolvePublicUrl(prescriptionHeaderLogo(branding));

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden bg-white ${s.box} ${
        light
          ? 'shadow-lg ring-1 ring-white/20'
          : 'shadow-md ring-1 ring-slate-200/80'
      }`}
    >
      <img
        src={src}
        alt={`${branding.hospitalName} logo`}
        className={`${s.img} max-h-full max-w-full object-contain p-0.5`}
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          const fallback = e.currentTarget.nextElementSibling;
          if (fallback) (fallback as HTMLElement).style.display = 'flex';
        }}
      />
      <div
        className={`absolute inset-0 hidden items-center justify-center ${
          light ? 'bg-white/15' : 'bg-gradient-to-br from-brand-500 to-teal-500'
        }`}
        aria-hidden
      >
        <HeartPulse className={`${s.icon} ${light ? 'text-brand-100' : 'text-white'}`} />
      </div>
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
