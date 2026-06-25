import { useCallback, useRef } from 'react';

interface UseMatrixGridNavOptions {
  rowCount: number;
  colCount: number;
  onEnterCell?: (row: number, col: number) => void;
}

export function useMatrixGridNav({ rowCount, colCount, onEnterCell }: UseMatrixGridNavOptions) {
  // Track the currently "active" cell for roving tabindex
  const activeRef = useRef<{ row: number; col: number }>({ row: 0, col: 0 });
  // Map of cell refs: `${row}-${col}` → HTMLButtonElement
  const cellRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const registerRef = useCallback((row: number, col: number, el: HTMLButtonElement | null) => {
    const key = `${row}-${col}`;
    if (el) cellRefs.current.set(key, el);
    else cellRefs.current.delete(key);
  }, []);

  const focusCell = useCallback((row: number, col: number) => {
    const clampedRow = Math.max(0, Math.min(row, rowCount - 1));
    const clampedCol = Math.max(0, Math.min(col, colCount - 1));
    activeRef.current = { row: clampedRow, col: clampedCol };
    cellRefs.current.get(`${clampedRow}-${clampedCol}`)?.focus();
    onEnterCell?.(clampedRow, clampedCol);
  }, [rowCount, colCount, onEnterCell]);

  const getTabIndex = useCallback((row: number, col: number) => {
    return row === activeRef.current.row && col === activeRef.current.col ? 0 : -1;
  }, []);

  const onKeyDown = useCallback((e: React.KeyboardEvent, row: number, col: number) => {
    const { key } = e;
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key)) return;
    e.preventDefault();
    if (key === 'ArrowUp') focusCell(row - 1, col);
    else if (key === 'ArrowDown') focusCell(row + 1, col);
    else if (key === 'ArrowLeft') focusCell(row, col - 1);
    else if (key === 'ArrowRight') focusCell(row, col + 1);
    else if (key === 'Home') focusCell(row, 0);
    else if (key === 'End') focusCell(row, colCount - 1);
  }, [focusCell, colCount]);

  return { getTabIndex, onKeyDown, registerRef };
}
