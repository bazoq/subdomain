"use client";

import * as React from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintButton({ auto = false }: { auto?: boolean }) {
  React.useEffect(() => {
    if (!auto) return;
    const id = window.setTimeout(() => window.print(), 300);
    return () => window.clearTimeout(id);
  }, [auto]);
  return (
    <Button onClick={() => window.print()} className="print:hidden">
      <Printer /> Print ticket
    </Button>
  );
}
