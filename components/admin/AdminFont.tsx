import { Mona_Sans } from "next/font/google";
import type { ReactNode } from "react";

// Mona Sans in the admin (`admin.components.providers`), the site's text font. Same cut as
// app/(site)/layout.tsx (Latin, weight axis, wdth 100), so a visitor who has seen the site already
// has the file cached. Payload's whole UI reads `--font-body`, so pointing it at Mona Sans restyles
// every admin screen, login included, without touching Payload's components. A Server Component:
// the <style> is hoisted into <head> once (href + precedence) and no client JS ships.
const mona = Mona_Sans({ subsets: ["latin"], display: "swap" });

export function AdminFont({ children }: { children?: ReactNode }) {
  return (
    <>
      <style href="ak-admin-font" precedence="default">
        {`:root{--font-body:${mona.style.fontFamily},system-ui,-apple-system,"Segoe UI",sans-serif}`}
      </style>
      {children}
    </>
  );
}
