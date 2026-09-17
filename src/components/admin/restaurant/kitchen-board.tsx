"use client";

/**
 * Live kitchen order board: columns per active status, polling every 10s,
 * WebAudio beep on new orders, accepting-orders toggle, one-click advance / cancel, print ticket link.
 */
import * as React from "react";
import Link from "next/link";
import { Bike, Printer, RefreshCw, Store, UtensilsCrossed, Volume2, VolumeX, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { cn, formatPKR } from "@/lib/utils";
import { listActiveOrders, setAcceptingOrders, updateFoodOrderStatus } from "@/modules/restaurant/actions";
import { nextStatusFor, type FoodOrderDto, type FoodOrderStatusKey, type OrderType } from "@/modules/restaurant/types";

const COLUMNS: { status: FoodOrderStatusKey; label: string; tone: string }[] = [
  { status: "NEW", label: "New", tone: "border-amber-400 bg-amber-50 text-amber-900" },
  { status: "ACCEPTED", label: "Accepted", tone: "border-sky-400 bg-sky-50 text-sky-900" },
  { status: "PREPARING", label: "Preparing", tone: "border-violet-400 bg-violet-50 text-violet-900" },
  { status: "READY", label: "Ready", tone: "border-emerald-400 bg-emerald-50 text-emerald-900" },
  { status: "OUT_FOR_DELIVERY", label: "Out for delivery", tone: "border-indigo-400 bg-indigo-50 text-indigo-900" },
];

const ADVANCE_LABEL: Record<FoodOrderStatusKey, string> = {
  NEW: "Accept",
  ACCEPTED: "Start preparing",
  PREPARING: "Mark ready",
  READY: "Complete",
  OUT_FOR_DELIVERY: "Delivered",
  COMPLETED: "",
  CANCELLED: "",
};

function TypeIcon({ type }: { type: OrderType }) {
  if (type === "DELIVERY") return <Bike className="size-3.5" />;
  if (type === "PICKUP") return <Store className="size-3.5" />;
  return <UtensilsCrossed className="size-3.5" />;
}

function beep(ctx: AudioContext) {
  const play = (at: number, freq: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.4, at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.35);
    osc.connect(gain).connect(ctx.destination);
    osc.start(at);
    osc.stop(at + 0.4);
  };
  const now = ctx.currentTime;
  play(now, 880);
  play(now + 0.45, 1175);
  play(now + 0.9, 880);
}

