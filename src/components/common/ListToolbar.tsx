import { Search, X } from 'lucide-react';

export interface Chip {
  label: string;
  value: string;
}

interface ListToolbarProps {
  search: string;
  onSearch: (v: string) => void;
  chips?: Chip[];
  activeChip?: string;
  onChipChange?: (v: string) => void;
  placeholder?: string;
}

export function ListToolbar({
  search,
  onSearch,
  chips,
  activeChip,
  onChipChange,
  placeholder = 'Suchen…',
}: ListToolbarProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Search input */}
      <div className="relative flex items-center">
        <Search size={13} className="absolute left-2 text-[#c8c8c8] pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={placeholder}
          className="pl-7 pr-6 py-1.5 text-sm border border-[#e5e7eb] focus:ring-2 focus:ring-[#38b5aa] focus:outline-none w-48"
        />
        {search && (
          <button
            onClick={() => onSearch('')}
            className="absolute right-1.5 text-[#c8c8c8] hover:text-[#767676] transition-colors"
            aria-label="Suche leeren"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Filter chips */}
      {chips && chips.length > 0 && onChipChange && (
        <div className="flex gap-1">
          {chips.map((chip) => (
            <button
              key={chip.value}
              onClick={() => onChipChange(chip.value)}
              className={`px-2.5 py-1 text-xs transition-colors ${
                activeChip === chip.value
                  ? chip.value === 'extern'
                    ? 'bg-orange-100 text-orange-700 font-semibold'
                    : chip.value === 'intern'
                    ? 'bg-[#38b5aa]/10 text-[#38b5aa] font-semibold'
                    : 'bg-[#e5e7eb] text-[#24303e] font-semibold'
                  : 'text-[#767676] hover:bg-[#f0f0f0]'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
