// What the Bento template's ⌘K command menu offers (work plan 6.2): the shared
// components/shared/CommandMenu with Bento's pages and the cards on its Home board. Plain data,
// built on the server from the content; every entry points at something that exists.

import type { CommandItem } from "@/components/shared/CommandMenu";
import type { SiteContent } from "@/lib/content-types";

export const PAGES = [
  { href: "/work", label: "Work" },
  { href: "/archive", label: "Archive" },
  { href: "/lab", label: "Lab" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export function bentoCommands(content: SiteContent): CommandItem[] {
  const { profile, projects, experience, publications } = content;

  const pages: CommandItem[] = [{ href: "/", label: "Home" }, ...PAGES, { href: "/v", label: "Older versions" }].map(
    (p) => ({
      id: `page:${p.href}`,
      label: p.label,
      group: "Pages",
      keywords: p.href === "/v" ? ["versions", "history", "editorial", "snapshot"] : undefined,
      action: { type: "link", href: p.href },
    }),
  );

  // The card ids on Bento's Home (pages/Home.tsx).
  const cards: CommandItem[] = [
    { id: "work", label: "Selected work", show: projects.length > 0 },
    { id: "experience", label: "Experience", show: experience.length > 0 },
    { id: "research", label: "Research", show: publications.length > 0 },
    { id: "contact", label: "Let’s work together", show: true },
  ]
    .filter((s) => s.show)
    .map((s) => ({
      id: `card:${s.id}`,
      label: s.label,
      group: "On the home page",
      action: { type: "link", href: `/#${s.id}` },
    }));

  const caseStudies: CommandItem[] = projects
    .filter((p) => p.caseStudy)
    .map((p) => ({
      id: `case:${p.slug}`,
      label: p.name,
      group: "Case studies",
      keywords: [p.kind, ...p.stack],
      hint: p.year,
      action: { type: "link", href: `/work/${p.slug}` },
    }));

  const actions: CommandItem[] = [
    {
      id: "copy-email",
      label: "Copy email address",
      group: "Actions",
      keywords: ["mail", "contact", profile.email],
      hint: profile.email,
      action: { type: "copy", value: profile.email, status: "Email address copied", fallbackHref: `mailto:${profile.email}` },
    },
    ...profile.socials.map(
      (s): CommandItem => ({
        id: `social:${s.url}`,
        label: `Open ${s.label}`,
        group: "Actions",
        keywords: ["social", "profile"],
        hint: "↗",
        action: { type: "link", href: s.url, external: true },
      }),
    ),
    ...(profile.resumeUrl
      ? [
          {
            id: "resume",
            label: "Open résumé",
            group: "Actions",
            keywords: ["resume", "cv", "pdf"],
            hint: "PDF ↗",
            action: { type: "link", href: "/resume", external: true },
          } satisfies CommandItem,
        ]
      : []),
  ];

  return [...pages, ...cards, ...caseStudies, ...actions];
}
