"use client";

/** Generic button that calls a JSON server action, confirms optionally (accessible dialog), toasts, refreshes. */
import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useConfirm, type ConfirmOptions } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import type { ActionResult } from "@/lib/action-result";

export function ActionButton({
  action,
  confirm,
  children,
  redirectTo,
  onDone,
  ...props
}: ButtonProps & {
  action: () => Promise<ActionResult<unknown>>;
  /** message (or full options) for a confirmation dialog shown before the action runs */
  confirm?: string | ConfirmOptions;
  redirectTo?: string;
  /** called after a successful action (after the toast) */
  onDone?: (res: ActionResult<unknown>) => void;
}) {
  const [pending, setPending] = React.useState(false);
  const toast = useToast();
  const router = useRouter();
  const { confirm: ask, confirmDialog } = useConfirm();
  return (
    <>
      <Button
        {...props}
        loading={pending}
        onClick={async (e) => {
          e.preventDefault();
          if (confirm && !(await ask(confirm))) return;
          setPending(true);
          let res: ActionResult<unknown>;
          try {
            res = await action();
          } catch (err) {
            res = { ok: false, message: (err as Error).message || "Something went wrong." };
          }
          setPending(false);
          if (res.ok) {
            if (res.message) toast.push("success", res.message);
            onDone?.(res);
            if (redirectTo) router.push(redirectTo);
            else router.refresh();
          } else toast.push("error", res.message);
        }}
      >
        {children}
      </Button>
      {confirm ? confirmDialog : null}
    </>
  );
}
