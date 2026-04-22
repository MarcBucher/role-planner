import { Download } from 'lucide-react';
import { exportToExcel } from '../../utils/excelExport';
import { useStore } from '../../store';

export function TopBar({ title }: { title: string }) {
  const exportState = useStore((s) => s.exportState);

  const handleExport = () => {
    const state = exportState();
    const date = new Date().toISOString().slice(0, 10);
    exportToExcel(state, `sn-rollenkonzept-${date}.xlsx`);
  };

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-[#e5e7eb] shrink-0">
      <h1 className="text-base font-semibold text-[#24303e] font-display">{title}</h1>
      <button
        onClick={handleExport}
        className="flex items-center gap-2 px-3 py-1.5 bg-[#38b5aa] text-[#24303e] text-sm font-semibold hover:bg-[#2ea095] transition-colors"
      >
        <Download size={14} />
        Excel exportieren
      </button>
    </header>
  );
}
