export const AUTH_STORAGE_KEY = 'health-care-auth';
export const LAST_ACTIVITY_KEY = 'health-care-last-activity';
export const AUTH_SESSION_EXPIRED_EVENT = 'health-care:session-expired';

export function clearAuthStorage() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(LAST_ACTIVITY_KEY);
}

export function notifySessionExpired() {
  window.dispatchEvent(new CustomEvent(AUTH_SESSION_EXPIRED_EVENT));
}
