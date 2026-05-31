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

export const optionalPakMobile = (label: string) =>
  z
    .string()
    .optional()
    .refine((v) => !v?.trim() || isValidPakMobile(v), {
      message: `${label} must be a valid Pakistani mobile (+92 3XX-XXXXXXX)`,
    });

export function normalizePhoneField(contact?: string) {
  return contact?.trim() ? formatPhoneStored(contact) : contact;
}
