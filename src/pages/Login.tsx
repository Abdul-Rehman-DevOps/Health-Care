import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, ShieldCheck, User } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useHospitalBranding } from '../context/HospitalBrandingContext';
import AppLogo from '../components/AppLogo';

function useLockScreenClock() {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    function tick() {
      const now = new Date();
      setTime(
        new Intl.DateTimeFormat('en-PK', {
          timeZone: 'Asia/Karachi',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }).format(now)
      );
      setDate(
        new Intl.DateTimeFormat('en-PK', {
          timeZone: 'Asia/Karachi',
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        }).format(now)
      );
    }

    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  return { time, date };
}

export default function Login() {
  const { login, logout } = useAuth();
  const { hospitalName, tagline } = useHospitalBranding();
  const navigate = useNavigate();
  const { time, date } = useLockScreenClock();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = hospitalName;
  }, [hospitalName]);

  useEffect(() => {
    logout();
  }, [logout]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.auth.login(username.trim(), password);
      login(
        {
          id: res.user.id,
          username: res.user.username,
          displayName: res.user.displayName,
          role: res.user.role as 'admin' | 'user',
        },
        res.token
      );
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-brand-950 to-teal-950 p-4">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-teal-400/15 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,0.45)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100%_4rem] opacity-20" />
      </div>

      <div className="relative z-10 w-full max-w-md animate-slide-up">
        <div className="mb-8 text-center text-white">
          <p className="text-5xl font-light tracking-tight tabular-nums">{time || '—:—'}</p>
          <p className="mt-2 text-sm font-medium text-white/60">{date}</p>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 p-8 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <div className="mb-6 flex flex-col items-center text-center">
            <AppLogo size="lg" variant="light" />
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">{hospitalName}</h1>
            <p className="mt-1 text-sm text-white/65">
              {tagline || 'Hospital Management System'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm font-medium text-white/85">
              Username
              <div className="relative mt-1.5">
                <User
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700"
                  aria-hidden
                />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-white/95 px-3.5 py-2.5 pl-10 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25"
                  placeholder="Enter username"
                  autoComplete="username"
                  required
                />
              </div>
            </label>

            <label className="block text-sm font-medium text-white/85">
              Password
              <div className="relative mt-1.5">
                <Lock
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700"
                  aria-hidden
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-white/95 py-2.5 pl-10 pr-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25"
                  placeholder="Enter password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-brand-700"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </label>

            {error && (
              <p className="rounded-xl border border-red-300/40 bg-red-500/15 px-3 py-2 text-sm font-medium text-red-100">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-teal-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-950/30 transition hover:from-brand-400 hover:to-teal-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ShieldCheck className="h-4 w-4" />
              {loading ? 'Unlocking…' : 'Unlock'}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs font-medium tracking-wide text-white/35">
          Authorized staff only
        </p>
      </div>
    </div>
  );
}
