import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search } from 'lucide-react';

export type SearchableOption = {
  id: string;
  label: string;
  hint?: string;
};

type MenuPos = {
  top: number;
  left: number;
  width: number;
};

type Props = {
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  onSelect: (option: SearchableOption) => void;
  selectedId?: string | null;
  placeholder?: string;
  label?: string;
  loading?: boolean;
  emptyText?: string;
  error?: string;
  onOpen?: () => void;
};

export default function SearchableDropdown({
  options,
  value,
  onChange,
  onSelect,
  selectedId,
  placeholder = 'Search…',
  label,
  loading,
  emptyText = 'No matches found',
  error,
  onOpen,
}: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<MenuPos | null>(null);

  function updateMenuPosition() {
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setMenuPos({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  }

  useLayoutEffect(() => {
    if (!open) {
      setMenuPos(null);
      return;
    }
    updateMenuPosition();
  }, [open, options.length, loading]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        const menu = document.getElementById(listId);
        if (menu?.contains(e.target as Node)) return;
        setOpen(false);
      }
    }
    function handleReposition() {
      updateMenuPosition();
    }
    document.addEventListener('mousedown', handleClick);
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [open, listId]);

  function openMenu() {
    setOpen(true);
    onOpen?.();
  }

  function pick(option: SearchableOption) {
    onSelect(option);
    onChange(option.label);
    setOpen(false);
  }

  const menu = open && menuPos && (
    <ul
      id={listId}
      role="listbox"
      style={{
        position: 'fixed',
        top: menuPos.top,
        left: menuPos.left,
        width: menuPos.width,
        zIndex: 9999,
      }}
      className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl shadow-slate-900/15 ring-1 ring-slate-100"
    >
      {loading && (
        <li className="px-3 py-2.5 text-sm text-slate-500">Loading…</li>
      )}
      {!loading && options.length === 0 && (
        <li className="px-3 py-2.5 text-sm text-slate-500">{emptyText}</li>
      )}
      {!loading &&
        options.map((opt) => (
          <li key={opt.id} role="option" aria-selected={selectedId === opt.id}>
            <button
              type="button"
              className={`flex w-full flex-col px-3 py-2.5 text-left text-sm transition hover:bg-brand-50 ${
                selectedId === opt.id
                  ? 'bg-brand-50 font-semibold text-brand-900'
                  : 'text-slate-800'
              }`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(opt)}
            >
              <span>{opt.label}</span>
              {opt.hint && (
                <span className="text-xs font-normal text-slate-500">{opt.hint}</span>
              )}
            </button>
          </li>
        ))}
    </ul>
  );

  return (
    <div ref={rootRef} className="relative">
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      )}
      <div ref={anchorRef} className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          autoComplete="off"
          className={`input w-full cursor-text pr-10 pl-10 ${error ? 'border-red-400 ring-red-200' : ''}`}
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            openMenu();
          }}
          onFocus={openMenu}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false);
            if (e.key === 'ArrowDown' && !open) openMenu();
          }}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => (open ? setOpen(false) : openMenu())}
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}

      {menu && createPortal(menu, document.body)}
    </div>
  );
}
