import { Pencil, Trash2 } from 'lucide-react';

type Props = {
  onEdit: () => void;
  onDelete?: () => void;
  showDelete?: boolean;
  compact?: boolean;
};

export default function ActionButtons({
  onEdit,
  onDelete,
  showDelete = false,
  compact,
}: Props) {
  const size = compact ? 'py-1.5 px-2 text-xs' : 'py-1.5 px-2.5 text-xs';

  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      <button
        type="button"
        onClick={onEdit}
        className={`btn-secondary inline-flex ${size} hover:shadow-sm`}
      >
        <Pencil className="h-3.5 w-3.5" />
        Edit
      </button>
      {showDelete && onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className={`inline-flex items-center gap-1 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-white font-semibold text-red-600 transition-all duration-200 hover:-translate-y-0.5 hover:border-red-300 hover:shadow-sm ${size}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>
      )}
    </div>
  );
}
