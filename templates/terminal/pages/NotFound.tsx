import Link from "next/link";
import type { TemplateProps } from "../../types";
import { MAIN, TerminalPage } from "../shell";
import { H1, LINK, MUTED, Prompt } from "../ui";

// Terminal 404, rendered by app/(site)/not-found.tsx for unknown case studies and every unmatched
// URL: the shell's "no such file" answer (decoration), the h1, one line and the ways back as
// commands. Server Component.

const WAYS_BACK = [
  { href: "/", verb: "cd ", label: "home" },
  { href: "/work", verb: "cd ", label: "work" },
  { href: "/contact", verb: "./", label: "contact" },
] as const;

export default function NotFound(props: TemplateProps) {
  return (
    <TerminalPage {...props}>
      <main id="main" tabIndex={-1} className={MAIN}>
        <Prompt cmd="cd this-page" />
        <p aria-hidden="true" className="text-lime">
          cd: this-page: No such file or directory
        </p>
        <h1 className={`${H1} mt-8`}>Page not found</h1>
        <p className={`mt-3 ${MUTED}`}>
          <span className="tabular-nums">404</span>. Sorry, there&rsquo;s nothing at this address.
        </p>
        <nav aria-label="Ways back" className="mt-8">
          <ul className="-ml-1 flex flex-wrap gap-x-6">
            {WAYS_BACK.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={`${LINK} px-1`}>
                  <span aria-hidden="true" className={MUTED}>
                    {l.verb}
                  </span>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </main>
    </TerminalPage>
  );
}
