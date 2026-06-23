import { createPortal } from 'react-dom';
import type { HoverLabel } from '../../hooks/useCrosshair';

interface CrosshairLabelProps {
  hover: HoverLabel | null;
}

/**
 * Schwebendes horizontales Label das den senkrechten Spaltennamen lesbar
 * unterhalb des Mauszeigers einblendet. Wird via Portal an document.body
 * gemountet, damit overflow-x-auto Container es nicht abschneiden.
 */
export function CrosshairLabel({ hover }: CrosshairLabelProps) {
  if (!hover) return null;

  return createPortal(
    <div
      className="pointer-events-none fixed z-50 px-2 py-1 text-xs font-medium text-white bg-[#24303e] rounded shadow-lg whitespace-nowrap"
      style={{
        left: hover.x,
        top: hover.y + 20,
        transform: 'translateX(-50%)',
      }}
    >
      {hover.text}
    </div>,
    document.body,
  );
}
