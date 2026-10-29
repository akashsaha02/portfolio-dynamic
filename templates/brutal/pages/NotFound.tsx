import Link from "next/link";
import type { TemplateProps } from "../../types";
import { BrutalPage } from "../shell";
import { ArrowUpRight, BTN, MAIN } from "../ui";

// Brutal 404, rendered by app/(site)/not-found.tsx for unknown case studies and every unmatched
// URL: an oversized 404 slab, the h1, one line, and the ways back as buttons. Server Component.

const WAYS_BACK = [
  { href: "/", label: "Home", className: "bg-lime" },
  { href: "/work", label: "Work", className: "bg-paper" },
  { href: "/contact", label: "Contact", className: "bg-paper" },
] as const;

export default function NotFound(props: TemplateProps) {
  return (
    <BrutalPage {...props}>
      <main id="main" tabIndex={-1} className={MAIN}>
        <p aria-hidden="true" className="b-box b-display b-tilt inline-block bg-ink px-4 pt-4 pb-2 text-[clamp(5rem,30vw,16rem)] text-on-ink">
          404
        </p>
        <h1 className="b-display b-h1 mt-10">Page not found</h1>
        <p className="mt-6 text-lg font-semibold">Sorry, there&rsquo;s nothing at this address.</p>
        <nav aria-label="Ways back" className="mt-10">
          <ul className="flex flex-wrap gap-4">
            {WAYS_BACK.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={`${BTN} ${l.className}`}>
                  {l.label}
                  <ArrowUpRight />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </main>
    </BrutalPage>
  );
}
