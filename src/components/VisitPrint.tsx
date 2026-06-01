import type { PrescriptionTemplate, VisitDetail } from '../lib/api';
import LifeCareBill from './LifeCareBill';
import LifeCarePrescription from './LifeCarePrescription';

type Props = {
  visit: VisitDetail;
  mode: 'prescription' | 'bill' | 'both';
};

export default function VisitPrint({ visit, mode }: Props) {
  const showRx = mode === 'prescription' || mode === 'both';
  const showBill = mode === 'bill' || mode === 'both';

  const visitForPad: VisitDetail = visit.doctor
    ? visit
    : {
        ...visit,
        doctor: {
          id: '',
          name: 'Consultant',
          qualification: null,
          qualificationsExtra: null,
          specialization: null,
          prescriptionTemplate: 'full' as PrescriptionTemplate,
          contact: null,
          email: null,
          fee: 0,
        },
      };

  return (
    <div className="hc-print-document">
      {showRx && (
        <section
          className={`hc-print-page hc-print-page--rx lc-print-page${showBill ? ' hc-print-page--with-next' : ''}`}
        >
          <LifeCarePrescription mode="filled" visit={visitForPad} />
        </section>
      )}

      {showBill && (
        <section className="hc-print-page hc-print-page--bill lc-print-page">
          {visit.bill ? (
            <LifeCareBill mode="filled" visit={visit} />
          ) : (
            <p className="p-4 text-sm">No bill on this visit.</p>
          )}
        </section>
      )}
    </div>
  );
}
