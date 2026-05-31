import { useCallback, useState } from 'react';

type Pending = {
  title: string;
  message?: string;
  onConfirm: () => Promise<void> | void;
};

export function useConfirmDelete() {
  const [pending, setPending] = useState<Pending | null>(null);
  const [loading, setLoading] = useState(false);

  const ask = useCallback((opts: Pending) => setPending(opts), []);
  const cancel = useCallback(() => {
    if (!loading) setPending(null);
  }, [loading]);

  const confirm = useCallback(async () => {
    if (!pending) return;
    setLoading(true);
    try {
      await pending.onConfirm();
      setPending(null);
    } finally {
      setLoading(false);
    }
  }, [pending]);

  return { pending, loading, ask, cancel, confirm };
}
