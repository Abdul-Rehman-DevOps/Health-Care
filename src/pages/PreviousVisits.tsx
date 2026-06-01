import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Eye,
  FileText,
  Printer,
  Receipt,
  Search,
  Trash2,
} from 'lucide-react';
import { api, type VisitDetail, type VisitSummary } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useVisitPrint } from '../hooks/useVisitPrint';
import { useConfirmDelete } from '../hooks/useConfirmDelete';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import VisitPrintModal from '../components/VisitPrintModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { EMPTY_DISPLAY } from '../lib/display';
import { getPakistanDateString } from '../lib/pakistan-time';

function formatVisitDate(d: string) {
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

function VisitDetailBody({ visit }: { visit: VisitDetail }) {
  const vitals = [
    visit.weightKg != null && `Weight ${visit.weightKg} kg`,
    visit.bloodPressure && `BP ${visit.bloodPressure}`,
    visit.temperature != null && `Temp ${visit.temperature} F`,
    visit.bloodSugar != null && `BS ${visit.bloodSugar}`,
    visit.pulse != null && `Pulse ${visit.pulse}`,
    visit.spo2 != null && `SpO2 ${visit.spo2}%`,
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-5 text-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Patient</p>
          <p className="mt-1 font-bold text-slate-900">{visit.patient.name}</p>
          <p className="text-slate-600">{visit.patient.patientId}</p>
          <p className="text-slate-500">{visit.patient.contact ?? EMPTY_DISPLAY}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Visit</p>
          <p className="mt-1 font-bold text-slate-900">{visit.visitNumber}</p>
          <p className="text-slate-600">{formatVisitDate(visit.visitDate)}</p>
          <p className="text-slate-500">{visit.doctor?.name ?? 'No doctor assigned'}</p>
        </div>
      </div>

      {vitals.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Vitals</p>
          <p className="rounded-xl border border-slate-100 bg-white px-3 py-2 text-slate-700">
            {vitals.join(' | ')}
          </p>
        </div>
      )}

      {visit.diagnosis && (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Diagnosis
          </p>
          <p className="text-slate-800">{visit.diagnosis}</p>
        </div>
      )}

      {visit.lines.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Prescription items ({visit.lines.length})
          </p>
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100">
            {visit.lines.map((l) => (
              <li key={l.id} className="flex justify-between gap-2 px-3 py-2">
                <span>
                  <span className="font-medium text-slate-900">{l.name}</span>
                  {l.dosage && (
                    <span className="ml-1 text-slate-500">({l.dosage})</span>
                  )}
                </span>
                <span className="shrink-0 text-slate-600">
                  x{l.quantity} · PKR {l.amount.toLocaleString('en-PK')}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {visit.bill && (
        <div className="rounded-xl border border-brand-100 bg-brand-50/50 px-4 py-3">
          <p className="text-sm font-semibold text-brand-900">
            Bill {visit.bill.billNumber}: PKR {visit.bill.total.toLocaleString('en-PK')}
          </p>
          <p className="text-xs text-brand-700">
            {visit.bill.isPaid ? 'Paid' : 'Unpaid'}
            {visit.bill.discount > 0 &&
              ` · Discount PKR ${visit.bill.discount.toLocaleString('en-PK')}`}
          </p>
        </div>
      )}

      {visit.advice && (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Advice</p>
          <p className="text-slate-700">{visit.advice}</p>
        </div>
      )}
    </div>
  );
}

export default function PreviousVisits() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const confirmDelete = useConfirmDelete();

  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [detailId, setDetailId] = useState<string | null>(null);

  const print = useVisitPrint();

  const removeVisit = useMutation({
    mutationFn: api.visits.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['visits'] });
      toast('Visit deleted');
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const { data: visits, isLoading, error } = useQuery({
    queryKey: ['visits', 'all', search, dateFrom, dateTo],
    queryFn: () =>
      api.visits.list({
        search: search.trim() || undefined,
        from: dateFrom || undefined,
        to: dateTo || undefined,
        limit: 200,
      }),
  });

  const { data: detailVisit, isLoading: loadingDetail } = useQuery({
    queryKey: ['visits', detailId],
    queryFn: () => api.visits.get(detailId!),
    enabled: !!detailId,
  });

  function clearFilters() {
    setSearch('');
    setDateFrom('');
    setDateTo('');
  }

  return (
    <div className="page-enter mx-auto max-w-6xl space-y-8">
      <PageHeader
        title="Previous visits"
        subtitle="Search and review OPD records, vitals, prescriptions, and bills. Reprint anytime."
      />

      <div className="card-panel p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto_auto] lg:items-end">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Search</span>
            <div className="search-wrap">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="input pl-10"
                placeholder="Patient name, visit no., patient ID"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">From date</span>
            <input
              type="date"
              className="input"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">To date</span>
            <input
              type="date"
              className="input"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </label>
          <button type="button" onClick={clearFilters} className="btn-secondary h-[42px]">
            Clear
          </button>
        </div>
        <button
          type="button"
          className="mt-3 text-sm font-semibold text-brand-700 hover:underline"
          onClick={() => setDateFrom(getPakistanDateString())}
        >
          Show today only
        </button>
      </div>

      {isLoading ? (
        <LoadingSpinner label="Loading visits…" />
      ) : error ? (
        <div className="alert-error p-6">{error.message}</div>
      ) : !visits?.length ? (
        <EmptyState
          icon={Calendar}
          title="No visits found"
          description="Try changing filters or create a new visit from OPD and Prescription."
        />
      ) : (
        <div className="card-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3">Visit</th>
                  <th className="px-5 py-3">Patient</th>
                  <th className="px-5 py-3">Doctor</th>
                  <th className="px-5 py-3">Diagnosis</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visits.map((v: VisitSummary) => (
                  <tr
                    key={v.id}
                    className="border-b border-slate-50 transition hover:bg-brand-50/30"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-brand-800">{v.visitNumber}</p>
                      <p className="text-xs text-slate-500">{formatVisitDate(v.visitDate)}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-900">{v.patient.name}</p>
                      <p className="text-xs text-slate-500">{v.patient.patientId}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-700">
                      {v.doctor?.name ?? EMPTY_DISPLAY}
                    </td>
                    <td className="max-w-[180px] truncate px-5 py-4 text-slate-600">
                      {v.diagnosis ?? EMPTY_DISPLAY}
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-900">
                      PKR {(v.bill?.total ?? v.consultationFee).toLocaleString('en-PK')}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={v.bill?.isPaid ? 'success' : 'warning'}>
                        {v.bill?.isPaid ? 'Paid' : 'Unpaid'}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          title="View record"
                          onClick={() => setDetailId(v.id)}
                          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Print prescription"
                          onClick={() => print.openVisitPrint(v.id, 'prescription')}
                          className="rounded-lg p-2 text-brand-700 hover:bg-brand-50"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Print bill"
                          onClick={() => print.openVisitPrint(v.id, 'bill')}
                          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                        >
                          <Receipt className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Print both"
                          onClick={() => print.openVisitPrint(v.id, 'both')}
                          className="rounded-lg p-2 text-teal-700 hover:bg-teal-50"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                        {isAdmin && (
                          <button
                            type="button"
                            title="Delete visit"
                            onClick={() =>
                              confirmDelete.ask({
                                title: `Delete ${v.visitNumber}?`,
                                message: `Remove this visit for ${v.patient.name}? Prescription, bill, and line items will be permanently deleted.`,
                                onConfirm: async () => {
                                  await removeVisit.mutateAsync(v.id);
                                  if (detailId === v.id) setDetailId(null);
                                },
                              })
                            }
                            className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
            Showing {visits.length} visit{visits.length === 1 ? '' : 's'} (newest first)
          </p>
        </div>
      )}

      <Modal
        title={detailVisit ? `Visit ${detailVisit.visitNumber}` : 'Visit details'}
        open={!!detailId}
        onClose={() => setDetailId(null)}
      >
        {loadingDetail ? (
          <LoadingSpinner />
        ) : detailVisit ? (
          <div className="space-y-4">
            <VisitDetailBody visit={detailVisit} />
            <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => print.openVisitPrint(detailVisit.id, 'prescription')}
              >
                <FileText className="h-4 w-4" />
                Print Rx
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => print.openVisitPrint(detailVisit.id, 'bill')}
              >
                <Receipt className="h-4 w-4" />
                Print bill
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => print.openVisitPrint(detailVisit.id, 'both')}
              >
                <Printer className="h-4 w-4" />
                Print both
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      <VisitPrintModal
        visit={print.savedVisit}
        open={print.printOpen}
        mode={print.printMode}
        onClose={print.closePrint}
        onModeChange={print.setPrintMode}
        onPrint={print.printNow}
      />

      {print.loading && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/20 backdrop-blur-sm">
          <LoadingSpinner label="Preparing print…" />
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDelete.pending}
        title={confirmDelete.pending?.title ?? ''}
        message={confirmDelete.pending?.message}
        loading={confirmDelete.loading || removeVisit.isPending}
        onConfirm={confirmDelete.confirm}
        onCancel={confirmDelete.cancel}
      />
    </div>
  );
}
