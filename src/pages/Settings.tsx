import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  KeyRound,
  Mail,
  MapPin,
  Phone,
  Plus,
  Quote,
  Sparkles,
  Trash2,
  UserCog,
} from 'lucide-react';
import { api, type AppUser, type NewAppUser } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useHospitalBranding } from '../context/HospitalBrandingContext';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useConfirmDelete } from '../hooks/useConfirmDelete';
import Badge from '../components/Badge';
import AppLogo from '../components/AppLogo';
import FormField, { fieldInputClass } from '../components/FormField';
import { getValidationFields } from '../lib/validation-errors';

const fieldMeta = {
  hospitalName: { label: 'Hospital name', icon: Building2, required: true },
  tagline: { label: 'Tagline', icon: Quote },
  contact: { label: 'Contact', icon: Phone },
  email: { label: 'Email', icon: Mail },
  address: { label: 'Address', icon: MapPin },
  city: { label: 'City', icon: MapPin },
} as const;

const formSections = [
  {
    title: 'Hospital identity',
    subtitle: 'Shown on login, sidebar, and browser tab',
    fields: ['hospitalName', 'tagline'] as const,
  },
  {
    title: 'Contact details',
    subtitle: 'Phone and email for your hospital',
    fields: ['contact', 'email'] as const,
  },
  {
    title: 'Location',
    subtitle: 'Address shown in hospital profile',
    fields: ['address', 'city'] as const,
  },
];

