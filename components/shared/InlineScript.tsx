"use client";

// A script that runs while the browser parses the server HTML, before first paint (Next guide
// 02-guides/preventing-flash-before-hydration.md). Only full page loads execute it: on the
// client (hydration, soft navigations) React renders it as an inert `text/plain` block, so it
// never runs twice and React doesn't warn about script tags. suppressHydrationWarning covers the
// `type` difference between the two.
//
// `html` must be a self-contained, trusted string built from constants, never from user input.

export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
