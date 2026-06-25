import { Search, X } from 'lucide-react';

interface MatrixToolbarProps {
  rowSearch: string;
  colSearch: string;
  onRowSearch: (v: string) => void;
  onColSearch: (v: string) => void;
  onlyAssigned: boolean;
  onOnlyAssigned: (v: boolean) => void;
  rowLabel?: string;
  colLabel?: string;
}

export function MatrixToolbar({
  rowSearch,
  colSearch,
  onRowSearch,
  onColSearch,
  onlyAssigned,
  onOnlyAssigned,
  rowLabel = 'Zeile',
  colLabel = 'Spalte',
}: MatrixToolbarProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Row search */}
      <div className="relative flex items-center">
        <Search size={13} className="absolute left-2.5 text-[#767676] pointer-events-none" />
        <input
          type="text"
          value={rowSearch}
          onChange={(e) => onRowSearch(e.target.value)}
          placeholder={`${rowLabel} filtern…`}
          className="pl-7 pr-7 py-1.5 text-xs border border-[#e5e7eb] focus:outline-none focus:ring-2 focus:ring-[#38b5aa] w-40"
        />
        {rowSearch && (
          <button onClick={() => onRowSearch('')} className="absolute right-2 text-[#c8c8c8] hover:text-[#767676]">
            <X size={12} />
          </button>
        )}
      </div>
      {/* Col search */}
      <div className="relative flex items-center">
        <Search size={13} className="absolute left-2.5 text-[#767676] pointer-events-none" />
        <input
          type="text"
          value={colSearch}
          onChange={(e) => onColSearch(e.target.value)}
          placeholder={`${colLabel} filtern…`}
          className="pl-7 pr-7 py-1.5 text-xs border border-[#e5e7eb] focus:outline-none focus:ring-2 focus:ring-[#38b5aa] w-40"
        />
        {colSearch && (
          <button onClick={() => onColSearch('')} className="absolute right-2 text-[#c8c8c8] hover:text-[#767676]">
            <X size={12} />
          </button>
        )}
      </div>
      {/* Only assigned */}
      <label className="flex items-center gap-1.5 text-xs text-[#767676] cursor-pointer select-none">
        <input
          type="checkbox"
          checked={onlyAssigned}
          onChange={(e) => onOnlyAssigned(e.target.checked)}
          className="accent-[#38b5aa]"
        />
        Nur Zuweisungen
      </label>
    </div>
  );
}
