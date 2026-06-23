import { useState, useCallback } from 'react';

export interface HoverLabel {
  text: string;
  x: number;
  y: number;
}

export function useCrosshair() {
  const [cell, setCell] = useState<{ row: number; col: number } | null>(null);
  const [hover, setHover] = useState<HoverLabel | null>(null);

  const onEnter = useCallback(
    (
      row: number,
      col: number,
      e?: { clientX: number; clientY: number },
      label?: string,
    ) => {
      setCell({ row, col });
      if (e && label) setHover({ text: label, x: e.clientX, y: e.clientY });
      else setHover(null);
    },
    [],
  );

  const clear = useCallback(() => {
    setCell(null);
    setHover(null);
  }, []);

  return {
    row: cell?.row ?? -1,
    col: cell?.col ?? -1,
    hover,
    onEnter,
    clear,
  };
}

/** Tailwind-Klasse für hervorgehobene Spalten-/Zeilenköpfe */
export const CROSS_HEADER_CLS = 'bg-[#38b5aa]/20 text-[#24303e] font-semibold';
/** Inline-Hintergrundfarbe für den sticky Zeilenkopf bei Hover */
export const CROSS_HEADER_BG = 'rgba(56,181,170,0.12)';
/** Tailwind-Klasse für den dezenten Tint auf Kreuz-Zellen */
export const CROSS_TINT_CLS = 'bg-[#38b5aa]/5';
