"use client";

import { useSyncExternalStore } from "react";

// Live local time for a fixed IANA zone (guide §6 `LocalTime`), e.g. "21:41 GMT+6".
//
// SSR-safe: the server snapshot is null, so the server HTML and the hydration pass both render
// the placeholder, and the real time arrives in the render right after hydration. No mismatch,
// no suppressHydrationWarning. Re-renders on each minute boundary and when the tab becomes
// visible again (timers are throttled in background tabs).

const formatters = new Map<string, Intl.DateTimeFormat | null>();

function formatterFor(timeZone: string): Intl.DateTimeFormat | null {
  if (!formatters.has(timeZone)) {
    try {
      formatters.set(
        timeZone,
        new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", timeZoneName: "short" }),
      );
    } catch {
      // Unknown zone (RangeError): render the placeholder rather than a wrong time.
      formatters.set(timeZone, null);
    }
  }
  return formatters.get(timeZone) ?? null;
}

// One string per minute, so React's Object.is comparison sees no change between ticks.
function snapshot(timeZone: string): string | null {
  return formatterFor(timeZone)?.format(Date.now()) ?? null;
}

function subscribe(onChange: () => void) {
  let interval: ReturnType<typeof setInterval> | undefined;
  const timeout = setTimeout(() => {
    onChange();
    interval = setInterval(onChange, 60_000);
  }, 60_000 - (Date.now() % 60_000));
  document.addEventListener("visibilitychange", onChange);

  return () => {
    clearTimeout(timeout);
    if (interval !== undefined) clearInterval(interval);
    document.removeEventListener("visibilitychange", onChange);
  };
}

type LocalTimeProps = {
  /** IANA zone, e.g. "Asia/Dhaka". */
  timeZone: string;
  className?: string;
};

export function LocalTime({ timeZone, className }: LocalTimeProps) {
  const label = useSyncExternalStore(
    subscribe,
    () => snapshot(timeZone),
    () => null,
  );

  if (label === null) {
    return (
      <span aria-hidden="true" className={`tabular-nums ${className ?? ""}`}>
        --:--
      </span>
    );
  }

  // en-GB with 2-digit parts always starts "HH:MM", a valid <time> value.
  return (
    <time dateTime={label.slice(0, 5)} className={`tabular-nums ${className ?? ""}`}>
      {label}
    </time>
  );
}
