import { HeartPulse, Info } from 'lucide-react';
import { useHospitalBranding } from '../context/HospitalBrandingContext';
import AppLogo from '../components/AppLogo';
import DeveloperCredit from '../components/DeveloperCredit';

export default function About() {
  const { hospitalName, tagline } = useHospitalBranding();

  return (
    <div className="page-enter mx-auto max-w-2xl space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-8 text-white shadow-xl shadow-brand-900/20">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col items-center text-center">
          <AppLogo size="lg" variant="light" />
          <h1 className="mt-5 text-3xl font-bold tracking-tight">{hospitalName}</h1>
          <p className="mt-2 text-brand-100/85">
            {tagline || 'Hospital Management System'}
          </p>
        </div>
      </div>

      <div className="card-panel space-y-6 p-8 shadow-card-hover">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
            <Info className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">About this application</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              A hospital management system for patient records, doctor schedules, appointments,
              departments, pharmacy inventory, and hospital settings — built for day-to-day
              clinical and administrative work.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50/80 to-teal-50/50 px-5 py-5">
          <HeartPulse className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-800">Credits</p>
            <DeveloperCredit variant="page" className="!text-left text-sm text-slate-600" />
          </div>
        </div>
      </div>
    </div>
  );
}
