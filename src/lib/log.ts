/**
 * Minimal structured logger. One JSON object per line so Vercel's log drain (and any
 * future Sentry/OTel exporter wired in `src/instrumentation.ts`) can parse it.
 *
 * Usage: `log.info("order.created", { tenantId, orderId })`.
 * Levels: debug < info < warn < error. Set `LOG_LEVEL` to raise the threshold (default: info,
 * debug in development). Never log secrets, passwords or session tokens.
 */
export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogFields = Record<string, unknown>;

const LEVELS: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

function threshold(): number {
  const raw = (process.env.LOG_LEVEL ?? "").toLowerCase() as LogLevel;
  if (raw in LEVELS) return LEVELS[raw];
  return process.env.NODE_ENV === "development" ? LEVELS.debug : LEVELS.info;
}

/** Serialise an unknown thrown value into plain fields (no stack in production). */
export function errorFields(err: unknown): LogFields {
  if (err instanceof Error) {
    const out: LogFields = { errorName: err.name, errorMessage: err.message };
    if ("digest" in err && typeof (err as { digest?: unknown }).digest === "string") out.digest = (err as { digest: string }).digest;
    if (process.env.NODE_ENV !== "production" && err.stack) out.stack = err.stack;
    return out;
  }
  return { errorMessage: String(err) };
}

type Sink = (level: LogLevel, line: string) => void;

let sink: Sink = (level, line) => {
  // The console is the only transport on Vercel; stdout/stderr are captured by the platform.
  // eslint-disable-next-line no-console
  if (level === "error") console.error(line);
  // eslint-disable-next-line no-console
  else if (level === "warn") console.warn(line);
  // eslint-disable-next-line no-console
  else console.log(line);
};

/** Replace the transport (tests, or forwarding to an external collector). Returns the previous sink. */
export function setLogSink(next: Sink): Sink {
  const prev = sink;
  sink = next;
  return prev;
}

function emit(level: LogLevel, msg: string, fields?: LogFields) {
  if (LEVELS[level] < threshold()) return;
  const record: LogFields = { time: new Date().toISOString(), level, msg, ...fields };
  let line: string;
  try {
    line = JSON.stringify(record);
  } catch {
    line = JSON.stringify({ time: record.time, level, msg, unserialisable: true });
  }
  sink(level, line);
}

export const log = {
  debug: (msg: string, fields?: LogFields) => emit("debug", msg, fields),
  info: (msg: string, fields?: LogFields) => emit("info", msg, fields),
  warn: (msg: string, fields?: LogFields) => emit("warn", msg, fields),
  error: (msg: string, fields?: LogFields) => emit("error", msg, fields),
};
