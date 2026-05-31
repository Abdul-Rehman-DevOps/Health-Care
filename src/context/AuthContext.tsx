import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { clearSessionActivity, recordSessionActivity } from '../hooks/useSessionTimeout';

export type UserRole = 'admin' | 'user';

export type AuthUser = {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isAdmin: boolean;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
};

const STORAGE_KEY = 'health-care-auth';

const AuthContext = createContext<AuthContextValue | null>(null);

function loadStored(): { user: AuthUser; token: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { user: AuthUser; token: string };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const stored = loadStored();
  const [user, setUser] = useState<AuthUser | null>(stored?.user ?? null);
  const [token, setToken] = useState<string | null>(stored?.token ?? null);

  const login = useCallback((u: AuthUser, t: string) => {
    setUser(u);
    setToken(t);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: u, token: t }));
    recordSessionActivity();
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
    clearSessionActivity();
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isAdmin: user?.role === 'admin',
      login,
      logout,
    }),
    [user, token, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
