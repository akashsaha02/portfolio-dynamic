// What the Terminal template's ⌘K command menu offers (work plan 6.2): the shared
// components/shared/CommandMenu with Terminal's pages and home sections. Plain data, built on the
// server from the content; every entry points at something that exists. Hints show the command
// each page is drawn as in the header, and the shell verbs are keywords, so "cd" or "ls" finds them.

import type { CommandItem } from "@/components/shared/CommandMenu";
import type { SiteContent } from "@/lib/content-types";

const PAGES = [
  { href: "/", label: "Home", hint: "cd ~", keywords: ["cd", "home"] },
  { href: "/work", label: "Work", hint: "cd work", keywords: ["cd", "projects"] },
  { href: "/archive", label: "Archive", hint: "ls archive", keywords: ["ls", "projects", "all"] },
  { href: "/lab", label: "Lab", hint: "./lab", keywords: ["ml", "classifier", "demo"] },
  { href: "/about", label: "About", hint: "cat about", keywords: ["cat", "bio"] },
  { href: "/contact", label: "Contact", hint: "./contact", keywords: ["mail", "message"] },
  { href: "/v", label: "Older versions", hint: "git log", keywords: ["versions", "history", "editorial", "snapshot"] },
];

export function terminalCommands(content: SiteContent): CommandItem[] {
  const { profile, projects, experience, publications, education } = content;

  const pages: CommandItem[] = PAGES.map((p) => ({
    id: `page:${p.href}`,
    label: p.label,
    group: "Pages",
    keywords: p.keywords,
    hint: p.hint,
    action: { type: "link", href: p.href },
  }));

  // The section ids on Terminal's Home (pages/Home.tsx).
  const sections: CommandItem[] = [
    { id: "about", label: "About", show: true },
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
