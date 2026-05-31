export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

/** Block typing letters/symbols in numeric ID fields */
export function allowDigitKey(e: KeyboardEvent) {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const allowed = [
    'Backspace',
    'Delete',
    'Tab',
    'ArrowLeft',
    'ArrowRight',
    'Home',
    'End',
  ];
  if (allowed.includes(e.key)) return;
  if (!/^\d$/.test(e.key)) e.preventDefault();
}

export const CNIC_PLACEHOLDER = '12345-6789123-4';
export const PHONE_PLACEHOLDER = '+92 3XX-XXXXXXX';

/** CNIC: 12345-6789123-4 (13 digits, numbers only) */
export function formatCnicInput(raw: string): string {
  const d = digitsOnly(raw).slice(0, 13);
  if (d.length <= 5) return d;
  if (d.length <= 12) return `${d.slice(0, 5)}-${d.slice(5)}`;
  return `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}`;
}

export function validateCnic(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  const d = digitsOnly(value);
  if (d.length !== 13) {
    return `CNIC must be exactly 13 numbers only (e.g. ${CNIC_PLACEHOLDER})`;
  }
  return null;
}

function pakMobileDigits(raw: string): string {
  let d = digitsOnly(raw);
  if (d.startsWith('0092')) d = d.slice(4);
  else if (d.startsWith('92')) d = d.slice(2);
  else if (d.startsWith('0')) d = d.slice(1);
  return d.slice(0, 10);
}

/** Pakistani mobile: +92 3XX-XXXXXXX */
export function formatPakPhoneInput(raw: string): string {
  const d = pakMobileDigits(raw);
  if (d.length === 0) return '';
  if (d.length <= 3) return `+92 ${d}`;
  return `+92 ${d.slice(0, 3)}-${d.slice(3)}`;
}

export function validatePakPhone(
  value: string | undefined,
  label = 'Phone number'
): string | null {
  if (!value?.trim()) return null;
  const d = pakMobileDigits(value);
  if (d.length === 0) return null;
  if (!d.startsWith('3')) {
    return `${label} must start with +92 3 (Pakistani mobile)`;
  }
  if (d.length !== 10) {
    return `${label} must be 10 digits (e.g. ${PHONE_PLACEHOLDER})`;
  }
  return null;
}

/** True when input looks like a phone number rather than a plain name. */
export function looksLikePhoneInput(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  const d = digitsOnly(trimmed);
  return trimmed.startsWith('+') || trimmed.startsWith('0') || d.length >= 7;
}

export function validateOptionalPhoneOrName(
  value: string | undefined,
  label = 'Emergency contact'
): string | null {
  if (!value?.trim()) return null;
  if (!looksLikePhoneInput(value)) return null;
  return validatePakPhone(value, label);
}

export function displayCnic(value: string | null | undefined): string {
  if (!value) return '—';
  const formatted = formatCnicInput(value);
  return formatted || '—';
}

export function displayPakPhone(value: string | null | undefined): string {
  if (!value) return '—';
  const formatted = formatPakPhoneInput(value);
  return formatted || '—';
}
