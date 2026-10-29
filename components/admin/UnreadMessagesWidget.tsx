import Link from "next/link";
import type { WidgetServerProps } from "payload";
import { formatAdminURL } from "payload/shared";
import { CONTACT_INTENT_LABELS, type ContactIntent } from "@/lib/contact";
import { timeAgo } from "./time";

/** Dashboard widget: unread contact messages, newest first (work plan 2.6). The first thing to check. */
export async function UnreadMessagesWidget({ req }: WidgetServerProps) {
  const adminRoute = req.payload.config.routes.admin;
  // Runs as the signed-in admin: `messages` is admin-read-only, so a stray render can't leak it.
  const { docs, totalDocs } = await req.payload.find({
    collection: "messages",
    where: { read: { equals: false } },
    sort: "-createdAt",
    limit: 3,
    depth: 0,
    select: { name: true, intent: true, createdAt: true },
    req,
    overrideAccess: false,
  });

  const unreadURL = formatAdminURL({ adminRoute, path: "/collections/messages?where[read][equals]=false" });
  const allURL = formatAdminURL({ adminRoute, path: "/collections/messages" });
  const more = totalDocs - docs.length;

  return (
    <section className="card ak-widget ak-inbox" aria-labelledby="ak-unread-title">
      <header className="ak-widget__head">
        <h2 id="ak-unread-title" className="ak-widget__title">
          Inbox
        </h2>
      </header>

      {/* The figure leads: how many people are waiting for a reply. */}
      <p className="ak-figure" data-tone={totalDocs > 0 ? "attention" : "calm"}>
        <span className="ak-figure__value">{totalDocs}</span>
        <span className="ak-figure__label">unread</span>
      </p>

      {docs.length === 0 ? (
        <p className="ak-widget__empty">Nothing new. Messages from the contact form land here.</p>
      ) : (
        <ul className="ak-rows">
          {docs.map((message) => (
            <li key={message.id}>
              <Link className="ak-row" href={formatAdminURL({ adminRoute, path: `/collections/messages/${message.id}` })}>
                <span className="ak-row__dot" aria-hidden="true" />
                <span className="ak-row__text">
                  <span className="ak-row__title">{message.name}</span>
                  <span className="ak-row__meta">
                    {CONTACT_INTENT_LABELS[message.intent as ContactIntent] ?? message.intent}
                    {" · "}
                    <time dateTime={message.createdAt}>{timeAgo(message.createdAt)}</time>
                  </span>
                </span>
                <span className="ak-row__arrow" aria-hidden="true">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <footer className="ak-widget__foot">
        {totalDocs > 0 ? <Link href={unreadURL}>{more > 0 ? `All ${totalDocs} unread` : "All unread"}</Link> : null}
        <Link href={allURL}>All messages</Link>
      </footer>
    </section>
  );
}
