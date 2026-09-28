import { cn } from "@/lib/utils";

/** The brand wordmark: gold monogram tile + name. Dependency-free so the client header can use it. */
export function Wordmark({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span className="font-display flex size-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-gold-200 via-gold-400 to-gold-600 text-lg leading-none text-ink-950 shadow-[0_0_24px_-6px_rgba(226,187,114,0.7)]" aria-hidden>
        {name.charAt(0)}
      </span>
      <span className="font-display text-2xl leading-none tracking-tight text-white">{name}</span>
    </span>
  );
}
