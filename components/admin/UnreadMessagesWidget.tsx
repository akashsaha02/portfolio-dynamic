import Link from "next/link";
import type { WidgetServerProps } from "payload";
import { formatAdminURL } from "payload/shared";
import { CONTACT_INTENT_LABELS, type ContactIntent } from "@/lib/contact";
import { timeAgo } from "./time";

/** Dashboard widget: unread contact messages, newest first (work plan 2.6). */
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

  return (
    <section className="card ak-widget" aria-labelledby="ak-unread-title">
      <header className="ak-widget__head">
        <h2 id="ak-unread-title" className="ak-widget__title">
          Inbox
        </h2>
        <span className={totalDocs > 0 ? "ak-badge ak-badge--alert" : "ak-badge"}>{totalDocs} unread</span>
      </header>

      {docs.length === 0 ? (
        <p className="ak-widget__empty">Nothing new. Messages from the contact form land here.</p>
      ) : (
        <ul className="ak-list">
          {docs.map((message) => (
            <li key={message.id}>
              <Link
                className="ak-list__row"
                href={formatAdminURL({ adminRoute, path: `/collections/messages/${message.id}` })}
              >
                <span className="ak-list__main">{message.name}</span>
                <span className="ak-list__meta">
                  {CONTACT_INTENT_LABELS[message.intent as ContactIntent] ?? message.intent}
                  {" · "}
                  <time dateTime={message.createdAt}>{timeAgo(message.createdAt)}</time>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <footer className="ak-widget__foot">
        {totalDocs > 0 ? <Link href={unreadURL}>All unread</Link> : null}
        <Link href={allURL}>All messages</Link>
      </footer>
    </section>
  );
}
