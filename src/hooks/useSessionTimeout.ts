import { useEffect, useRef } from 'react';

export const SESSION_TIMEOUT_MS = 60 * 60 * 1000;
export const LAST_ACTIVITY_KEY = 'health-care-last-activity';

const CHECK_INTERVAL_MS = 30_000;
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll'] as const;

export function recordSessionActivity() {
  localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
}

export function clearSessionActivity() {
  localStorage.removeItem(LAST_ACTIVITY_KEY);
}

function isSessionExpired(): boolean {
  const raw = localStorage.getItem(LAST_ACTIVITY_KEY);
  if (!raw) return false;
  return Date.now() - Number(raw) >= SESSION_TIMEOUT_MS;
}

export function useSessionTimeout(active: boolean, onTimeout: () => void) {
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  useEffect(() => {
    if (!active) return;

    recordSessionActivity();

    if (isSessionExpired()) {
      clearSessionActivity();
      onTimeoutRef.current();
      return;
    }

    let debounceId: number;
    const onActivity = () => {
      window.clearTimeout(debounceId);
      debounceId = window.setTimeout(recordSessionActivity, 500);
    };

    const check = () => {
      if (isSessionExpired()) {
        clearSessionActivity();
        onTimeoutRef.current();
      }
    };

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, onActivity, { passive: true });
    }
    document.addEventListener('visibilitychange', check);
    const intervalId = window.setInterval(check, CHECK_INTERVAL_MS);

    return () => {
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, onActivity);
      }
      document.removeEventListener('visibilitychange', check);
      window.clearInterval(intervalId);
      window.clearTimeout(debounceId);
    };
  }, [active]);
}
