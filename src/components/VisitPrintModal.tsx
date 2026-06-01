import { FileText, Printer, Receipt } from 'lucide-react';
import type { PrintMode } from '../hooks/useVisitPrint';
import type { VisitDetail } from '../lib/api';
import Modal from './Modal';
import PrintSheet from './PrintSheet';
import VisitPrint from './VisitPrint';

type Props = {
  visit: VisitDetail | null;
  open: boolean;
  mode: PrintMode;
  onClose: () => void;
  onModeChange: (mode: PrintMode) => void;
  onPrint: () => void;
};

export default function VisitPrintModal({
  visit,
  open,
  mode,
  onClose,
  onModeChange,
  onPrint,
}: Props) {
  return (
    <>
      <Modal
        title={visit ? `Print, ${visit.visitNumber}` : 'Print'}
        open={open && !!visit}
        onClose={onClose}
      >
        {visit && (
          <div className="space-y-4">
            <p className="rounded-lg border border-brand-100 bg-brand-50/60 px-3 py-2 text-xs leading-relaxed text-slate-600">
              Paper size is set to <strong>A5</strong> automatically. In the print dialog, open{' '}
              <strong>More settings</strong> and turn off <strong>Headers and footers</strong> so the
              website URL does not appear at the bottom. The PDF file name is filled automatically
              from the patient name and visit number.
            </p>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100 p-3 shadow-inner">
              <div className="mx-auto max-h-[58vh] overflow-y-auto rounded-lg bg-white p-4 shadow-sm">
                <VisitPrint visit={visit} mode={mode} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onModeChange('prescription')}
                className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                  mode === 'prescription'
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                Prescription
              </button>
              <button
                type="button"
                onClick={() => onModeChange('bill')}
                className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                  mode === 'bill'
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Receipt className="h-3.5 w-3.5" />
                Bill
              </button>
              <button
                type="button"
                onClick={() => onModeChange('both')}
                className={`rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                  mode === 'both'
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                Both pages
              </button>
            </div>
            <button type="button" onClick={onPrint} className="btn-primary w-full">
              <Printer className="h-4 w-4" />
              Print now
            </button>
          </div>
        )}
      </Modal>

      <PrintSheet active={!!visit}>
        {visit && <VisitPrint visit={visit} mode={mode} />}
      </PrintSheet>
    </>
  );
}
