import { type Doctor, type PrescriptionTemplate, type VisitDetail } from '../lib/api';
import { useHospitalBranding } from '../context/HospitalBrandingContext';
import { displayPakPhone } from '../lib/pakistan-inputs';
import { EMPTY_DISPLAY } from '../lib/display';
import {
  prescriptionHeaderLogo,
  prescriptionWatermarkLogo,
  resolvePublicUrl,
} from '../lib/hospital-logo';

export type PadDoctor = Pick<
  Doctor,
  | 'name'
  | 'specialization'
  | 'qualification'
  | 'qualificationsExtra'
  | 'prescriptionTemplate'
  | 'contact'
  | 'email'
>;

function doctorContactLines(doctor: PadDoctor, fallbackPhone: string, fallbackEmail: string) {
  const phone = doctor.contact?.trim() || fallbackPhone;
  const email = doctor.email?.trim() || fallbackEmail;
  return { phone, email };
}

type Props =
  | { mode: 'blank'; doctor: PadDoctor }
  | { mode: 'filled'; visit: VisitDetail };

function doctorDisplayName(name: string) {
  const n = name.trim();
  if (/^dr\.?\s/i.test(n)) return n.toUpperCase();
  return `Dr. ${n}`.toUpperCase();
}

function qualificationLines(doctor: PadDoctor): string[] {
  const lines: string[] = [];
  if (doctor.qualification?.trim()) lines.push(doctor.qualification.trim());
  if (doctor.qualificationsExtra?.trim()) {
    doctor.qualificationsExtra
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((l) => lines.push(l));
  }
  return lines;
}

