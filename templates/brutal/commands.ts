// What the Brutal template's ⌘K command menu offers: the shared components/shared/CommandMenu
// with Brutal's pages and home sections (as templates/index/commands.ts does for Index). Plain
// data, built on the server from the content; every entry points at something that exists.

import type { CommandItem } from "@/components/shared/CommandMenu";
import type { SiteContent } from "@/lib/content-types";

const PAGES = [
  { href: "/", label: "Home" },
  { href: "/work", label: "Work" },
  { href: "/archive", label: "Archive" },
  { href: "/lab", label: "Lab" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/v", label: "Older versions" },
];

export function brutalCommands(content: SiteContent): CommandItem[] {
  const { profile, projects, experience, publications, education } = content;

  const pages: CommandItem[] = PAGES.map((p) => ({
    id: `page:${p.href}`,
    label: p.label,
    group: "Pages",
    keywords: p.href === "/v" ? ["versions", "history", "editorial", "snapshot"] : undefined,
    action: { type: "link", href: p.href },
  }));

  // The section ids on Brutal's Home (pages/Home.tsx), shown under the same conditions.
  const sections: CommandItem[] = [
    { id: "work", label: "Selected work", show: projects.length > 0 },
    { id: "experience", label: "Experience", show: experience.length > 0 },
    { id: "research", label: "Research", show: publications.length > 0 || education.length > 0 },
  ]
    .filter((s) => s.show)
    .map((s) => ({
      id: `section:${s.id}`,
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

  return [...pages, ...sections, ...caseStudies, ...actions];
}
