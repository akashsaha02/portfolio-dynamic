// The Folio pages the shell links to, in menu order. The top bar shows all but Home (the logo is
// the home link); the menu panel shows all four.

export type ShellPage = "home" | "work" | "about" | "contact";

export const SHELL_PAGES: { id: ShellPage; href: string; label: string }[] = [
  { id: "home", href: "/", label: "Home" },
  { id: "work", href: "/work", label: "Work" },
  { id: "about", href: "/about", label: "About" },
  { id: "contact", href: "/contact", label: "Contact" },
];

/**
 * aria-current for a shell link: "page" on the page itself, "true" on the section a deeper page
 * sits in (Work on a case study), so only the exact page claims to be the current page.
 */
export function ariaCurrent(id: ShellPage, current?: ShellPage, section?: ShellPage) {
  if (id === current) return "page" as const;
  if (id === section) return "true" as const;
  return undefined;
}

/** The menu panel's id, for every trigger's aria-controls. One shell per page. */
export const MENU_ID = "folio-menu";
