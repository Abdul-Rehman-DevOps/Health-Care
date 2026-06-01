import type { ReactNode } from 'react';
import { useEffect } from 'react';
import {
  Building2,
  Calendar,
  ClipboardList,
  History,
  LayoutDashboard,
  LogOut,
  Pill,
  Info,
  Settings,
  Stethoscope,
  User,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useHospitalBranding } from '../context/HospitalBrandingContext';
import AppLogo from './AppLogo';
import DeveloperCredit from './DeveloperCredit';
import type { PageId } from '../lib/routes';

export type { PageId };

const PAGE_TITLES: Record<PageId, string> = {
  dashboard: 'Dashboard',
  opd: 'OPD & Prescription',
  visits: 'Previous visits',
  patients: 'Patients',
  doctors: 'Doctors',
  appointments: 'Appointments',
  departments: 'Departments',
  pharmacy: 'Pharmacy',
  settings: 'Settings',
  about: 'About',
};

const nav: { id: PageId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'opd', label: 'OPD & Prescription', icon: ClipboardList },
  { id: 'visits', label: 'Previous visits', icon: History },
  { id: 'patients', label: 'Patient details', icon: Users },
  { id: 'doctors', label: 'Doctors', icon: Stethoscope },
  { id: 'appointments', label: 'Appointments', icon: Calendar },
  { id: 'departments', label: 'Departments', icon: Building2 },
  { id: 'pharmacy', label: 'Pharmacy', icon: Pill },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'about', label: 'About', icon: Info },
];

type Props = {
  page: PageId;
  onNavigate: (p: PageId) => void;
  children: ReactNode;
};

export default function Layout({ page, onNavigate, children }: Props) {
  const { user, isAdmin, logout } = useAuth();
  const { hospitalName } = useHospitalBranding();
  const roleLabel = isAdmin ? 'Admin' : 'Simple user';

  useEffect(() => {
    document.title = `${hospitalName}, ${PAGE_TITLES[page]}`;
  }, [hospitalName, page]);

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-[270px] flex-col overflow-hidden bg-gradient-to-b from-brand-950 via-brand-900 to-brand-950 text-white">
        <div className="pointer-events-none absolute -right-20 top-20 h-40 w-40 rounded-full bg-teal-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 bottom-32 h-32 w-32 rounded-full bg-brand-400/10 blur-2xl" />

        <div className="relative border-b border-white/10 px-6 py-7">
          <div className="flex items-center gap-3">
            <AppLogo size="md" variant="light" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-300/90">
                Hospital System
              </p>
              <p className="truncate text-xl font-bold tracking-tight">{hospitalName}</p>
            </div>
          </div>
        </div>

        <nav className="relative min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {nav.map(({ id, label, icon: Icon }, i) => {
            const active = page === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onNavigate(id)}
                style={{ animationDelay: `${i * 40}ms` }}
                className={`flex w-full animate-slide-up items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-white text-brand-900 shadow-lg nav-active-glow'
                    : 'text-brand-100/90 hover:translate-x-1 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon
                  className={`h-5 w-5 shrink-0 transition-transform duration-200 ${
                    active ? 'scale-110 text-brand-600' : ''
                  }`}
                />
                {label}
              </button>
            );
          })}
        </nav>

        <div className="relative shrink-0 border-t border-white/10 p-4">
          {user && (
            <div className="mb-3 rounded-xl bg-white/10 px-3 py-3 ring-1 ring-white/10 backdrop-blur-sm transition hover:bg-white/15">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400/30 to-teal-400/20">
                  <User className="h-4 w-4 text-brand-100" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">
                    {user.displayName || user.username}
                  </p>
                  <p className="truncate text-xs text-brand-200/80">@{user.username}</p>
                </div>
              </div>
              <span
                className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                  isAdmin
                    ? 'bg-amber-400/20 text-amber-200 ring-1 ring-amber-300/30'
                    : 'bg-sky-400/20 text-sky-200 ring-1 ring-sky-300/30'
                }`}
              >
                {roleLabel}
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 py-2.5 text-sm font-medium text-brand-100 transition-all duration-200 hover:bg-white/20 hover:shadow-md"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
          <DeveloperCredit variant="sidebar" className="mt-3 px-1" />
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col pl-[270px]">
        <header className="shrink-0 border-b border-slate-200/80 bg-white/70 px-6 py-4 backdrop-blur-xl lg:px-10">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse-soft rounded-full bg-brand-500" />
            <p className="bg-gradient-to-r from-brand-800 to-brand-600 bg-clip-text text-sm font-bold text-transparent">
              {hospitalName}
            </p>
          </div>
        </header>
        <main className="relative min-h-0 flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="app-mesh pointer-events-none absolute inset-0" aria-hidden />
          <div className="relative">{children}</div>
        </main>
      </div>
    </div>
  );
}
