"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Kind = "success" | "error" | "info";
type Toast = { id: number; kind: Kind; message: string; duration: number };
type Ctx = {
  push: (kind: Kind, message: string, opts?: { duration?: number }) => number;
  dismiss: (id: number) => void;
};

const ToastContext = React.createContext<Ctx | null>(null);

/**
 * Toast stack. Announced to assistive tech through live regions (errors assertive, the rest
 * polite), pauses auto-dismiss while hovered/focused, full-width on phones.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const timers = React.useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = React.useCallback((id: number) => {
    const t = timers.current.get(id);
    if (t) clearTimeout(t);
    timers.current.delete(id);
    setToasts((list) => list.filter((x) => x.id !== id));
  }, []);

  const schedule = React.useCallback(
    (id: number, duration: number) => {
      const t = setTimeout(() => dismiss(id), duration);
      timers.current.set(id, t);
    },
    [dismiss],
  );

  const push = React.useCallback(
    (kind: Kind, message: string, opts: { duration?: number } = {}) => {
      const id = Date.now() + Math.random();
      const duration = opts.duration ?? (kind === "error" ? 7000 : 4500);
      setToasts((list) => [...list.slice(-4), { id, kind, message, duration }]);
      schedule(id, duration);
      return id;
    },
    [schedule],
  );

  const pause = (id: number) => {
    const t = timers.current.get(id);
    if (t) clearTimeout(t);
    timers.current.delete(id);
  };
  const resume = (id: number) => {
    if (!timers.current.has(id)) schedule(id, 2500);
  };

  React.useEffect(() => {
    const map = timers.current;
    return () => map.forEach((t) => clearTimeout(t));
  }, []);

  const value = React.useMemo(() => ({ push, dismiss }), [push, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-3 bottom-3 z-[100] flex flex-col gap-2 sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-80"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div aria-live="assertive" aria-atomic="true" className="sr-only">
          {toasts
            .filter((t) => t.kind === "error")
            .map((t) => t.message)
            .join(". ")}
        </div>
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {toasts
            .filter((t) => t.kind !== "error")
            .map((t) => t.message)
            .join(". ")}
        </div>
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.kind === "error" ? "alert" : "status"}
            onMouseEnter={() => pause(t.id)}
            onMouseLeave={() => resume(t.id)}
            onFocus={() => pause(t.id)}
            onBlur={() => resume(t.id)}
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-lg border bg-white p-3 text-sm shadow-lg ring-1 ring-black/5",
              t.kind === "success" && "border-emerald-200",
              t.kind === "error" && "border-red-200",
              t.kind === "info" && "border-sky-200",
            )}
          >
            {t.kind === "success" ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden="true" />
            ) : t.kind === "error" ? (
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600" aria-hidden="true" />
            ) : (
              <Info className="mt-0.5 size-4 shrink-0 text-sky-600" aria-hidden="true" />
            )}
            <span className="flex-1 break-words text-slate-800">{t.message}</span>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="-m-1 rounded p-1 text-slate-400 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              aria-label="Dismiss notification"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
