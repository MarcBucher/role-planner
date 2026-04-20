import { useState, useEffect, useRef } from 'react';
import { Filter, X, Check } from 'lucide-react';

interface CrudFilterPopoverProps {
  currentFilter?: string;
  onSave: (filter: string | undefined) => void;
  label: string; // e.g. "UPDATE – incident"
}

export function CrudFilterPopover({ currentFilter, onSave, label }: CrudFilterPopoverProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(currentFilter ?? '');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setValue(currentFilter ?? '');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, currentFilter]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSave = () => {
    onSave(value.trim() || undefined);
    setOpen(false);
  };

  const handleClear = () => {
    onSave(undefined);
    setOpen(false);
  };

  const hasFilter = !!currentFilter;

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`p-0.5 rounded transition-colors ${
          hasFilter
            ? 'text-orange-500 hover:text-orange-700 hover:bg-orange-50'
            : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'
        }`}
        title={hasFilter ? `Filter: ${currentFilter}` : `Filter für ${label} setzen`}
      >
        <Filter size={10} />
      </button>

      {open && (
        <div className="absolute z-50 bottom-full mb-1 left-1/2 -translate-x-1/2 w-64 bg-white rounded-lg shadow-lg border border-slate-200 p-3">
          <p className="text-[11px] font-semibold text-slate-600 mb-1.5">{label}</p>
          <p className="text-[10px] text-slate-400 mb-2">
            ServiceNow-Bedingung, z.B. <code className="bg-slate-100 px-1 rounded">contact EQ javascript:gs.getUserID()</code>
          </p>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') setOpen(false);
            }}
            placeholder="Filter-Ausdruck..."
            className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          />
          <div className="flex gap-1 mt-2 justify-end">
            {hasFilter && (
              <button
                onClick={handleClear}
                className="flex items-center gap-1 px-2 py-1 text-[11px] text-red-600 hover:bg-red-50 rounded"
              >
                <X size={10} /> Löschen
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              className="px-2 py-1 text-[11px] text-slate-500 hover:bg-slate-100 rounded"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1 px-2 py-1 text-[11px] text-white bg-blue-600 hover:bg-blue-700 rounded"
            >
              <Check size={10} /> OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