function UserAccountsSection() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const confirmDelete = useConfirmDelete();
  const [resetUser, setResetUser] = useState<AppUser | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [newUser, setNewUser] = useState<NewAppUser>({
    username: '',
    password: '',
    displayName: '',
    role: 'user',
  });
  const [addErrors, setAddErrors] = useState<Record<string, string>>({});

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: api.users.list,
  });

  const resetPassword = useMutation({
    mutationFn: ({ id, password: nextPassword }: { id: string; password: string }) =>
      api.users.resetPassword(id, nextPassword),
    onSuccess: () => {
      toast(`Password updated for ${resetUser?.username ?? 'user'}`);
      closeResetModal();
    },
  });

  const createUser = useMutation({
    mutationFn: api.users.create,
    onSuccess: (user) => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast(`${user.displayName} added`);
      closeAddModal();
    },
  });

  const deleteUser = useMutation({
    mutationFn: api.users.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const serverFields = getValidationFields(resetPassword.error) ?? {};
  const mergedErrors = { ...fieldErrors, ...serverFields };
  const addServerFields = getValidationFields(createUser.error) ?? {};
  const mergedAddErrors = { ...addErrors, ...addServerFields };

  function closeResetModal() {
    setResetUser(null);
    setPassword('');
    setConfirmPassword('');
    setFieldErrors({});
    resetPassword.reset();
  }

  function closeAddModal() {
    setAddOpen(false);
    setNewUser({ username: '', password: '', displayName: '', role: 'user' });
    setAddErrors({});
    createUser.reset();
  }

  function handleResetSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resetUser) return;

    const errors: Record<string, string> = {};
    if (!password.trim()) errors.password = 'New password is required';
    else if (password.length < 4) errors.password = 'Password must be at least 4 characters';
    if (!confirmPassword.trim()) errors.confirmPassword = 'Please confirm the password';
    else if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    resetPassword.mutate({ id: resetUser.id, password });
  }

  function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!newUser.displayName.trim()) errors.displayName = 'Display name is required';
    if (!newUser.username.trim()) errors.username = 'Username is required';
    else if (newUser.username.trim().length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }
    if (!newUser.password.trim()) errors.password = 'Password is required';
    else if (newUser.password.length < 4) errors.password = 'Password must be at least 4 characters';
    if (!confirmPassword.trim()) errors.confirmPassword = 'Please confirm the password';
    else if (newUser.password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setAddErrors(errors);
      return;
    }

    setAddErrors({});
    createUser.mutate({
      ...newUser,
      username: newUser.username.trim().toLowerCase(),
      displayName: newUser.displayName.trim(),
    });
  }

  return (
    <div className="card-panel flex h-full flex-col overflow-hidden shadow-card-hover">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-violet-50 via-white to-brand-50 px-6 py-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
            <UserCog className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">User accounts</h2>
            <p className="mt-1 text-sm text-slate-500">
              Add users, reset passwords, or remove admin and simple user accounts.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setAddOpen(true);
            setConfirmPassword('');
            setAddErrors({});
            createUser.reset();
          }}
          className="btn-primary shrink-0 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Add new user
        </button>
      </div>

      <div className="flex-1 p-6">
        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <p className="text-sm text-red-600">{error.message}</p>
        ) : (
          <div className="space-y-3">
            {users?.map((user) => (
              <div
                key={user.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-gradient-to-r from-slate-50/80 to-white px-4 py-3.5 transition hover:border-brand-100 hover:shadow-sm"
              >
                <div>
                  <p className="font-semibold text-slate-900">{user.displayName}</p>
                  <p className="text-sm text-slate-500">@{user.username}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={user.role === 'admin' ? 'warning' : 'info'}>
                    {user.role === 'admin' ? 'Admin' : 'Simple user'}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => {
                      setResetUser(user);
                      setPassword('');
                      setConfirmPassword('');
                      setFieldErrors({});
                      resetPassword.reset();
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
                  >
                    <KeyRound className="h-4 w-4" />
                    Reset password
                  </button>
                  <button
                    type="button"
                    disabled={user.id === currentUser?.id || deleteUser.isPending}
                    title={
                      user.id === currentUser?.id
                        ? 'You cannot delete your own account'
                        : 'Delete user'
                    }
                    onClick={() => {
                      confirmDelete.ask({
                        title: `Delete ${user.displayName}?`,
                        message: `Remove @${user.username} permanently? This cannot be undone.`,
                        onConfirm: async () => {
                          try {
                            await deleteUser.mutateAsync(user.id);
                            toast(`${user.displayName} removed`);
                          } catch (err) {
                            toast(
                              err instanceof Error ? err.message : 'Could not delete user',
                              'error'
                            );
                            throw err;
                          }
                        },
                      });
                    }}
                    className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-white p-2.5 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete user</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmDelete.pending}
        title={confirmDelete.pending?.title ?? ''}
        message={confirmDelete.pending?.message}
        loading={confirmDelete.loading || deleteUser.isPending}
        onCancel={confirmDelete.cancel}
        onConfirm={confirmDelete.confirm}
      />

      <Modal
        title={`Reset password, ${resetUser?.displayName ?? ''}`}
        open={!!resetUser}
        onClose={closeResetModal}
      >
        <form className="space-y-4" onSubmit={handleResetSubmit}>
          <p className="text-sm text-slate-500">
            Set a new password for <span className="font-medium">@{resetUser?.username}</span>.
          </p>

          <FormField label="New password" required error={mergedErrors.password}>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setFieldErrors((prev) => ({ ...prev, password: undefined }));
                setPassword(e.target.value);
              }}
              className={fieldInputClass(!!mergedErrors.password)}
              autoComplete="new-password"
            />
          </FormField>

          <FormField label="Confirm password" required error={mergedErrors.confirmPassword}>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                setConfirmPassword(e.target.value);
              }}
              className={fieldInputClass(!!mergedErrors.confirmPassword)}
              autoComplete="new-password"
            />
          </FormField>

          {resetPassword.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {resetPassword.error.message}
            </p>
          )}

          <button
            type="submit"
            disabled={resetPassword.isPending}
            className="btn-primary w-full"
          >
            {resetPassword.isPending ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </Modal>

      <Modal title="Add new user" open={addOpen} onClose={closeAddModal}>
        <form className="space-y-4" onSubmit={handleAddSubmit}>
          <FormField label="Display name" required error={mergedAddErrors.displayName}>
            <input
              value={newUser.displayName}
              onChange={(e) => {
                setAddErrors((prev) => ({ ...prev, displayName: undefined }));
                setNewUser({ ...newUser, displayName: e.target.value });
              }}
              className={fieldInputClass(!!mergedAddErrors.displayName)}
              placeholder="e.g. Reception Staff"
            />
          </FormField>

          <FormField label="Username" required error={mergedAddErrors.username}>
            <input
              value={newUser.username}
              onChange={(e) => {
                setAddErrors((prev) => ({ ...prev, username: undefined }));
                setNewUser({ ...newUser, username: e.target.value });
              }}
              className={fieldInputClass(!!mergedAddErrors.username, 'font-mono')}
              placeholder="e.g. reception"
              autoComplete="off"
            />
          </FormField>

          <FormField label="Role" required error={mergedAddErrors.role}>
            <select
              value={newUser.role}
              onChange={(e) =>
                setNewUser({ ...newUser, role: e.target.value as NewAppUser['role'] })
              }
              className={fieldInputClass(!!mergedAddErrors.role)}
            >
              <option value="user">Simple user</option>
              <option value="admin">Admin</option>
            </select>
          </FormField>

          <FormField label="Password" required error={mergedAddErrors.password}>
            <input
              type="password"
              value={newUser.password}
              onChange={(e) => {
                setAddErrors((prev) => ({ ...prev, password: undefined }));
                setNewUser({ ...newUser, password: e.target.value });
              }}
              className={fieldInputClass(!!mergedAddErrors.password)}
              autoComplete="new-password"
            />
          </FormField>

          <FormField label="Confirm password" required error={mergedAddErrors.confirmPassword}>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setAddErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                setConfirmPassword(e.target.value);
              }}
              className={fieldInputClass(!!mergedAddErrors.confirmPassword)}
              autoComplete="new-password"
            />
          </FormField>

          {createUser.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {createUser.error.message}
            </p>
          )}

          <button type="submit" disabled={createUser.isPending} className="btn-primary w-full">
            {createUser.isPending ? 'Adding…' : 'Add user'}
          </button>
        </form>
      </Modal>
    </div>
  );
}

