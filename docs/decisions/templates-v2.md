# Templates v2: Bento, Brutal, Terminal (2026-10-29)

Akash asked for more layouts after a look at what works for portfolios now. Three new templates join Folio (default) and Index; all render the same `SiteContent`, all are switchable and previewable from the admin.

## What the research says

- **Bento grids** (asymmetric cards of different sizes) are the most consistently recommended 2026 layout, especially for developer and tech portfolios; they work when content has a hierarchy (featured projects get the big cards). Motion should stay restrained. ([Line25](https://line25.com/articles/web-design-trends-2026/), [StudioMeyer](https://studiomeyer.io/en/blog/bento-grid-layouts), [StudioMeyer reality check](https://studiomeyer.io/en/blog/webdesign-trends-2026-reality-check), [B12](https://www.b12.io/resource-center/website-design/web-design-guide-bento-grids-and-kinetic-typography/))
- **Expressive brutalism and oversized, typography-led layouts** are the counter-trend among award-winning portfolios: thick borders, flat colour, deliberate anti-polish, softened by careful motion. ([Awwwards: brutalist typographic site](https://www.awwwards.com/inspiration/tim-grovers-brutalist-typographic-site), [Awwwards: brutalist portfolio](https://www.awwwards.com/inspiration/chrissie-abbott-portfolio-brutalism))
- **Recruiters** skim: 3–5 strong projects with links, clear contact, GitHub/LinkedIn and a résumé within reach; content and clarity beat effects. ([Proxify](https://proxify.io/knowledge-base/job-descriptions/what-makes-a-developer-portfolio-stand-out-to-recruiters), [BrainStation](https://brainstation.io/career-guides/how-to-build-a-software-engineer-portfolio), [Educative](https://www.educative.io/blog/how-to-get-hired-as-a-software-engineer))

These sources are mostly agency and career blogs: treat them as direction, not data.

## The three templates

| Id | Name | Direction |
| --- | --- | --- |
| `bento` | Bento (modern) | A grid of rounded cards of different sizes on a soft neutral background, light and dark (follows `prefers-color-scheme`). Home is one bento board: intro card, availability, featured projects as the large cards, experience, stack, research, "now", local time, contact. Calm hover lift; nothing moves on its own. |
| `brutal` | Brutal (stylised) | Neo-brutalism on the brand colours: paper, ink and lime as flat blocks, 3–4 px ink borders, hard offset shadows, oversized uppercase type, visible grid, sticker-like labels. Anti-polish but readable; motion limited to snappy press/hover offsets. |
| `terminal` | Terminal (other) | A developer's command line: monospace, dark, prompt-style headings (`akash@portfolio:~$ cat about.md`), navigation as commands, projects as `ls -l`-style rows, a blinking caret only where motion is allowed. Every piece of text stays real, selectable and readable by screen readers; no fake typing that hides content. |

## Shared rules

Every template provides every page (Home, Work, CaseStudy, About, Contact, NotFound, Archive, Lab, Versions), keeps the mobile-first rules (guide §5), and stays small, because every template's client code and CSS ship on every route: client JS ≤ 2.5 KB gz and CSS ≤ 3.5 KB gz per template, scoped under `.tpl-<id>`.
