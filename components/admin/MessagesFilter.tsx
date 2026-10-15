import type { BeforeListTableServerProps } from "payload";
import { formatAdminURL } from "payload/shared";

/**
 * "Unread / All" switch above the messages table: Payload's filter builder is fiddly on a phone.
 * Plain links (full navigation) so the list's own query state can't get out of sync.
 */
export function MessagesFilter({ payload, searchParams }: BeforeListTableServerProps) {
  const base = formatAdminURL({ adminRoute: payload.config.routes.admin, path: "/collections/messages" });
  // Raw Next search params keep the bracketed key; accept a parsed (nested) shape too.
  const params = (searchParams ?? {}) as Record<string, unknown>;
  const nested = params.where as { read?: { equals?: unknown } } | undefined;
  const unreadOnly = String(params["where[read][equals]"] ?? nested?.read?.equals) === "false";

  return (
    <nav className="ak-filter" aria-label="Show">
      <a className="ak-filter__btn" href={`${base}?where[read][equals]=false`} aria-current={unreadOnly ? "page" : undefined}>
        Unread
      </a>
      <a className="ak-filter__btn" href={base} aria-current={unreadOnly ? undefined : "page"}>
        All
      </a>
    </nav>
  );
}
