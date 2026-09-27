import Link from "next/link";
import { SearchX } from "lucide-react";
import { EmptyState } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Not found" };

/** 404 inside the super admin shell (unknown tenant id, deleted blog post, …). */
export default function SuperAdminNotFound() {
  return (
    <EmptyState
      icon={<SearchX />}
      title="Not found"
      description="This record does not exist or was deleted. It may have been removed by another super user."
      action={
        <Link href="/super">
          <Button variant="outline">Back to overview</Button>
        </Link>
      }
    />
  );
}
