"use client";

import * as React from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

function focusables(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null || el === document.activeElement);
}

/**
 * Focus management for any modal surface (dialog, drawer, sheet). While `active`:
 * moves focus inside, keeps Tab/Shift+Tab within the container, closes on Escape,
 * locks body scroll and restores focus to the previously focused element on close.
 * Callbacks are read through refs so re-renders of the caller never re-run the trap.
 */
export function useFocusTrap(
  ref: React.RefObject<HTMLElement | null>,
  active: boolean,
  opts: { onEscape?: () => void; initialFocus?: React.RefObject<HTMLElement | null>; lockScroll?: boolean } = {},
) {
  const onEscape = React.useRef(opts.onEscape);
  const initialFocus = React.useRef(opts.initialFocus);
  const lockScroll = opts.lockScroll ?? true;
  React.useEffect(() => {
    onEscape.current = opts.onEscape;
    initialFocus.current = opts.initialFocus;
  });

  React.useEffect(() => {
    if (!active) return;
    const returnTo = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    if (lockScroll) document.body.style.overflow = "hidden";

    const raf = requestAnimationFrame(() => {
      const root = ref.current;
      if (root?.contains(document.activeElement) && document.activeElement !== root) return; // caller already focused something
      const target = initialFocus.current?.current ?? focusables(root).find((el) => !el.hasAttribute("data-dialog-close")) ?? root;
      target?.focus({ preventScroll: true });
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onEscape.current?.();
        return;
      }
      if (e.key !== "Tab") return;
      const root = ref.current;
      const list = focusables(root);
      if (list.length === 0) {
        e.preventDefault();
        root?.focus();
        return;
      }
      const first = list[0];
      const last = list[list.length - 1];
      const activeEl = document.activeElement as HTMLElement | null;
      const inside = root?.contains(activeEl) ?? false;
      if (e.shiftKey && (activeEl === first || !inside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (activeEl === last || !inside)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      if (lockScroll) document.body.style.overflow = prevOverflow;
      if (returnTo && document.contains(returnTo)) returnTo.focus({ preventScroll: true });
    };
  }, [active, ref, lockScroll]);
}

/**
 * Accessible modal dialog: role=dialog + aria-modal, labelled by its title, focus trap,
 * focus restore on close, Escape and backdrop click to close, body scroll lock.
 * Renders as a bottom sheet on phones and a centred panel on larger screens.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
  footer,
  /** Element to focus first; defaults to the first focusable control. */
  initialFocus,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
  initialFocus?: React.RefObject<HTMLElement | null>;
}) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();
  const descId = React.useId();

  useFocusTrap(panelRef, open, { onEscape: onClose, initialFocus });

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          "relative z-10 flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-2xl bg-white shadow-2xl outline-none sm:rounded-2xl",
          "pb-[env(safe-area-inset-bottom)] sm:pb-0",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            {title ? (
              <h2 id={titleId} className="text-lg font-semibold text-slate-900">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p id={descId} className="mt-0.5 text-sm text-slate-500">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            data-dialog-close
            className="-mr-1 shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label="Close dialog"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer ? <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-3 sm:flex-row sm:items-center sm:justify-end">{footer}</div> : null}
      </div>
    </div>
  );
}

export interface ConfirmOptions {
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** red confirm button for destructive actions (default true) */
  danger?: boolean;
}

/** Accessible replacement for window.confirm. Controlled: parent owns `open`. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  loading,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = true,
}: ConfirmOptions & { open: boolean; onClose: () => void; onConfirm: () => void | Promise<void>; loading?: boolean }) {
  const confirmRef = React.useRef<HTMLButtonElement>(null);
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      className="max-w-md"
      initialFocus={confirmRef}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button ref={confirmRef} type="button" variant={danger ? "danger" : "default"} onClick={() => void onConfirm()} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <div className={cn("shrink-0 rounded-full p-2", danger ? "bg-red-50 text-red-600" : "bg-brand-50 text-brand-600")}>
          <AlertTriangle className="size-5" aria-hidden="true" />
        </div>
        <p className="text-sm text-slate-700">{message ?? "This action cannot be undone."}</p>
      </div>
    </Dialog>
  );
}

/**
 * Imperative confirm for event handlers:
 *   const { confirm, confirmDialog } = useConfirm();
 *   if (!(await confirm({ message: "Delete this?" }))) return;
 * Render `{confirmDialog}` once in the component tree.
 */
export function useConfirm() {
  const [state, setState] = React.useState<(ConfirmOptions & { resolve: (ok: boolean) => void }) | null>(null);
  const confirm = React.useCallback((opts: ConfirmOptions | string = {}) => {
    const o = typeof opts === "string" ? { message: opts } : opts;
    return new Promise<boolean>((resolve) => setState({ ...o, resolve }));
  }, []);
  const settle = React.useCallback((ok: boolean) => {
    setState((s) => {
      s?.resolve(ok);
      return null;
    });
  }, []);
  const close = React.useCallback(() => settle(false), [settle]);
  const accept = React.useCallback(() => settle(true), [settle]);
  const confirmDialog = (
    <ConfirmDialog
      open={state !== null}
      onClose={close}
      onConfirm={accept}
      title={state?.title}
      message={state?.message}
      confirmLabel={state?.confirmLabel}
      cancelLabel={state?.cancelLabel}
      danger={state?.danger}
    />
  );
  return { confirm, confirmDialog };
}

/**
 * Button that asks for confirmation before acting. As a form button
 * (`<form action={deleteAction}><ConfirmButton>…</ConfirmButton></form>`) the form is
 * submitted only after the user confirms. Outside a form, `onConfirm` (or `onClick`) runs.
 */
export function ConfirmButton({
  children,
  message = "Are you sure?",
  title,
  confirmLabel = "Confirm",
  cancelLabel,
  danger = true,
  className,
  onConfirm,
  onClick,
  type,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & ConfirmOptions & { onConfirm?: () => void }) {
  const [open, setOpen] = React.useState(false);
  const btnRef = React.useRef<HTMLButtonElement>(null);
  return (
    <>
      <button
        ref={btnRef}
        type={type ?? "button"}
        className={className}
        {...props}
        onClick={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
      >
        {children}
      </button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        message={message}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        danger={danger}
        onConfirm={() => {
          setOpen(false);
          if (onConfirm) onConfirm();
          else if (onClick) onClick({ preventDefault() {}, currentTarget: btnRef.current, target: btnRef.current } as unknown as React.MouseEvent<HTMLButtonElement>);
          else btnRef.current?.form?.requestSubmit();
        }}
      />
    </>
  );
}