export function KitchenBoard({
  initialOrders,
  prepTimeMins,
  soundAlerts,
  acceptingOrders: initialAccepting,
}: {
  initialOrders: FoodOrderDto[];
  prepTimeMins: number;
  soundAlerts: boolean;
  acceptingOrders: boolean;
}) {
  const toast = useToast();
  const [orders, setOrders] = React.useState<FoodOrderDto[]>(initialOrders);
  const [accepting, setAccepting] = React.useState(initialAccepting);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [now, setNow] = React.useState(() => Date.now());
  const [lastSync, setLastSync] = React.useState<Date | null>(null);
  const [soundOn, setSoundOn] = React.useState(soundAlerts);
  const [audioReady, setAudioReady] = React.useState(false);
  const audioRef = React.useRef<AudioContext | null>(null);
  const knownNew = React.useRef<Set<string>>(new Set(initialOrders.filter((o) => o.status === "NEW").map((o) => o.id)));

  // AudioContext can only start after a user gesture
  const armAudio = React.useCallback(() => {
    if (audioRef.current) return;
    try {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      audioRef.current = new Ctor();
      setAudioReady(true);
    } catch {
      /* unsupported */
    }
  }, []);
  React.useEffect(() => {
    const once = () => armAudio();
    window.addEventListener("pointerdown", once, { once: true });
    window.addEventListener("keydown", once, { once: true });
    return () => {
      window.removeEventListener("pointerdown", once);
      window.removeEventListener("keydown", once);
    };
  }, [armAudio]);

  const refresh = React.useCallback(async () => {
    const res = await listActiveOrders().catch(() => null);
    if (!res || !res.ok || !res.data) return;
    const fresh = res.data;
    const newIds = fresh.filter((o) => o.status === "NEW").map((o) => o.id);
    const unseen = newIds.filter((id) => !knownNew.current.has(id));
    newIds.forEach((id) => knownNew.current.add(id));
    if (unseen.length && soundOn && audioRef.current) {
      try {
        if (audioRef.current.state === "suspended") await audioRef.current.resume();
        beep(audioRef.current);
      } catch {
        /* ignore */
      }
    }
    if (unseen.length) toast.push("info", `${unseen.length} new order${unseen.length > 1 ? "s" : ""} received`);
    setOrders(fresh);
    setLastSync(new Date());
  }, [soundOn, toast]);

  React.useEffect(() => {
    const poll = window.setInterval(refresh, 10_000);
    const tick = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => {
      window.clearInterval(poll);
      window.clearInterval(tick);
    };
  }, [refresh]);

  async function move(o: FoodOrderDto, status: FoodOrderStatusKey) {
    if (status === "CANCELLED" && !window.confirm(`Cancel order #${o.number}?`)) return;
    setBusy(o.id);
    const res = await updateFoodOrderStatus(o.id, status);
    setBusy(null);
    if (res.ok) {
      setOrders((list) => list.map((x) => (x.id === o.id ? { ...x, status, updatedAt: new Date().toISOString() } : x)).filter((x) => x.status !== "COMPLETED" && x.status !== "CANCELLED"));
      toast.push("success", res.message ?? "Updated");
    } else toast.push("error", res.message);
  }

  async function toggleAccepting(v: boolean) {
    setAccepting(v);
    const res = await setAcceptingOrders(v);
    if (res.ok) toast.push("success", res.message ?? "Saved");
    else {
      setAccepting(!v);
      toast.push("error", res.message);
    }
  }

  const byStatus = (s: FoodOrderStatusKey) => orders.filter((o) => o.status === s);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <Switch checked={accepting} onChange={toggleAccepting} label={accepting ? "Accepting online orders" : "Online orders paused"} />
        {!accepting ? <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">PAUSED</span> : null}
        <div className="ms-auto flex items-center gap-2 text-xs text-slate-500">
          <button
            type="button"
            onClick={() => {
              armAudio();
              setSoundOn((s) => !s);
            }}
            className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-1", soundOn ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-300 text-slate-500")}
            title={soundOn ? (audioReady ? "Sound alerts on" : "Click anywhere to enable sound") : "Sound alerts off"}
          >
            {soundOn ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
            {soundOn ? (audioReady ? "Sound on" : "Sound (tap to arm)") : "Sound off"}
          </button>
          <Button size="sm" variant="outline" onClick={refresh}>
            <RefreshCw />
            Refresh
          </Button>
          {lastSync ? <span>Synced {lastSync.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span> : <span>Auto-refresh every 10s</span>}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {COLUMNS.map((col) => {
          const list = byStatus(col.status);
          return (
            <section key={col.status} className="flex min-h-[40vh] flex-col rounded-xl border border-slate-200 bg-slate-50/60">
              <header className={cn("flex items-center justify-between rounded-t-xl border-b-2 px-3 py-2 text-sm font-semibold", col.tone)}>
                <span>{col.label}</span>
                <span className="rounded-full bg-white/70 px-2 text-xs">{list.length}</span>
              </header>
              <div className="flex-1 space-y-3 p-2">
                {list.length === 0 ? <p className="px-2 py-6 text-center text-xs text-slate-400">No orders</p> : null}
                {list.map((o) => {
                  const elapsed = Math.max(0, Math.round((now - new Date(o.createdAt).getTime()) / 60_000));
                  const late = elapsed > prepTimeMins && !["READY", "OUT_FOR_DELIVERY"].includes(o.status);
                  const next = nextStatusFor(o.status, o.type);
                  return (
                    <article key={o.id} className={cn("rounded-lg border bg-white p-3 shadow-sm", o.status === "NEW" ? "border-amber-300 ring-2 ring-amber-200" : "border-slate-200")}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Link href={`/admin/food-orders/${o.id}`} className="text-base font-bold text-slate-900 hover:underline">
                            #{o.number}
                          </Link>
                          <p className="flex items-center gap-1 text-xs text-slate-500">
                            <TypeIcon type={o.type} />
                            {o.type.replace("_", " ")}
                            {o.area ? ` · ${o.area}` : ""}
                            {o.tableNumber ? ` · Table ${o.tableNumber}` : ""}
                          </p>
                        </div>
                        <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums", late ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600")}>{elapsed}m</span>
                      </div>
                      <p className="mt-2 text-sm font-medium text-slate-800">
                        {o.customerName} <span className="font-normal text-slate-500">{o.customerPhone}</span>
                      </p>
                      {o.scheduledFor ? (
                        <p className="mt-1 rounded bg-sky-50 px-2 py-1 text-xs font-medium text-sky-800">
                          Scheduled: {new Date(o.scheduledFor).toLocaleString("en-PK", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      ) : null}
                      <ul className="mt-2 space-y-1 border-t border-slate-100 pt-2 text-sm">
                        {o.items.map((i) => (
                          <li key={i.id}>
                            <span className="font-semibold">{i.quantity}×</span> {i.name}
                            {i.sizeName ? <span className="text-slate-500"> ({i.sizeName})</span> : null}
                            {i.modifiers.length ? <span className="block ps-5 text-xs text-slate-500">+ {i.modifiers.map((m) => m.name).join(", ")}</span> : null}
                            {i.note ? <span className="block ps-5 text-xs italic text-amber-700">“{i.note}”</span> : null}
                          </li>
                        ))}
                      </ul>
                      {o.notes ? <p className="mt-2 rounded bg-amber-50 px-2 py-1 text-xs italic text-amber-800">{o.notes}</p> : null}
                      <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-sm">
                        <span className="font-bold">{formatPKR(o.total)}</span>
                        <Link href={`/admin/food-orders/${o.id}/print`} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900" title="Print ticket">
                          <Printer className="size-3.5" />
                          Ticket
                        </Link>
                      </div>
                      <div className="mt-2 flex gap-2">
                        {next ? (
                          <Button size="sm" className="flex-1" loading={busy === o.id} onClick={() => move(o, next)} variant={next === "COMPLETED" ? "success" : "default"}>
                            {ADVANCE_LABEL[o.status]}
                          </Button>
                        ) : null}
                        {o.status === "READY" && o.type === "DELIVERY" ? (
                          <Button size="sm" variant="outline" loading={busy === o.id} onClick={() => move(o, "COMPLETED")}>
                            Complete
                          </Button>
                        ) : null}
                        <Button size="sm" variant="ghost" className="text-red-600" disabled={busy === o.id} onClick={() => move(o, "CANCELLED")} title="Cancel order">
                          <XCircle />
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
