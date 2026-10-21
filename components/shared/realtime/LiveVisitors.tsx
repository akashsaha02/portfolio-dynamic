"use client";

import { useEffect, useState } from "react";
import { withCore } from "./lazy";

/**
 * "N here now" (work plan 6.5): open tabs on the whole site, from Ably presence on one site-wide
 * channel (components/shared/realtime/core.ts). Renders nothing while N ≤ 1 (only you), before the
 * connection is up (it waits for idle, a visible tab and no Save-Data), and when realtime is off.
 *
 * Markup for styling: `<span class={className} data-live-visitors={N}>N here now</span>`. It
 * appears after load, so reserve no space for it in a way that shifts other content (CLS).
 */
export function LiveVisitors({ className }: { className?: string }) {
  // Build-time flag (next.config.ts): with "off" everything below is dead code and dropped.
  if (process.env.NEXT_PUBLIC_REALTIME !== "on") return null;
  return <Visitors className={className} />;
}

function Visitors({ className }: { className?: string }) {
  const [count, setCount] = useState(0);

  useEffect(
    () =>
      withCore(({ retain, watchMembers }) => {
        const release = retain();
        const unwatch = watchMembers((members) => setCount(members.length));
        return () => {
          unwatch();
          release();
        };
      }),
    [],
  );

  if (count <= 1) return null;
  return (
    <span className={className} data-live-visitors={count}>
      {count} here now
    </span>
  );
}