function formatDateShort(d: string) {
  return new Intl.DateTimeFormat('en-PK', {
    timeZone: 'Asia/Karachi',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(d));
}

function Field({
  label,
  value,
  blank,
  wide,
}: {
  label: string;
  value?: string | null;
  blank: boolean;
  wide?: boolean;
}) {
  const show = !blank && value != null && value !== '';
  return (
    <span className="lc-pad-field">
      <span className="lc-pad-field-label">{label}</span>
      <span
        className={`lc-pad-field-value${show ? '' : ' is-blank'}`}
        style={wide ? { minWidth: '80pt' } : undefined}
      >
        {show ? value : '\u00a0'}
      </span>
    </span>
  );
}

function SidebarLabel({
  label,
  value,
  blank,
}: {
  label: string;
  value?: string | null;
  blank: boolean;
}) {
  const has = !blank && value?.trim();
  return (
    <p
      className={`lc-pad-sidebar-label${has ? ' has-value' : ''}`}
      data-value={has ? value : undefined}
    >
      {label}
    </p>
  );
}

function DoctorBlock({
  doctor,
  phone,
  email,
  showContact = true,
}: {
  doctor: PadDoctor;
  phone: string;
  email: string;
  showContact?: boolean;
}) {
  const quals = qualificationLines(doctor);
  const contacts = doctorContactLines(doctor, phone, email);

  return (
    <div className="lc-pad-doctor">
      <h2 className="lc-pad-doctor-name">{doctorDisplayName(doctor.name)}</h2>
      {doctor.specialization && (
        <p className="lc-pad-doctor-spec">{doctor.specialization}</p>
      )}
      {quals.length > 0 && (
        <div className="lc-pad-doctor-quals">
          {quals.map((q) => (
            <p key={q}>{q}</p>
          ))}
        </div>
      )}
      {showContact && (contacts.phone || contacts.email) && (
        <p className="lc-pad-doctor-contact">
          {contacts.phone && <span>☎ {displayPakPhone(contacts.phone)}</span>}
          {contacts.phone && contacts.email && '  |  '}
          {contacts.email && <span>✉ {contacts.email}</span>}
        </p>
      )}
    </div>
  );
}

export default function LifeCarePrescription(props: Props) {
  const blank = props.mode === 'blank';
  const doctor: PadDoctor | null =
    props.mode === 'blank' ? props.doctor : props.visit.doctor;
  const visit = props.mode === 'filled' ? props.visit : null;

  const branding = useHospitalBranding();

  const hospital = branding.hospitalName ?? 'LifeCare Hospital';
  const headerLogoSrc = resolvePublicUrl(prescriptionHeaderLogo(branding));
  const watermarkSrc = resolvePublicUrl(prescriptionWatermarkLogo());
  const address = [branding.address, branding.city].filter(Boolean).join(', ');
  const phone = branding.contact ?? '';
  const email = branding.email ?? '';

  const template: PrescriptionTemplate = doctor?.prescriptionTemplate ?? 'full';
  const isBanner = template === 'banner';
  const isStandard = template === 'standard';
  const isMinimal = template === 'minimal';
  const isPediatric = template === 'pediatric';
  const isFull = template === 'full';

  const medicines =
    visit?.lines.filter((l) => l.lineType === 'drug' || l.lineType === 'custom') ?? [];
  const labs = visit?.lines.filter((l) => l.lineType === 'lab') ?? [];

  const patient = visit?.patient;
  const visitDate = visit ? formatDateShort(visit.visitDate) : null;

  const showSidebar = isFull || isPediatric || isStandard;
  const showRow2 = isFull || isPediatric || isStandard;
  const showVitals = !isMinimal;
  const showRxBlock = !isMinimal;

  return (
    <article
      className={`lc-print-sheet lc-pad lc-pad--${template}`}
      data-template={template}
    >
      <div className="lc-print-sheet__watermark" aria-hidden>
        <img src={watermarkSrc} alt="" />
      </div>

      <header
        className={`lc-pad-header${isBanner ? ' lc-pad-header--banner' : ''}`}
      >
        {isBanner ? (
          <div className="lc-pad-banner-row">
            <div className="lc-pad-logo-block lc-pad-logo-block--brand">
              <img
                src={headerLogoSrc}
                alt={`${hospital} logo`}
                className="lc-pad-logo-img lc-pad-logo-img--brand"
              />
            </div>
            {doctor ? (
              <DoctorBlock
                doctor={doctor}
                phone={phone}
                email={email}
                showContact={false}
              />
            ) : null}
          </div>
        ) : (
          <>
            <div className="lc-pad-logo-block">
              <img
                src={headerLogoSrc}
                alt={`${hospital} logo`}
                className="lc-pad-logo-img lc-pad-logo-img--brand"
              />
            </div>
            {doctor ? (
              <DoctorBlock
                doctor={doctor}
                phone={phone}
                email={email}
                showContact={!isMinimal}
              />
            ) : null}
          </>
        )}
      </header>

      <div className="lc-print-sheet__meta">
        <div className="lc-pad-row lc-pad-row--patient">
          <Field label="Name:" value={patient?.name} blank={blank} wide />
          <Field
            label="Age:"
            value={patient?.age != null ? `${patient.age} yrs` : null}
            blank={blank}
          />
          <Field label="Gender:" value={patient?.gender} blank={blank} />
          <Field label="Date:" value={visitDate} blank={blank} wide />
        </div>

        {showRow2 && (
          <div className="lc-pad-row">
            <Field label="Address:" value={patient?.address} blank={blank} wide />
            <Field label="Occupation:" blank={blank} />
            {isPediatric ? (
              <>
                <Field label="Feed:" blank={blank} />
                <Field label="Vaccination:" blank={blank} />
                <Field label="Comorbid:" blank={blank} />
              </>
            ) : isFull ? (
              <>
                <Field label="Addiction:" blank={blank} />
                <Field label="Comorbid:" blank={blank} />
              </>
            ) : (
              <>
                <Field label="Vaccination:" blank={blank} />
                <Field label="Comorbid:" blank={blank} />
              </>
            )}
          </div>
        )}

        {showVitals && (
          <div className="lc-pad-row lc-pad-row--vitals">
            <Field label="BP:" value={visit?.bloodPressure} blank={blank} />
            <Field
              label="Temp:"
              value={visit?.temperature != null ? `${visit.temperature} F` : null}
              blank={blank}
            />
            <Field
              label="SPO2:"
              value={visit?.spo2 != null ? `${visit.spo2}%` : null}
              blank={blank}
            />
            <Field
              label="HR:"
              value={visit?.pulse != null ? String(visit.pulse) : null}
              blank={blank}
            />
            <Field
              label="Weight:"
              value={visit?.weightKg != null ? `${visit.weightKg} kg` : null}
              blank={blank}
            />
            <Field
              label="BSR:"
              value={visit?.bloodSugar != null ? String(visit.bloodSugar) : null}
              blank={blank}
            />
            {(isFull || isPediatric) && <Field label="RR:" blank={blank} />}
          </div>
        )}

        {isBanner && (
          <div className="lc-pad-row lc-pad-row--hx-banner">
            <span className="lc-pad-field-label">Hx:</span>
            <span className="lc-pad-hx-line" />
          </div>
        )}
      </div>

      {isMinimal ? (
        <div className="lc-pad-minimal-body">
          <div className="lc-pad-signature">
            Signature:<span className="lc-pad-signature-line" />
          </div>
        </div>
      ) : (
        <div className="lc-print-sheet__body">
          {showSidebar && (
            <aside className="lc-pad-sidebar">
              <SidebarLabel label="Presenting Complain:" blank={blank} />
              <SidebarLabel label="Examination Finding:" blank={blank} />
              <SidebarLabel label="Hx:" value={patient?.notes} blank={blank} />
              <SidebarLabel label="Allergies:" value={patient?.allergies} blank={blank} />
              {isPediatric ? (
                <SidebarLabel label="Prev Tx:" blank={blank} />
              ) : (
                <>
                  <SidebarLabel label="Addiction" blank={blank} />
                  <SidebarLabel label="Pregnancy:" blank={blank} />
                  <SidebarLabel label="Prev Tx:" blank={blank} />
                </>
              )}
            </aside>
          )}

          <div className="lc-pad-main">
            <div className="lc-pad-main-inner">
              {showRxBlock && (
                <>
                  <div className="lc-pad-diagnosis">
                    <span className="lc-pad-delta">Δ</span>
                    <span className="lc-pad-diagnosis-line">
                      {blank ? '\u00a0' : visit?.diagnosis ?? EMPTY_DISPLAY}
                    </span>
                  </div>

                  <div className="lc-pad-rx-head">Rx</div>

                  {!blank && medicines.length > 0 && (
                    <ul className="lc-pad-rx-list">
                      {medicines.map((m) => (
                        <li key={m.id}>
                          <strong>{m.name}</strong>
                          {m.dosage ? ` — ${m.dosage}` : ''}
                          {m.quantity > 1 ? ` (Qty: ${m.quantity})` : ''}
                        </li>
                      ))}
                    </ul>
                  )}

                  {blank && <div className="lc-pad-rx-blank" aria-hidden />}

                  {!blank && labs.length > 0 && (
                    <ul className="lc-pad-lab-list">
                      {labs.map((l, i) => (
                        <li key={l.id}>
                          {i + 1}. {l.name}
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="lc-pad-advice">
                    <strong>Advice:</strong>
                    {blank ? (
                      <p className="lc-pad-advice-blank">&nbsp;</p>
                    ) : (
                      <p>{visit?.advice?.trim() || '\u00a0'}</p>
                    )}
                  </div>
                </>
              )}

              <div className="lc-pad-signature">
                Signature:<span className="lc-pad-signature-line" />
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="lc-print-sheet__footer lc-pad-footer">
        {address && (
          <span className="lc-pad-footer-item">
            <span className="lc-pad-footer-icon">📍</span>
            {address}
          </span>
        )}
        {phone && (
          <span className="lc-pad-footer-item">
            <span className="lc-pad-footer-icon">☎</span>
            {displayPakPhone(phone)}
          </span>
        )}
        {email && (
          <span className="lc-pad-footer-item">
            <span className="lc-pad-footer-icon">✉</span>
            {email}
          </span>
        )}
      </footer>
    </article>
  );
}
