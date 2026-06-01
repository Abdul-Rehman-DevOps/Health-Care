import { useQuery } from '@tanstack/react-query';
import { api, type VisitDetail } from '../lib/api';
import { useHospitalBranding } from '../context/HospitalBrandingContext';
import { displayPakPhone } from '../lib/pakistan-inputs';
import { EMPTY_DISPLAY } from '../lib/display';

type Props = {
  visit: VisitDetail;
  mode: 'prescription' | 'bill' | 'both';
};

function formatDate(d: string, short = false) {
  if (short) {
    return new Intl.DateTimeFormat('en-PK', {
      timeZone: 'Asia/Karachi',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(d));
  }
  return new Intl.DateTimeFormat('en-PK', {
    timeZone: 'Asia/Karachi',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(d));
}

function money(n: number, currency: string) {
  return `${currency} ${n.toLocaleString('en-PK')}`;
}

export default function VisitPrint({ visit, mode }: Props) {
  const { hospitalName: brandName, tagline: brandTagline } = useHospitalBranding();
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: api.settings.get,
    staleTime: 60_000,
  });

  const hospital = settings?.hospitalName ?? brandName ?? 'Health Care';
  const tagline = settings?.tagline ?? brandTagline ?? '';
  const address = [settings?.address, settings?.city].filter(Boolean).join(', ');
  const phone = settings?.contact ?? '';
  const currency = settings?.currency ?? 'PKR';
  const initial = hospital.trim().charAt(0).toUpperCase() || 'H';

  const vitals = [
    visit.weightKg != null && { label: 'Weight', value: `${visit.weightKg} kg` },
    visit.bloodPressure && { label: 'BP', value: visit.bloodPressure },
    visit.temperature != null && { label: 'Temp', value: `${visit.temperature} F` },
    visit.bloodSugar != null && { label: 'BS', value: String(visit.bloodSugar) },
    visit.pulse != null && { label: 'Pulse', value: String(visit.pulse) },
    visit.spo2 != null && { label: 'SpO2', value: `${visit.spo2}%` },
  ].filter(Boolean) as { label: string; value: string }[];

  const medicines = visit.lines.filter((l) => l.lineType === 'drug' || l.lineType === 'custom');
  const labs = visit.lines.filter((l) => l.lineType === 'lab');

  const showRx = mode === 'prescription' || mode === 'both';
  const showBill = mode === 'bill' || mode === 'both';
  const itemCount = medicines.length + labs.length;
  const compact = itemCount > 8;

  return (
    <div className={`hc-print-document${compact ? ' hc-print-document--compact' : ''}`}>
      {showRx && (
        <section
          className={`hc-print-page hc-print-page--rx${showBill ? ' hc-print-page--with-next' : ''}${compact ? ' hc-print-page--compact' : ''}`}
        >
          <div className="hc-print-top-bar" />
          <header className="hc-print-header">
            <div className="hc-print-logo-row">
              <div className="hc-print-logo-badge">{initial}</div>
              <div className="hc-print-header-text">
                <h1 className="hc-print-hospital">{hospital}</h1>
                {tagline && <p className="hc-print-tagline">{tagline}</p>}
              </div>
              <div className="hc-print-rx-symbol" aria-hidden>
                Rx
              </div>
            </div>
            {(address || phone) && (
              <p className="hc-print-meta">
                {[address, phone && `Tel: ${phone}`].filter(Boolean).join('  |  ')}
              </p>
            )}
            {visit.doctor && (
              <div className="hc-print-doctor-box">
                <span className="hc-print-doctor-label">Consultant</span>
                <span className="hc-print-doctor-name">
                  Dr. {visit.doctor.name}
                  {visit.doctor.specialization ? `, ${visit.doctor.specialization}` : ''}
                </span>
                {visit.doctor.qualification && (
                  <span className="hc-print-doctor-qual">{visit.doctor.qualification}</span>
                )}
              </div>
            )}
          </header>

          <div className="hc-print-page-body">
          <div className="hc-print-patient-card">
            <div className="hc-print-patient-col">
              <div className="hc-print-field">
                <span className="hc-print-field-label">Patient</span>
                <span className="hc-print-field-value">{visit.patient.name}</span>
              </div>
              <div className="hc-print-field">
                <span className="hc-print-field-label">Patient ID</span>
                <span className="hc-print-field-value">{visit.patient.patientId}</span>
              </div>
              <div className="hc-print-field">
                <span className="hc-print-field-label">Age / Gender</span>
                <span className="hc-print-field-value">
                  {visit.patient.age ? `${visit.patient.age} yrs` : EMPTY_DISPLAY},{' '}
                  {visit.patient.gender ?? EMPTY_DISPLAY}
                </span>
              </div>
            </div>
            <div className="hc-print-patient-col hc-print-align-right">
              <div className="hc-print-field">
                <span className="hc-print-field-label">Visit no.</span>
                <span className="hc-print-field-value">{visit.visitNumber}</span>
              </div>
              <div className="hc-print-field">
                <span className="hc-print-field-label">Date & time</span>
                <span className="hc-print-field-value hc-print-date">
                  {formatDate(visit.visitDate, true)}
                </span>
              </div>
              <div className="hc-print-field">
                <span className="hc-print-field-label">Contact</span>
                <span className="hc-print-field-value">
                  {visit.patient.contact ? displayPakPhone(visit.patient.contact) : EMPTY_DISPLAY}
                </span>
              </div>
            </div>
          </div>

          {vitals.length > 0 && (
            <div className="hc-print-vitals-grid">
              {vitals.map((v) => (
                <div key={v.label} className="hc-print-vital-chip">
                  <span className="hc-print-vital-label">{v.label}</span>
                  <span className="hc-print-vital-value">{v.value}</span>
                </div>
              ))}
            </div>
          )}

          {visit.diagnosis && (
            <div className="hc-print-diagnosis">
              <span className="hc-print-diagnosis-label">Diagnosis</span>
              <p>{visit.diagnosis}</p>
            </div>
          )}

          {medicines.length > 0 && (
            <div className="hc-print-block">
              <p className="hc-print-section-title">
                <span className="hc-print-section-icon">Rx</span> Medicines prescribed
              </p>
              <table className="hc-print-table">
                <thead>
                  <tr>
                    <th className="hc-print-th-num">#</th>
                    <th>Medicine</th>
                    <th>Dosage / instructions</th>
                    <th className="hc-print-align-right">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {medicines.map((l, i) => (
                    <tr key={l.id}>
                      <td className="hc-print-td-num">{i + 1}</td>
                      <td className="hc-print-bold">{l.name}</td>
                      <td>{l.dosage ?? 'As directed'}</td>
                      <td className="hc-print-align-right">{l.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {labs.length > 0 && (
            <div className="hc-print-block">
              <p className="hc-print-section-title">Laboratory tests advised</p>
              <ul className="hc-print-lab-list">
                {labs.map((l, i) => (
                  <li key={l.id}>
                    <span className="hc-print-lab-num">{i + 1}.</span> {l.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {visit.advice && (
            <div className="hc-print-advice">
              <span className="hc-print-advice-label">General advice</span>
              <p>{visit.advice}</p>
            </div>
          )}
          </div>

          <footer className="hc-print-footer">
            <div className="hc-print-signature">
              <div className="hc-print-signature-line" />
              <p>Doctor&apos;s signature & stamp</p>
            </div>
            <p className="hc-print-footer-note">
              This is a computer-generated prescription from {hospital}.
            </p>
          </footer>
        </section>
      )}

      {showBill && visit.bill && (
        <section className="hc-print-page hc-print-page--bill">
          <div className="hc-print-top-bar hc-print-top-bar-bill" />
          <header className="hc-print-header hc-print-header-bill">
            <h1 className="hc-print-hospital">{hospital}</h1>
            <p className="hc-print-bill-label">Official patient bill / receipt</p>
            <p className="hc-print-meta">
              Bill no. <strong>{visit.bill.billNumber}</strong>  |  Visit{' '}
              <strong>{visit.visitNumber}</strong>
            </p>
          </header>

          <div className="hc-print-page-body">
          <div className="hc-print-patient-card hc-print-patient-card-compact">
            <p>
              <strong>Patient:</strong> {visit.patient.name} ({visit.patient.patientId})
            </p>
            <p>
              <strong>Date:</strong> {formatDate(visit.visitDate, true)}
            </p>
          </div>

          <table className="hc-print-table hc-print-bill-table">
            <thead>
              <tr>
                <th>Description</th>
                <th className="hc-print-align-right">Qty</th>
                <th className="hc-print-align-right">Rate</th>
                <th className="hc-print-align-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {visit.consultationFee > 0 && (
                <tr>
                  <td>Consultation fee</td>
                  <td className="hc-print-align-right">1</td>
                  <td className="hc-print-align-right">
                    {money(visit.consultationFee, currency)}
                  </td>
                  <td className="hc-print-align-right">
                    {money(visit.consultationFee, currency)}
                  </td>
                </tr>
              )}
              {visit.lines.map((l) => (
                <tr key={l.id}>
                  <td>{l.name}</td>
                  <td className="hc-print-align-right">{l.quantity}</td>
                  <td className="hc-print-align-right">{money(l.unitPrice, currency)}</td>
                  <td className="hc-print-align-right">{money(l.amount, currency)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="hc-print-subtotal-row">
                <td colSpan={3} className="hc-print-align-right">
                  Subtotal
                </td>
                <td className="hc-print-align-right">{money(visit.bill.subtotal, currency)}</td>
              </tr>
              {visit.bill.discount > 0 && (
                <tr>
                  <td colSpan={3} className="hc-print-align-right">
                    Discount
                  </td>
                  <td className="hc-print-align-right">
                    -{money(visit.bill.discount, currency)}
                  </td>
                </tr>
              )}
              <tr className="hc-print-total-row">
                <td colSpan={3} className="hc-print-align-right">
                  Total payable
                </td>
                <td className="hc-print-align-right">{money(visit.bill.total, currency)}</td>
              </tr>
            </tfoot>
          </table>

          <div className={`hc-print-paid-badge ${visit.bill.isPaid ? 'is-paid' : 'is-unpaid'}`}>
            {visit.bill.isPaid ? 'PAID' : 'PAYMENT DUE'}
          </div>
          </div>

          <p className="hc-print-bill-footer">Thank you for choosing {hospital}.</p>
        </section>
      )}
    </div>
  );
}
