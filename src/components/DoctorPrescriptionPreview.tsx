import type { Doctor, PrescriptionTemplate } from '../lib/api';
import { displayPakPhone } from '../lib/pakistan-inputs';

const PAD_LABELS: Record<PrescriptionTemplate, string> = {
  full: 'Full clinical pad (neurology / medicine)',
  standard: 'Standard pad (vitals + history column)',
  minimal: 'Minimal pad (gynecology style)',
  banner: 'Hospital banner pad (center title)',
  pediatric: 'Pediatrics pad (feed, vaccination, RR)',
};

type Props = {
  doctor: Doctor;
};

export default function DoctorPrescriptionPreview({ doctor }: Props) {
  const quals: string[] = [];
  if (doctor.qualification?.trim()) quals.push(doctor.qualification.trim());
  if (doctor.qualificationsExtra?.trim()) {
    doctor.qualificationsExtra
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((line) => quals.push(line));
  }

  const template = doctor.prescriptionTemplate ?? 'full';

  return (
    <div className="rounded-xl border border-brand-200 bg-gradient-to-br from-brand-50/90 to-white p-4 ring-1 ring-brand-100">
      <p className="text-[10px] font-bold uppercase tracking-wider text-brand-600">
        Prescription header (this visit)
      </p>
      <p className="mt-2 text-base font-bold text-slate-900">{doctor.name}</p>
      {doctor.specialization && (
        <p className="mt-0.5 text-sm font-semibold text-slate-800">{doctor.specialization}</p>
      )}
      {quals.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-sm text-slate-600">
          {quals.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ul>
      )}
      {(doctor.contact || doctor.email) && (
        <p className="mt-2 text-sm text-slate-600">
          {doctor.contact && (
            <span className="font-mono">{displayPakPhone(doctor.contact)}</span>
          )}
          {doctor.contact && doctor.email && ' · '}
          {doctor.email}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2 border-t border-brand-100 pt-3 text-xs">
        <span className="rounded-full bg-brand-100 px-2.5 py-1 font-semibold text-brand-800">
          {PAD_LABELS[template] ?? template}
        </span>
        {doctor.department && (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
            {doctor.department.name}
          </span>
        )}
        <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
          Fee: PKR {Number(doctor.fee).toLocaleString('en-PK')}
        </span>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Printed prescription uses this doctor&apos;s own pad layout and qualifications.
      </p>
    </div>
  );
}
