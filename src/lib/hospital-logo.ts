/** Full LifeCare Hospital logo (icon + LifeCare + Hospital text) — prescription header only. */
export const HOSPITAL_LOGO_BRAND = '/hospital-logo-brand.png';

/** Heart icon only — watermark & favicon. */
export const HOSPITAL_LOGO_ICON = '/hospital-logo-icon.png';

/** @deprecated Use HOSPITAL_LOGO_BRAND */
export const DEFAULT_HOSPITAL_LOGO = HOSPITAL_LOGO_BRAND;

const LEGACY_LOGO_PATHS = new Set([
  '/hospital-logo.svg',
  '/hospital-logo-icon.svg',
  '/hospital-logo.png',
]);

type LogoSource = { logoUrl?: string | null } | null | undefined;

function normalizeLogoPath(path: string | null | undefined): string {
  const trimmed = path?.trim();
  if (!trimmed || LEGACY_LOGO_PATHS.has(trimmed)) return HOSPITAL_LOGO_BRAND;
  return trimmed;
}

/** Logo for prescription / bill header (full brand artwork). */
export function prescriptionHeaderLogo(...sources: LogoSource[]): string {
  for (const source of sources) {
    if (source?.logoUrl?.trim()) return normalizeLogoPath(source.logoUrl);
  }
  return HOSPITAL_LOGO_BRAND;
}

/** Faint center watermark on pads. */
export function prescriptionWatermarkLogo(): string {
  return HOSPITAL_LOGO_ICON;
}

/** @deprecated Use prescriptionHeaderLogo */
export function hospitalLogoUrl(...sources: LogoSource[]): string {
  return prescriptionHeaderLogo(...sources);
}

export function resolvePublicUrl(path: string): string {
  if (/^https?:\/\//i.test(path) || path.startsWith('data:')) return path;
  if (typeof window === 'undefined') return path;
  const basePath = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  const rel = path.startsWith('/') ? path : `/${path}`;
  const assetPath =
    basePath && basePath !== '/' && !rel.startsWith(basePath) ? `${basePath}${rel}` : rel;
  return `${window.location.origin}${assetPath}`;
}
