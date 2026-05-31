import { AlertTriangle } from 'lucide-react';

type Props = {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  loading,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 animate-fade-in bg-slate-900/60 backdrop-blur-sm"
        aria-label="Cancel"
        onClick={onCancel}
      />
      <div className="modal-panel relative z-10 w-full max-w-sm p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 animate-pulse-soft items-center justify-center rounded-full bg-gradient-to-br from-red-100 to-red-50 text-red-600 ring-1 ring-red-200/60">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">{title}</h3>
            {message && (
              <p className="mt-1 text-sm text-slate-600">{message}</p>
            )}
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onCancel} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60"
          >
            {loading ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
