# Decision: Editorial stays static (ignores its props)

Date: 2026-10-18. Recorded by backend. Applies from Phase 3 (Payload live).

Editorial is the legacy template: its components read `lib/content.ts` directly and ignore the `SiteContent`/settings props, so only Folio reflects edits made in the admin. Selecting Editorial in `site-settings` shows the static copy, not the database. It is not brought onto the template contract: it leaves the live registry in task 5.2 and lives on, read-only and static, in the version archive (task 6.3).
