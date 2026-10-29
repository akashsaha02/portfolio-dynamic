import Link from "next/link";
import type { WidgetServerProps } from "payload";
import { formatAdminURL } from "payload/shared";

type QuickLink = { href: string; label: string; hint: string; external?: boolean };

/**
 * Dashboard widget: the few places Akash goes most (work plan 2.6). Full-width rows on a phone
 * (one-thumb targets); two or three columns when the widget is wide (container queries in
 * custom.scss, so it follows the widget's width, not the window's).
 */
export function QuickLinksWidget({ req }: WidgetServerProps) {
  const adminRoute = req.payload.config.routes.admin;
  const admin = (path: `/${string}`) => formatAdminURL({ adminRoute, path });

  const links: QuickLink[] = [
    { href: "/", label: "View site", hint: "Opens in a new tab", external: true },
    { href: admin("/globals/profile"), label: "Preview home", hint: "Profile, then the Live Preview toggle" },
    { href: admin("/globals/profile"), label: "Résumé", hint: "Profile → Links → Résumé (PDF)" },
    { href: admin("/collections/messages?where[read][equals]=false"), label: "Messages", hint: "Unread first" },
    { href: admin("/collections/projects"), label: "Projects", hint: "Edit, reorder, publish" },
    { href: admin("/collections/projects/create"), label: "New project", hint: "Starts as a draft" },
  ];

  return (
    <nav className="card ak-widget" aria-labelledby="ak-links-title">
      <header className="ak-widget__head">
        <h2 id="ak-links-title" className="ak-widget__title">
          Quick links
        </h2>
      </header>
      <ul className="ak-rows ak-rows--grid">
        {links.map((link) => {
          const body = (
            <>
              <span className="ak-row__text">
                <span className="ak-row__title">{link.label}</span>
                <span className="ak-row__meta">{link.hint}</span>
              </span>
              <span className="ak-row__arrow" aria-hidden="true">
                {link.external ? "↗" : "→"}
              </span>
            </>
          );
          return (
            <li key={link.label}>
              {link.external ? (
                <a className="ak-row" href={link.href} target="_blank" rel="noopener">
                  {body}
                </a>
              ) : (
                <Link className="ak-row" href={link.href}>
                  {body}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
