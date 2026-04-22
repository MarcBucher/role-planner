import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 bg-[#38b5aa]/10 flex items-center justify-center mb-4">
        <Icon size={24} className="text-[#38b5aa]" />
      </div>
      <h3 className="font-semibold text-[#24303e] mb-1 font-display">{title}</h3>
      <p className="text-sm text-[#56606c] mb-5 max-w-xs">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 text-sm bg-[#38b5aa] text-[#24303e] font-semibold hover:bg-[#2ea095] transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
