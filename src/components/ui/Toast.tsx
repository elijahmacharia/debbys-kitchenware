'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { AlertIcon, CheckIcon, InfoIcon, XIcon } from '@/components/icons';

type Tone = 'success' | 'error' | 'info';
interface Toast { id: number; tone: Tone; message: string }

const ToastContext = createContext<{ push: (message: string, tone?: Tone) => void } | null>(null);

/** Lightweight notifications. No dependency, no portal library. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const push = useCallback((message: string, tone: Tone = 'success') => {
    const id = nextId.current;
    nextId.current += 1;
    setToasts((current) => [...current.slice(-2), { id, tone, message }]);
    window.setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), 4000);
  }, []);

  const dismiss = (id: number) => setToasts((current) => current.filter((t) => t.id !== id));
  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/*
        aria-live="polite" announces the message without interrupting whatever
        the screen reader is currently saying. Positioned above the floating
        WhatsApp button so the two never overlap.
      */}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-24"
        aria-live="polite"
      >
        {toasts.map((toast) => {
          const Icon = toast.tone === 'success' ? CheckIcon : toast.tone === 'error' ? AlertIcon : InfoIcon;
          return (
            <div
              key={toast.id}
              className={cn(
                'pointer-events-auto flex w-full max-w-sm animate-slide-up items-start gap-2 rounded-card px-3.5 py-3 text-sm font-medium text-white shadow-pop',
                toast.tone === 'error' ? 'bg-danger' : toast.tone === 'info' ? 'bg-ink' : 'bg-brand-700',
              )}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="flex-1">{toast.message}</span>
              <button type="button" onClick={() => dismiss(toast.id)} aria-label="Dismiss" className="shrink-0 opacity-80 hover:opacity-100">
                <XIcon className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>');
  return context;
}
