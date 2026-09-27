import * as React from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

const tones = {
  info: { box: "border-sky-200 bg-sky-50 text-sky-900", icon: "text-sky-600", Icon: Info },
  success: { box: "border-emerald-200 bg-emerald-50 text-emerald-900", icon: "text-emerald-600", Icon: CheckCircle2 },
  warning: { box: "border-amber-200 bg-amber-50 text-amber-900", icon: "text-amber-600", Icon: AlertTriangle },
  danger: { box: "border-red-200 bg-red-50 text-red-900", icon: "text-red-600", Icon: AlertCircle },
} as const;

export type AlertTone = keyof typeof tones;

/**
 * Inline message box. Danger/warning alerts use role="alert" (announced immediately);
 * info/success use role="status". Pass `onDismiss` to render a close button.
 */
export function Alert({
  tone = "info",
  title,
  children,
  className,
  onDismiss,
  actions,
  icon,
}: {
  tone?: AlertTone;
  title?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  onDismiss?: () => void;
  actions?: React.ReactNode;
  /** custom icon; `null` hides it */
  icon?: React.ReactNode | null;
}) {
  const t = tones[tone];
  const IconCmp = t.Icon;
  return (
    <div role={tone === "danger" || tone === "warning" ? "alert" : "status"} className={cn("flex items-start gap-3 rounded-lg border px-3.5 py-3 text-sm", t.box, className)}>
      {icon === null ? null : <span className={cn("mt-0.5 shrink-0 [&_svg]:size-4", t.icon)}>{icon ?? <IconCmp aria-hidden="true" />}</span>}
      <div className="min-w-0 flex-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className={cn(title && "mt-0.5", "text-[13px] leading-relaxed opacity-90")}>{children}</div> : null}
        {actions ? <div className="mt-2 flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="-m-1 shrink-0 rounded p-1 opacity-60 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
          aria-label="Dismiss"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
