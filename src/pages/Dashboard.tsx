import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Calendar,
  ClipboardList,
  HeartPulse,
  Pill,
  Sparkles,
  Stethoscope,
  Users,
} from 'lucide-react';
import { api } from '../lib/api';
import { useHospitalBranding } from '../context/HospitalBrandingContext';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import type { PageId } from '../components/Layout';

type Props = { onNavigate: (p: PageId) => void };

export default function Dashboard({ onNavigate }: Props) {
  const { hospitalName } = useHospitalBranding();
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: api.dashboard,
    staleTime: 30_000,
  });

  if (error) {
    return (
      <div className="alert-error p-8">
        <p className="text-lg font-bold text-red-900">Cannot reach API</p>
        <p className="mt-2 text-sm text-red-600">{error.message}</p>
      </div>
    );
  }

  const name = hospitalName;

  return (
    <div>
      <div className="hero-banner">
        <div className="hero-orb -right-16 -top-16 h-56 w-56 animate-float bg-white/10" />
        <div
          className="hero-orb -bottom-20 left-1/4 h-48 w-48 animate-float bg-teal-300/20"
          style={{ animationDelay: '1.2s' }}
        />
        <div className="hero-orb right-1/3 top-1/2 h-32 w-32 animate-pulse-soft bg-emerald-400/10" />

        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-100 ring-1 ring-white/20">
              <Sparkles className="h-3.5 w-3.5" />
              Overview
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{name}</h1>
            <p className="mt-2 text-brand-100">Hospital management at a glance</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onNavigate('opd')}
              className="group rounded-2xl bg-white px-5 py-4 text-center text-brand-900 shadow-lg transition hover:-translate-y-1"
            >
              <ClipboardList className="mx-auto mb-1 h-5 w-5 text-brand-600" />
              <p className="text-sm font-bold">New OPD visit</p>
              <p className="text-xs text-brand-600">Prescription & bill</p>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('appointments')}
              className="group rounded-2xl bg-white/15 px-6 py-4 text-center ring-1 ring-white/20 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white/25 hover:shadow-glow"
            >
              <HeartPulse className="mx-auto mb-1 h-5 w-5 text-brand-200 transition group-hover:scale-110" />
              <p className="text-3xl font-bold">
                {isLoading ? '…' : data?.appointmentsToday ?? 0}
              </p>
              <p className="text-xs font-medium text-brand-100">Appointments today</p>
            </button>
          </div>
        </div>
      </div>

      <PageHeader title="Quick access" subtitle="Click a card to open that section" />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="OPD today"
          value={isLoading ? '…' : data?.visitsToday ?? 0}
          icon={ClipboardList}
          gradient="from-teal-500 to-teal-700"
          onClick={() => onNavigate('opd')}
          delay={0}
        />
        <StatCard
          label="Total patients"
          value={isLoading ? '…' : data?.patients ?? 0}
          icon={Users}
          gradient="from-blue-500 to-blue-700"
          onClick={() => onNavigate('patients')}
          delay={40}
        />
        <StatCard
          label="Active doctors"
          value={isLoading ? '…' : data?.doctors ?? 0}
          icon={Stethoscope}
          gradient="from-violet-500 to-violet-700"
          onClick={() => onNavigate('doctors')}
          delay={60}
        />
        <StatCard
          label="Today's schedule"
          value={isLoading ? '…' : data?.appointmentsToday ?? 0}
          icon={Calendar}
          gradient="from-brand-500 to-brand-700"
          onClick={() => onNavigate('appointments')}
          delay={120}
        />
        <StatCard
          label="Pharmacy stock"
          value={isLoading ? '…' : data?.drugs ?? 0}
          icon={Pill}
          gradient="from-emerald-500 to-emerald-700"
          hint={
            !isLoading && (data?.lowStock ?? 0) > 0
              ? `${data?.lowStock} low stock`
              : undefined
          }
          onClick={() => onNavigate('pharmacy')}
          delay={180}
        />
      </div>

      {!isLoading && (data?.lowStock ?? 0) > 0 && (
        <button
          type="button"
          onClick={() => onNavigate('pharmacy')}
          className="alert-warning mt-6"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold text-amber-900">Low stock alert</p>
            <p className="mt-0.5 text-sm text-amber-800">
              {data?.lowStock} medicines need restocking. Tap to open pharmacy.
            </p>
          </div>
        </button>
      )}
    </div>
  );
}
