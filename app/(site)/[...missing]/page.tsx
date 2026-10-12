import type { Metadata } from "next";
import { notFound } from "next/navigation";

// Every URL no other route matches lands here and 404s through ./not-found.tsx, so it gets the
// active template's NotFound page inside the (site) layout instead of Next's bare default.
// A root app/not-found.tsx can't do this: there is no app/layout.tsx (each route group has its
// own root layout). Static segments always win over a catch-all, so /work, /about and Payload's
// /admin and /api (app/(payload), work plan 2.2) are untouched.

export const metadata: Metadata = { title: "Page not found" };

export default function MissingPage() {
  notFound();
}
