"use client";

import { useEffect, useState } from "react";

/**
 * "N here now" (work plan 6.5): open tabs on the whole site, from Ably presence on one site-wide
 * channel (components/shared/realtime/core.ts). Renders nothing while N ≤ 1 (only you), before the
 * connection is up (it waits for idle, a visible tab and no Save-Data), and when realtime is off.
 *
 * Markup for styling: `<span class={className} data-live-visitors={N}>N here now</span>`. It
 * appears after load, so place it where appearing doesn't shift other content (CLS).
 */
export function LiveVisitors({ className }: { className?: string }) {
  return Visitors ? <Visitors className={className} /> : null;
}

type Props = { className?: string };

// Build-time flag (next.config.ts). The bundler resolves this `if` before following imports, so
// with "off" neither this code nor the lazy chunks it loads (./core, ./ably) are built at all.
let Visitors: ((props: Props) => React.ReactNode) | null = null;
if (process.env.NEXT_PUBLIC_REALTIME === "on") {
  Visitors = function Visitors({ className }: Props) {
    const [count, setCount] = useState(0);

    useEffect(() => {
      let stop: (() => void) | undefined;
      let cancelled = false;
      import("./core")
        .then(({ retain, watchMembers }) => {
          if (cancelled) return;
          const release = retain();
          const unwatch = watchMembers((members) => setCount(members.length));
          stop = () => {
            unwatch();
            release();
          };
        })
        .catch(() => {});
      return () => {
        cancelled = true;
        stop?.();
      };
    }, []);

    if (count <= 1) return null;
    return (
      <span className={className} data-live-visitors={count}>
        {count} here now
      </span>
    );
  };
}
