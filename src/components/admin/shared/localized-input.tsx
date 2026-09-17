"use client";

import * as React from "react";
import { Input, Label, Textarea, Help, FieldError } from "@/components/ui/input";
import type { LocalizedString } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** EN (+ UR when enabled) text/textarea pair for a LocalizedString value. */
export function LocalizedInput({
  label,
  value,
  onChange,
  urduEnabled,
  multiline,
  rows,
  required,
  error,
  help,
  placeholder,
  className,
  richHint,
}: {
  label: string;
  value: LocalizedString | undefined;
  onChange: (v: LocalizedString) => void;
  urduEnabled: boolean;
  multiline?: boolean;
  rows?: number;
  required?: boolean;
  error?: string;
  help?: string;
  placeholder?: string;
  className?: string;
  /** show markdown hint (rich text fields) */
  richHint?: boolean;
}) {
  const id = React.useId();
  const v = value ?? { en: "" };
  const Cmp = multiline ? Textarea : Input;
  const style = multiline && rows ? { minHeight: `${rows * 1.6 + 1.5}rem` } : undefined;
  return (
    <div className={cn("grid gap-3", urduEnabled && "md:grid-cols-2", className)}>
      <div>
        <Label htmlFor={id}>
          {label}
          {required ? <span className="text-red-500"> *</span> : null}
        </Label>
        <Cmp id={id} value={v.en ?? ""} placeholder={placeholder} style={style} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange({ ...v, en: e.target.value })} />
        <FieldError>{error}</FieldError>
        {!error && help ? <Help>{help}</Help> : null}
        {!error && richHint ? <Help>Plain text or simple markdown: blank line = new paragraph, &quot;- &quot; = bullet, **bold**, ## heading.</Help> : null}
      </div>
      {urduEnabled ? (
        <div dir="rtl">
          <Label htmlFor={`${id}-ur`} className="text-right">
            {label} (اردو)
          </Label>
          <Cmp id={`${id}-ur`} className="font-urdu" value={v.ur ?? ""} style={style} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange({ ...v, ur: e.target.value })} />
        </div>
      ) : null}
    </div>
  );
}
