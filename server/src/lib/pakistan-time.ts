/** Pakistan (Asia/Karachi) helpers for visits, appointments, and filters. */

export const PAKISTAN_TIMEZONE = 'Asia/Karachi';

type PakistanClock = {
  date: string;
  hour: number;
  minute: number;
};

function readPakistanClock(at: Date): PakistanClock {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: PAKISTAN_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(at);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';

  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    hour: Number(get('hour')),
    minute: Number(get('minute')),
  };
}

export function getPakistanNow(at = new Date()): PakistanClock {
  return readPakistanClock(at);
}

export function getPakistanDateString(at = new Date()): string {
  return getPakistanNow(at).date;
}

/** Parse YYYY-MM-DD as start of that day in PKT (for DB date fields). */
export function parseAppointmentDate(dateStr: string): Date {
  return new Date(`${dateStr.trim()}T00:00:00+05:00`);
}

/** Format a stored date as YYYY-MM-DD in PKT. */
export function formatAppointmentDate(d: Date): string {
  return readPakistanClock(d).date;
}

export function normalizeAppointmentTime(time: string): string {
  const [hourRaw, minuteRaw = '0'] = time.trim().split(':');
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return time.trim();
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function isPastAppointment(
  dateStr: string,
  timeStr?: string | null,
  at = new Date()
): boolean {
  const now = getPakistanNow(at);
  if (dateStr < now.date) return true;
  if (dateStr > now.date) return false;
  if (!timeStr?.trim()) return false;

  const [hour, minute] = normalizeAppointmentTime(timeStr).split(':').map(Number);
  const appointmentMinutes = hour * 60 + minute;
  const nowMinutes = now.hour * 60 + now.minute;
  return appointmentMinutes < nowMinutes;
}

/** Inclusive start and exclusive end of a calendar day in PKT (YYYY-MM-DD). */
export function pakistanDayRange(dateStr: string): { gte: Date; lt: Date } {
  const gte = parseAppointmentDate(dateStr);
  const lt = new Date(gte.getTime() + 24 * 60 * 60 * 1000);
  return { gte, lt };
}

export function pakistanDayStart(dateStr: string): Date {
  return parseAppointmentDate(dateStr);
}

export function pakistanDayEndExclusive(dateStr: string): Date {
  return pakistanDayRange(dateStr).lt;
}
