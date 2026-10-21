// What Folio's ⌘K command menu offers (work plan 6.2), built on the server from the content and
// handed to the shared <CommandMenu> as plain data. Every entry points at something that exists:
// home sections only when they have content, case studies only for projects that have one, the
// résumé only once one is uploaded, Lab only once the page is registered (LAB_READY).

import type { CommandItem } from "@/components/shared/CommandMenu";
import type { SiteContent } from "@/lib/content-types";
import { ANNOTATIONS_TOGGLE_EVENT } from "./annotations";
import { MORE_PAGES, SHELL_PAGES } from "./shell/pages";

export function folioCommands(content: SiteContent): CommandItem[] {
  const { profile, projects, experience, publications, education } = content;

  const pages: CommandItem[] = [...SHELL_PAGES, ...MORE_PAGES].map((p) => ({
    id: `page:${p.href}`,
    label: p.label,
    group: "Pages",
    keywords: p.href === "/v" ? ["versions", "history", "editorial", "snapshot"] : undefined,
    action: { type: "link", href: p.href },
  }));

  // The h2 ids of the Home sections (sections/*.tsx); [id] has a scroll margin for the top bar.
  const sections: CommandItem[] = [
    projects.some((p) => p.featured) ? { id: "work-title", label: "Recent work" } : null,
    experience.length ? { id: "experience-title", label: "Experience" } : null,
    publications.length || education.length ? { id: "research-title", label: "Research", keywords: ["publication", "paper"] } : null,
  ]
    .filter((s) => s !== null)
    .map((s) => ({
      id: `section:${s.id}`,
      label: s.label,
      group: "On the home page",
      keywords: s.keywords,
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
            // A route handler that redirects to the PDF, so a new tab rather than the router.
            action: { type: "link", href: "/resume", external: true },
          } satisfies CommandItem,
        ]
      : []),
    {
      id: "annotations",
      label: "Toggle “how this was built” notes",
      group: "Actions",
      keywords: ["annotations", "notes", "colophon", "built"],
      action: { type: "event", name: ANNOTATIONS_TOGGLE_EVENT },
    },
  ];

  return [...pages, ...sections, ...caseStudies, ...actions];
}
