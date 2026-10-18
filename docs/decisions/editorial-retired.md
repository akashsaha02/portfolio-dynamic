# Decision: Editorial retired (work plan 5.2)

Date: 2026-10-18.

The v1 "Editorial" design is no longer part of the live site. Folio is the only template. Editorial
is archived at git tag `v1-editorial` (work plan 6.3 builds the version archive from it).

- Code: `templates/editorial/`, `components/hero/`, `components/sections/`, `Nav`, `SmoothScroll`
  and `ArrowIcon` are deleted; `TEMPLATE_IDS` is `["folio"]`; the registry imports Folio statically.
- Why: both templates shared one route graph, so Editorial's client chunk shipped on every Folio
  route; Editorial also blocked `cacheComponents` (see `cache-components.md`).
- Stored values: a database `activeTemplate: "editorial"` reads as `folio` (field hooks in
  `globals/SiteSettings.ts`, and `lib/payload/map.ts`). `SITE_TEMPLATE=editorial` builds as `folio`
  with a warning; unset means `folio`; any other unknown value fails the build.
- Dropped dependencies: `lenis`, `@gsap/react` (only Editorial used them). `gsap` stays (Folio's
  lazy loader, `templates/folio/motion/load-gsap.ts`).
