import { useState } from 'react';
import { HeartPulse, Lock, Sparkles, User } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-slate-900 p-4">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 animate-float rounded-full bg-brand-500/25 blur-3xl" />
      <div
        className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 animate-float rounded-full bg-teal-400/20 blur-3xl"
        style={{ animationDelay: '1.5s' }}
      />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-600/10 blur-3xl" />

      <div className="relative w-full max-w-md animate-slide-up">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 animate-pulse-soft items-center justify-center rounded-2xl bg-white/10 shadow-2xl ring-1 ring-white/20 backdrop-blur">
            <HeartPulse className="h-9 w-9 text-brand-300" />
          </div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-200 ring-1 ring-white/15">
            <Sparkles className="h-3 w-3" />
            Secure portal
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Health Care</h1>
          <p className="mt-2 text-sm text-brand-200/80">Hospital Management System</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="animate-scale-in overflow-hidden rounded-3xl border border-white/10 bg-white/95 p-8 shadow-2xl backdrop-blur-xl"
        >
          <div className="mb-6 h-1 w-full bg-gradient-to-r from-brand-400 via-teal-400 to-brand-600" />
          <h2 className="text-xl font-bold text-slate-900">Sign in</h2>
          <p className="mt-1 text-sm text-slate-500">Authorized staff only</p>

          <div className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Username
              <div className="relative mt-1.5">
                <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-500/70" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input pl-10"
                  placeholder="Enter username"
                  autoComplete="username"
                  required
                />
              </div>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Password
              <div className="relative mt-1.5">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-500/70" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10"
                  placeholder="Enter password"
                  autoComplete="current-password"
                  required
                />
              </div>
            </label>
          </div>

          {error && (
            <p className="mt-4 animate-scale-in rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-white px-3 py-2 text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary mt-6 w-full bg-gradient-to-r from-brand-600 via-brand-600 to-teal-600 py-3 text-base hover:shadow-glow-lg"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
