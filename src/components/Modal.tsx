import type { ReactNode } from 'react';
import { X } from 'lucide-react';

type Props = {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

export default function Modal({ title, open, onClose, children }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 animate-fade-in bg-slate-900/60 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="modal-panel p-6">
        <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4 pt-1">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="animate-slide-up">{children}</div>
      </div>
    </div>
  );
}
