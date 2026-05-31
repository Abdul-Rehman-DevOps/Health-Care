import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

type Toast = { id: number; message: string; type: 'success' | 'error' };

const ToastContext = createContext<{
  toast: (message: string, type?: 'success' | 'error') => void;
} | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setItems((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className={`animate-slide-up pointer-events-auto flex items-center gap-2.5 rounded-xl px-4 py-3.5 text-sm font-semibold shadow-xl backdrop-blur-sm ring-1 ${
              t.type === 'success'
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white ring-emerald-500/30'
                : 'bg-gradient-to-r from-red-600 to-red-700 text-white ring-red-500/30'
            }`}
          >
            {t.type === 'success' ? (
              <CheckCircle className="h-4 w-4 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 shrink-0" />
            )}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
