"use client";

/** Generic button that calls a JSON server action, confirms optionally, toasts, refreshes. */
import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { ActionResult } from "@/lib/action-result";

export function ActionButton({
  action,
  confirm,
  children,
  redirectTo,
  ...props
}: ButtonProps & {
  action: () => Promise<ActionResult<unknown>>;
  confirm?: string;
  redirectTo?: string;
}) {
  const [pending, setPending] = React.useState(false);
  const toast = useToast();
  const router = useRouter();
  return (
    <Button
      {...props}
      loading={pending}
      onClick={async (e) => {
        e.preventDefault();
        if (confirm && !window.confirm(confirm)) return;
        setPending(true);
        const res = await action();
        setPending(false);
        if (res.ok) {
          if (res.message) toast.push("success", res.message);
          if (redirectTo) router.push(redirectTo);
          else router.refresh();
        } else toast.push("error", res.message);
      }}
    >
      {children}
    </Button>
  );
}
