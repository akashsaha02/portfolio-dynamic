"use client";

import { useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type Ref } from "react";
import { TURNSTILE_FIELD } from "@/lib/turnstile";

// Cloudflare Turnstile, explicit render (work plan 3.3). Unstyled: the template passes the class
// and shows the status in its own words. Renders nothing without NEXT_PUBLIC_TURNSTILE_SITE_KEY,
// so a form without a key behaves exactly as before.
//
// Cloudflare's api.js (~50 KB from challenges.cloudflare.com, never self-hosted: Cloudflare asks
// that it isn't proxied or cached) is never in the initial HTML or bundle. It is injected the
// first time the visitor focuses or presses inside the enclosing <form>, or when the widget comes
// within ~one screen of the viewport, so the page's LCP and every other page are untouched.
//
// The widget renders into a div inside the <form>, where Cloudflare adds the hidden
// `cf-turnstile-response` input the Server Action reads. Managed mode with
// appearance "interaction-only": most visitors never see it; when Cloudflare wants a click the
// container gets `data-visible` (the only time it takes space). Tokens are single-use and live
// 300 s: `refresh-expired: auto` renews them, and the form calls `reset()` after any failed send.

/**
 * Public site key, inlined at build. Cloudflare's dummy keys for tests:
 * `1x00000000000000000000AA` always passes, `2x00000000000000000000AB` always blocks.
 */
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || undefined;

export type TurnstileStatus =
  /** Script not requested yet (no interaction with the form). */
  | "idle"
  /** Script loading, or the challenge running in the background. */
  | "checking"
  /** Cloudflare wants the visitor to interact with the visible widget. */
  | "interactive"
  /** A token is in the form. */
  | "ready"
  /** A challenge or network error; Turnstile retries on its own. */
  | "error"
  /** The browser can't run Turnstile. */
  | "unsupported"
  /** api.js didn't load (offline, or blocked by an extension). */
  | "unavailable";

export type TurnstileHandle = {
  /** Fetches a fresh token (after a failed send, the old one is spent). */
  reset: () => void;
};

type TurnstileWidgetProps = {
  ref?: Ref<TurnstileHandle>;
  onStatusChange?: (status: TurnstileStatus) => void;
  className?: string;
};

type TurnstileOptions = {
  sitekey: string;
  theme: "light" | "dark" | "auto";
  size: "normal" | "flexible" | "compact";
  appearance: "always" | "execute" | "interaction-only";
  "refresh-expired": "auto" | "manual" | "never";
  "response-field-name": string;
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": (code: string) => boolean;
  "timeout-callback": () => void;
  "before-interactive-callback": () => void;
  "after-interactive-callback": () => void;
  "unsupported-callback": () => void;
};

type TurnstileApi = {
  render: (container: HTMLElement, options: TurnstileOptions) => string | undefined;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
    __turnstileOnLoad?: () => void;
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=__turnstileOnLoad";

/** Flexible needs 300 px; narrower columns (a 320 px phone) get the 150 px compact widget. */
const FLEXIBLE_MIN = 300;

let scriptPromise: Promise<TurnstileApi> | null = null;

/** Injects api.js once per page; a failed load can be retried by the next interaction. */
function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  scriptPromise ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement("script");
    window.__turnstileOnLoad = () => {
      delete window.__turnstileOnLoad;
      if (window.turnstile) resolve(window.turnstile);
      else reject(new Error("turnstile missing"));
    };
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onerror = () => {
      script.remove();
      delete window.__turnstileOnLoad;
      scriptPromise = null;
      reject(new Error("turnstile failed to load"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export function TurnstileWidget({ ref, onStatusChange, className }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>(undefined);
  const [visible, setVisible] = useState(false);

  // Latest callback in a ref, so the widget's effect runs once and never re-renders Cloudflare's.
  const onStatus = useRef(onStatusChange);
  useLayoutEffect(() => {
    onStatus.current = onStatusChange;
  });

  useImperativeHandle(
    ref,
    () => ({
      reset() {
        const api = window.turnstile;
        if (!api || widgetId.current === undefined) return;
        onStatus.current?.("checking");
        api.reset(widgetId.current);
      },
    }),
    [],
  );

  useEffect(() => {
    const container = containerRef.current;
    const sitekey = TURNSTILE_SITE_KEY;
    if (!container || !sitekey) return;
    const form = container.closest("form");
    const report = (status: TurnstileStatus) => onStatus.current?.(status);
    let cancelled = false;
    let started = false;

    const options = (): TurnstileOptions => ({
      sitekey,
      // The form sits on paper; "auto" would follow a dark OS theme and clash.
      theme: "light",
      size: container.clientWidth >= FLEXIBLE_MIN ? "flexible" : "compact",
      appearance: "interaction-only",
      "refresh-expired": "auto",
      "response-field-name": TURNSTILE_FIELD,
      callback: () => report("ready"),
      // Auto-refresh follows; until the new token lands the form must not send.
      "expired-callback": () => report("checking"),
      // Turnstile retries by itself (retry: auto). Returning true marks the error handled.
      "error-callback": () => {
        report("error");
        return true;
      },
      "timeout-callback": () => report("interactive"),
      "before-interactive-callback": () => {
        setVisible(true);
        report("interactive");
      },
      "after-interactive-callback": () => report("checking"),
      "unsupported-callback": () => report("unsupported"),
    });

    const render = (api: TurnstileApi) => {
      if (cancelled) return;
      try {
        widgetId.current = api.render(container, options());
      } catch {
        // A malformed site key: no token is possible.
        report("error");
      }
    };

    const listen = () => {
      form?.addEventListener("focusin", start);
      form?.addEventListener("pointerdown", start);
    };
    const detach = () => {
      observer?.disconnect();
      form?.removeEventListener("focusin", start);
      form?.removeEventListener("pointerdown", start);
    };

    function start() {
      if (started) return;
      started = true;
      detach();
      report("checking");
      loadTurnstile().then(render, () => {
        if (cancelled) return;
        report("unavailable");
        // Offline or blocked: the next focus or tap in the form tries again.
        started = false;
        listen();
      });
    }

    // Half a screen below the viewport: the bottom of the form, so scrolling to "Send" starts it.
    const observer =
      typeof IntersectionObserver === "undefined"
        ? undefined
        : new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && start(), {
            rootMargin: "0px 0px 50% 0px",
          });

    // Already loaded (the form was remounted, e.g. "Send another message"): render straight away.
    if (window.turnstile) start();
    else {
      observer?.observe(container);
      listen();
    }

    return () => {
      cancelled = true;
      detach();
      if (widgetId.current !== undefined) window.turnstile?.remove(widgetId.current);
      widgetId.current = undefined;
    };
  }, []);

  if (!TURNSTILE_SITE_KEY) return null;
  return <div ref={containerRef} className={className} data-visible={visible ? "" : undefined} />;
}
