import { type VisitDetail } from '../lib/api';
import { useHospitalBranding } from '../context/HospitalBrandingContext';
import { displayPakPhone } from '../lib/pakistan-inputs';
import {
  prescriptionHeaderLogo,
  prescriptionWatermarkLogo,
  resolvePublicUrl,
} from '../lib/hospital-logo';

type Props = { mode: 'blank' } | { mode: 'filled'; visit: VisitDetail };

function formatDateShort(d: string) {
  return new Intl.DateTimeFormat('en-PK', {
    timeZone: 'Asia/Karachi',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(d));
}

function money(n: number, currency: string) {
  return `${currency} ${n.toLocaleString('en-PK')}`;
}

const BLANK_ROWS = 8;

export default function LifeCareBill(props: Props) {
  const blank = props.mode === 'blank';
  const visit = props.mode === 'filled' ? props.visit : null;

  const branding = useHospitalBranding();

  const hospital = branding.hospitalName ?? 'LifeCare Hospital';
  const headerLogoSrc = resolvePublicUrl(prescriptionHeaderLogo(branding));
  const watermarkSrc = resolvePublicUrl(prescriptionWatermarkLogo());
  const address = [branding.address, branding.city].filter(Boolean).join(', ');
  const phone = branding.contact ?? '';
  const email = branding.email ?? '';
  const currency = 'PKR';

  const lineRows =
    !blank && visit
      ? [
          ...(visit.consultationFee > 0
            ? [
                {
                  key: 'fee',
                  name: 'Consultation fee',
                  qty: 1,
                  rate: visit.consultationFee,
                  amount: visit.consultationFee,
                },
              ]
            : []),
          ...visit.lines.map((l) => ({
            key: l.id,
            name: l.name,
            qty: l.quantity,
            rate: l.unitPrice,
            amount: l.amount,
          })),
        ]
      : [];

  const emptyRowCount = blank
    ? BLANK_ROWS
    : Math.max(0, BLANK_ROWS - lineRows.length);

  return (
    <article className="lc-print-sheet lc-pad lc-pad--bill">
      <div className="lc-print-sheet__watermark" aria-hidden>
        <img src={watermarkSrc} alt="" />
      </div>

      <header className="lc-pad-header lc-pad-header--bill">
        <div className="lc-pad-logo-block">
          <img
            src={headerLogoSrc}
            alt={hospital}
            className="lc-pad-logo-img lc-pad-logo-img--brand"
          />
        </div>
        <div className="lc-pad-bill-title-block">
          <p className="lc-pad-bill-heading">Official patient bill / receipt</p>
          {!blank && visit?.bill ? (
            <p className="lc-pad-bill-meta">
              Bill no. <strong>{visit.bill.billNumber}</strong>
              {'  |  '}
              Visit <strong>{visit.visitNumber}</strong>
            </p>
          ) : (
            <p className="lc-pad-bill-meta">
              Bill no. <span className="lc-pad-blank-line" />
              {'  |  '}
              Visit <span className="lc-pad-blank-line lc-pad-blank-line--short" />
            </p>
          )}
        </div>
      </header>

      <div className="lc-pad-row lc-pad-row--bill">
        <span className="lc-pad-field">
          <span className="lc-pad-field-label">Patient:</span>
          <span className={`lc-pad-field-value${blank ? ' is-blank' : ''}`}>
            {blank
              ? '\u00a0'
              : `${visit!.patient.name} (${visit!.patient.patientId})`}
          </span>
        </span>
        <span className="lc-pad-field">
          <span className="lc-pad-field-label">Date:</span>
          <span className={`lc-pad-field-value${blank ? ' is-blank' : ''}`}>
            {blank ? '\u00a0' : formatDateShort(visit!.visitDate)}
          </span>
        </span>
        {!blank && visit?.doctor && (
          <span className="lc-pad-field">
            <span className="lc-pad-field-label">Doctor:</span>
            <span className="lc-pad-field-value">{visit.doctor.name}</span>
          </span>
        )}
      </div>

      <table className="lc-pad-table lc-pad-bill-table">
        <thead>
          <tr>
            <th>Description</th>
            <th className="lc-pad-td-right">Qty</th>
            <th className="lc-pad-td-right">Rate</th>
            <th className="lc-pad-td-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {lineRows.map((row) => (
            <tr key={row.key}>
              <td>{row.name}</td>
              <td className="lc-pad-td-right">{row.qty}</td>
              <td className="lc-pad-td-right">{money(row.rate, currency)}</td>
              <td className="lc-pad-td-right">{money(row.amount, currency)}</td>
            </tr>
          ))}
          {Array.from({ length: emptyRowCount }, (_, i) => (
            <tr key={`empty-${i}`} className="lc-pad-bill-empty-row">
              <td>&nbsp;</td>
              <td className="lc-pad-td-right">&nbsp;</td>
              <td className="lc-pad-td-right">&nbsp;</td>
              <td className="lc-pad-td-right">&nbsp;</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          {blank ? (
            <>
              <tr>
                <td colSpan={3} className="lc-pad-td-right">
                  Subtotal
                </td>
                <td className="lc-pad-td-right">
                  <span className="lc-pad-blank-line lc-pad-blank-line--amount" />
                </td>
              </tr>
              <tr className="lc-pad-bill-total">
                <td colSpan={3} className="lc-pad-td-right">
                  Total payable
                </td>
                <td className="lc-pad-td-right">
                  <span className="lc-pad-blank-line lc-pad-blank-line--amount" />
                </td>
              </tr>
            </>
          ) : (
            visit?.bill && (
              <>
                <tr className="lc-pad-bill-subtotal">
                  <td colSpan={3} className="lc-pad-td-right">
                    Subtotal
                  </td>
                  <td className="lc-pad-td-right">{money(visit.bill.subtotal, currency)}</td>
                </tr>
                {visit.bill.discount > 0 && (
                  <tr>
                    <td colSpan={3} className="lc-pad-td-right">
                      Discount
                    </td>
                    <td className="lc-pad-td-right">
                      -{money(visit.bill.discount, currency)}
                    </td>
                  </tr>
                )}
                <tr className="lc-pad-bill-total">
                  <td colSpan={3} className="lc-pad-td-right">
                    Total payable
                  </td>
                  <td className="lc-pad-td-right">{money(visit.bill.total, currency)}</td>
                </tr>
              </>
            )
          )}
        </tfoot>
      </table>

      {!blank && visit?.bill && (
        <div
          className={`lc-pad-paid-badge ${visit.bill.isPaid ? 'is-paid' : 'is-unpaid'}`}
        >
          {visit.bill.isPaid ? 'PAID' : 'PAYMENT DUE'}
        </div>
      )}

      {blank && (
        <div className="lc-pad-paid-badge is-unpaid lc-pad-paid-badge--blank">
          PAID / UNPAID
        </div>
      )}

      <p className="lc-pad-bill-thanks">Thank you for choosing {hospital}.</p>

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
