export type PageId =
  | 'dashboard'
  | 'patients'
  | 'doctors'
  | 'appointments'
  | 'departments'
  | 'pharmacy'
  | 'settings';

export const PAGE_PATHS: Record<PageId, string> = {
  dashboard: '/dashboard',
  patients: '/patients',
  doctors: '/doctors',
  appointments: '/appointments',
  departments: '/departments',
  pharmacy: '/pharmacy',
  settings: '/settings',
};

const PATH_TO_PAGE = Object.fromEntries(
  Object.entries(PAGE_PATHS).map(([page, path]) => [path, page])
) as Record<string, PageId>;

export function pageToPath(page: PageId): string {
  return PAGE_PATHS[page];
}

export function pathToPage(pathname: string): PageId | null {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/' || path === '/dashboard') return 'dashboard';
  return PATH_TO_PAGE[path] ?? null;
}
