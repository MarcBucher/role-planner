import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastKind = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

export interface ToastAPI {
  success: (msg: string) => void;
  error: (msg: string) => void;
  info: (msg: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastAPI | null>(null);

export function useToast(): ToastAPI {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

// ─── Provider & renderer ──────────────────────────────────────────────────────

let _id = 0;

const KIND_STYLES: Record<ToastKind, { bar: string; icon: React.ReactNode }> = {
  success: {
    bar: 'border-l-4 border-[#38b5aa]',
    icon: <CheckCircle size={15} className="text-[#38b5aa] shrink-0 mt-0.5" />,
  },
  error: {
    bar: 'border-l-4 border-red-500',
    icon: <XCircle size={15} className="text-red-400 shrink-0 mt-0.5" />,
  },
  info: {
    bar: 'border-l-4 border-sky-400',
    icon: <Info size={15} className="text-sky-400 shrink-0 mt-0.5" />,
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    const t = timers.current.get(id);
    if (t) clearTimeout(t);
    timers.current.delete(id);
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const add = useCallback(
    (kind: ToastKind, message: string) => {
      const id = ++_id;
      setToasts((prev) => [...prev.slice(-4), { id, kind, message }]);
      if (kind !== 'error') {
        timers.current.set(id, setTimeout(() => dismiss(id), 4000));
      }
    },
    [dismiss],
  );

  const api: ToastAPI = {
    success: (msg) => add('success', msg),
    error: (msg) => add('error', msg),
    info: (msg) => add('info', msg),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        <div
          aria-live="polite"
          aria-label="Benachrichtigungen"
          className="fixed bottom-4 right-4 z-[300] flex flex-col gap-2 pointer-events-none w-80"
        >
          {toasts.map((t) => {
            const { bar, icon } = KIND_STYLES[t.kind];
            return (
              <div
                key={t.id}
                className={`pointer-events-auto flex items-start gap-3 px-4 py-3 shadow-lg text-sm font-medium bg-[#24303e] text-white ${bar}`}
              >
                {icon}
                <span className="flex-1 leading-snug">{t.message}</span>
                <button
                  onClick={() => dismiss(t.id)}
                  className="text-white/40 hover:text-white shrink-0 transition-colors -mt-0.5"
                  aria-label="Schließen"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}
