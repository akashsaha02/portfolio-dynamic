"use client";

import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";

// Copy-on-tap button (guide §2.2 rauno.me, §4.2 footer email). Unstyled: the template passes the
// classes and the label. While "copied", the button carries `data-copied` so the template's CSS
// can swap its visible label, and a polite live region next to it announces `status` (the button's
// own text is not a live region, so the change would be silent otherwise).
//
// Where the Clipboard API is missing or refused (plain http, an old WebView, a denied
// permission) it navigates to `fallbackHref` instead, e.g. the mailto: link.

type CopyButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "type" | "children"> & {
  /** Text put on the clipboard. */
  value: string;
  /** Announced after a successful copy, e.g. "Email address copied". */
  status: string;
  fallbackHref?: string;
  /** How long `data-copied` stays on, in ms. */
  resetAfter?: number;
  children: ReactNode;
};

export function CopyButton({
  value,
  status,
  fallbackHref,
  resetAfter = 2400,
  children,
  ...button
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      if (fallbackHref) window.location.href = fallbackHref;
      return;
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), resetAfter);
  };

  return (
    <>
      <button type="button" data-copied={copied ? "" : undefined} onClick={copy} {...button}>
        {children}
      </button>
      <span role="status" className="sr-only">
        {copied ? status : ""}
      </span>
    </>
  );
}