export default function Settings() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState({ name: '', tagline: '' });
  const { data, isLoading, error } = useQuery({
    queryKey: ['settings'],
    queryFn: api.settings.get,
  });

  useEffect(() => {
    if (data) {
      setPreview({
        name: data.hospitalName,
        tagline: data.tagline ?? '',
      });
    }
  }, [data]);

  const update = useMutation({
    mutationFn: api.settings.update,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['branding'] });
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
    <div className="page-enter mx-auto max-w-6xl space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-8 text-white shadow-xl shadow-brand-900/20">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 animate-float rounded-full bg-white/10 blur-2xl" />
        <div
          className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 animate-float rounded-full bg-teal-300/20 blur-3xl"
          style={{ animationDelay: '1.2s' }}
        />
        <div className="pointer-events-none absolute right-1/4 top-1/2 h-32 w-32 animate-pulse rounded-full bg-emerald-400/10 blur-xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-100 ring-1 ring-white/20 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Configuration
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Settings</h1>
            <p className="mt-2 max-w-xl text-base text-brand-100/90">
              Customize your hospital profile, branding, and user accounts in one place.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
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

          <div className="rounded-[1.75rem] border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur-md lg:min-w-[280px]">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-100/80">
              Live preview
            </p>
            <div className="mt-4 flex items-center gap-3">
              <AppLogo size="md" variant="light" showPulse={false} />
              <div className="min-w-0">
                <p className="truncate text-lg font-bold">{preview.name || data.hospitalName}</p>
                <p className="truncate text-sm text-brand-100/75">
                  {preview.tagline || data.tagline || 'Hospital Management System'}
                </p>
              </div>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-brand-100/60">
              This name appears on login, sidebar, dashboard, and the browser tab.
            </p>
          </div>
        </div>
      </div>

      {!isAdmin && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800">
            View only. Contact an administrator to change settings.
          </p>
        </div>
      )}

      <div className={`grid gap-8 ${isAdmin ? 'lg:grid-cols-2' : 'max-w-2xl'}`}>
        <div className="card-panel overflow-hidden shadow-card-hover">
          <div className="border-b border-slate-100 bg-gradient-to-r from-brand-50 via-white to-teal-50 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700 ring-1 ring-brand-200/60">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Hospital profile</h2>
                <p className="text-sm text-slate-500">Update branding and contact information</p>
              </div>
            </div>
          </div>

          <form
            className="space-y-8 p-6"
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
            {formSections.map((section) => (
              <section key={section.title} className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{section.title}</h3>
                  <p className="text-xs text-slate-500">{section.subtitle}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {section.fields.map((name) => {
                    const meta = fieldMeta[name];
                    const Icon = meta.icon;
                    const fullWidth = name === 'address' || name === 'tagline';
                    return (
                      <label
                        key={name}
                        className={`group block ${fullWidth ? 'sm:col-span-2' : ''}`}
                      >
                        <span className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600 transition group-focus-within:bg-brand-100">
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          {meta.label}
                          {'required' in meta && meta.required && (
                            <span className="text-red-500"> *</span>
                          )}
                        </span>
                        <input
                          name={name}
                          defaultValue={(data[name as keyof typeof data] as string) ?? ''}
                          disabled={!isAdmin}
                          onChange={(e) => {
                            setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
                            if (name === 'hospitalName') {
                              setPreview((prev) => ({ ...prev, name: e.target.value }));
                            }
                            if (name === 'tagline') {
                              setPreview((prev) => ({ ...prev, tagline: e.target.value }));
                            }
                          }}
                          className={`${fieldInputClass(!!mergedErrors[name])} disabled:bg-slate-50 disabled:text-slate-500`}
                        />
                        {mergedErrors[name] && (
                          <p className="mt-1 text-xs font-medium text-red-600">
                            {mergedErrors[name]}
                          </p>
                        )}
                      </label>
                    );
                  })}
                </div>
              </section>
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
                className="btn-primary w-full bg-gradient-to-r from-brand-600 to-brand-700 shadow-md sm:w-auto"
              >
                {update.isPending ? 'Saving…' : 'Save settings'}
              </button>
            )}
          </form>
        </div>

        {isAdmin && <UserAccountsSection />}
      </div>
    </div>
  );
}
