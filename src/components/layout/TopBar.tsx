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
    <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 shrink-0">
      <h1 className="text-base font-semibold text-slate-800">{title}</h1>
      <button
        onClick={handleExport}
        className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
      >
        <Download size={14} />
        Excel exportieren
      </button>
    </header>
  );
}
