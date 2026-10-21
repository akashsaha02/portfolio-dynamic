import type { CSSProperties } from "react";
import Link from "next/link";
import type { Profile } from "@/lib/content-types";
import { RollLabel } from "../ui/Action";
import { ariaCurrent, MORE_PAGES, SHELL_PAGES, type ShellPage } from "./pages";

// What the menu panel shows (guide §4.1): big links (Home, Work, About, Contact) with a lime dot
// before the current page or section, then the secondary pages (Archive, Older versions), email
// and socials. Server-rendered; MenuPanel supplies the behaviour. The big links slide in with a
// short stagger as the panel opens (.f-menu-item).

type MenuNavProps = {
  profile: Pick<Profile, "email" | "socials">;
  current?: ShellPage;
  section?: ShellPage;
};

export function MenuNav({ profile, current, section }: MenuNavProps) {
  return (
    <>
      <nav aria-labelledby="folio-menu-nav">
        <p id="folio-menu-nav" className="border-b border-(--rule) pb-5 type-label">
          Navigation
        </p>
        <ul className="mt-6 grid gap-1 md:mt-8">
          {SHELL_PAGES.map((p, i) => (
            <li key={p.id} className="f-menu-item" style={{ "--i": i } as CSSProperties}>
              <Link
                href={p.href}
                aria-current={ariaCurrent(p.id, current, section)}
                className="f-menu-link f-roll-host flex min-h-14 items-center gap-4 py-1"
              >
                <span aria-hidden="true" className="f-dot f-menu-dot" />
                <RollLabel>{p.label}</RollLabel>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-auto grid gap-8 pt-14 sm:grid-cols-2">
        <nav aria-labelledby="folio-menu-more" className="sm:col-span-2">
          <p id="folio-menu-more" className="type-label">
            More
          </p>
          <ul className="mt-1 flex flex-wrap gap-x-6 gap-y-2">
            {MORE_PAGES.map((p) => (
              <li key={p.href}>
                <Link href={p.href} className="f-roll-host inline-flex min-h-11 items-center">
                  <RollLabel>{p.label}</RollLabel>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <p className="type-label">Email</p>
          <a
            href={`mailto:${profile.email}`}
            className="f-roll-host mt-1 inline-flex min-h-11 items-center"
          >
            <RollLabel>{profile.email}</RollLabel>
          </a>
        </div>
        <div>
          <p id="folio-menu-socials" className="type-label">
            Socials
          </p>
          <ul aria-labelledby="folio-menu-socials" className="mt-1 flex flex-wrap gap-x-6 gap-y-2">
            {profile.socials.map((s) => (
              <li key={s.url}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="f-roll-host inline-flex min-h-11 items-center"
                >
                  <RollLabel>{s.label}</RollLabel>
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
