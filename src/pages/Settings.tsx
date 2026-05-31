import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Mail,
  MapPin,
  Phone,
  Quote,
  Settings as SettingsIcon,
  Sparkles,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { fieldInputClass } from '../components/FormField';
import { getValidationFields } from '../lib/validation-errors';

const fields = [
  { name: 'hospitalName', label: 'Hospital name', icon: Building2 },
  { name: 'tagline', label: 'Tagline', icon: Quote },
  { name: 'contact', label: 'Contact', icon: Phone },
  { name: 'email', label: 'Email', icon: Mail },
  { name: 'address', label: 'Address', icon: MapPin },
  { name: 'city', label: 'City', icon: MapPin },
] as const;

export default function Settings() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { data, isLoading, error } = useQuery({
    queryKey: ['settings'],
    queryFn: api.settings.get,
  });

  const update = useMutation({
    mutationFn: api.settings.update,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setFieldErrors({});
      toast('Settings saved successfully');
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const serverFields = getValidationFields(update.error) ?? {};
  const mergedErrors = { ...fieldErrors, ...serverFields };

  if (isLoading) return <LoadingSpinner />;
  if (error || !data) {
    return (
      <div className="alert-error p-6">
        {error?.message ?? 'Could not load settings'}
      </div>
    );
  }

  return (
    <div className="page-enter space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-8 text-white shadow-xl shadow-brand-900/20">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 animate-float rounded-full bg-white/10 blur-2xl" />
        <div
          className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 animate-float rounded-full bg-teal-300/20 blur-3xl"
          style={{ animationDelay: '1.2s' }}
        />
        <div className="pointer-events-none absolute right-1/4 top-1/2 h-32 w-32 animate-pulse rounded-full bg-emerald-400/10 blur-xl" />

        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-100 ring-1 ring-white/20 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Configuration
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Settings</h1>
            <p className="mt-2 text-base text-brand-100/90">
              Manage your hospital profile and branding details
            </p>
          </div>

          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 shadow-lg ring-1 ring-white/25 backdrop-blur-sm">
            <SettingsIcon className="h-8 w-8 text-white" />
          </div>
        </div>

        <div className="relative mt-6 flex flex-wrap gap-3">
          <span className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium ring-1 ring-white/15 backdrop-blur-sm">
            {data.hospitalName}
          </span>
          {data.city && (
            <span className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium ring-1 ring-white/15 backdrop-blur-sm">
              {data.city}
            </span>
          )}
          <span
            className={`rounded-xl px-4 py-2 text-sm font-semibold ring-1 backdrop-blur-sm ${
              isAdmin
                ? 'bg-amber-400/20 text-amber-100 ring-amber-300/30'
                : 'bg-sky-400/20 text-sky-100 ring-sky-300/30'
            }`}
          >
            {isAdmin ? 'Full access' : 'View only'}
          </span>
        </div>
      </div>

      <div className="card-panel relative max-w-2xl p-8 shadow-card-hover">

        {!isAdmin && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-sm text-amber-800">
              View only. Contact an administrator to change settings.
            </p>
          </div>
        )}

        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!isAdmin) return;
            const fd = new FormData(e.currentTarget);
            const hospitalName = fd.get('hospitalName') as string;
            const email = fd.get('email') as string;
            const errors: Record<string, string> = {};

            if (!hospitalName?.trim()) {
              errors.hospitalName = 'Hospital name is required';
            }
            if (email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
              errors.email = 'Enter a valid email address';
            }

            if (Object.keys(errors).length > 0) {
              setFieldErrors(errors);
              return;
            }

            setFieldErrors({});
            update.mutate({
              hospitalName,
              contact: fd.get('contact') as string,
              email,
              address: fd.get('address') as string,
              city: fd.get('city') as string,
              tagline: fd.get('tagline') as string,
            });
          }}
        >
          {fields.map(({ name, label, icon: Icon }, i) => (
            <label
              key={name}
              className="group block animate-slide-up"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <span className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600 transition group-focus-within:bg-brand-100 group-focus-within:shadow-sm">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                {label}
                {name === 'hospitalName' && <span className="text-red-500"> *</span>}
              </span>
              <input
                name={name}
                defaultValue={(data[name as keyof typeof data] as string) ?? ''}
                disabled={!isAdmin}
                onChange={() =>
                  setFieldErrors((prev) => ({ ...prev, [name]: undefined }))
                }
                className={`${fieldInputClass(!!mergedErrors[name])} transition focus:scale-[1.01] disabled:bg-slate-50 disabled:text-slate-500`}
              />
              {mergedErrors[name] && (
                <p className="mt-1 text-xs font-medium text-red-600">{mergedErrors[name]}</p>
              )}
            </label>
          ))}

          {update.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {update.error.message}
            </p>
          )}

          {isAdmin && (
            <button
              type="submit"
              disabled={update.isPending}
              className="btn-primary mt-2 w-full bg-gradient-to-r from-brand-600 to-brand-700 shadow-md transition hover:scale-[1.01] hover:shadow-lg disabled:hover:scale-100 sm:w-auto"
            >
              {update.isPending ? 'Saving…' : 'Save settings'}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
