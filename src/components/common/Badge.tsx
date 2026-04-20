interface BadgeProps {
  label: string;
  color?: string; // hex color for background tint
  className?: string;
}

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

export function Badge({ label, color, className = '' }: BadgeProps) {
  const style = color
    ? (() => {
        const { r, g, b } = hexToRgb(color);
        return {
          backgroundColor: `rgba(${r},${g},${b},0.15)`,
          color: color,
          border: `1px solid rgba(${r},${g},${b},0.4)`,
        };
      })()
    : undefined;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color ? '' : 'bg-slate-100 text-slate-700'} ${className}`}
      style={style}
    >
      {label}
    </span>
  );
}
