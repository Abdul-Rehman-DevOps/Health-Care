import { z } from 'zod';

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

export function pakMobileDigits(raw: string): string {
  let d = digitsOnly(raw);
  if (d.startsWith('0092')) d = d.slice(4);
  else if (d.startsWith('92')) d = d.slice(2);
  else if (d.startsWith('0')) d = d.slice(1);
  return d;
}

export function formatPhoneStored(raw: string): string {
  const d = pakMobileDigits(raw).slice(0, 10);
  if (d.length !== 10) return raw.trim();
  return `+92 ${d.slice(0, 3)}-${d.slice(3)}`;
}

export function formatCnicStored(raw: string): string {
  const d = digitsOnly(raw).slice(0, 13);
  if (d.length !== 13) return raw.trim();
  return `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}`;
}

export function isValidCnic(value: string): boolean {
  return digitsOnly(value).length === 13;
}

export function isValidPakMobile(value: string): boolean {
  const d = pakMobileDigits(value);
  return d.length === 10 && d.startsWith('3');
}

/** True when the user is typing a phone number (not a plain name). */
export function looksLikePhoneInput(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  const d = digitsOnly(trimmed);
  return trimmed.startsWith('+') || trimmed.startsWith('0') || d.length >= 7;
}

export const requiredPakMobile = (label: string) =>
  z
    .string({ required_error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .refine((v) => isValidPakMobile(v), {
      message: `${label} must be a valid Pakistani mobile (+92 3XX-XXXXXXX)`,
    });

export const optionalPakMobile = (label: string) =>
  z
    .string()
    .optional()
    .refine((v) => !v?.trim() || isValidPakMobile(v), {
      message: `${label} must be a valid Pakistani mobile (+92 3XX-XXXXXXX)`,
    });

/** Name or Pakistani mobile — for emergency contact person. */
export const optionalPhoneOrName = (label: string) =>
  z
    .string()
    .optional()
    .refine(
      (v) => {
        if (!v?.trim()) return true;
        if (!looksLikePhoneInput(v)) return true;
        return isValidPakMobile(v);
      },
      {
        message: `${label} must be a valid Pakistani mobile (+92 3XX-XXXXXXX), or enter a name only`,
      }
    );

export function normalizePhoneField(contact?: string) {
  return contact?.trim() ? formatPhoneStored(contact) : contact;
}

export function normalizeEmergencyContactField(value?: string) {
  if (!value?.trim()) return value;
  if (looksLikePhoneInput(value)) return formatPhoneStored(value);
  return value.trim();
}
