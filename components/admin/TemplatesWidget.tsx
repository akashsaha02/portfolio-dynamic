import type { WidgetServerProps } from "payload";
import { TEMPLATE_IDS, TEMPLATE_META, toActivatableTemplateId } from "@/templates/types";
import { ActivateTemplateButton } from "./ActivateTemplateButton";

/**
 * Dashboard widget: every template, which one is live, Preview (opens the site in a new tab with
 * that template, for this admin only: /api/template-preview) and Activate (Server Action,
 * lib/admin/template.ts). Work plan 6.4.
 */
export async function TemplatesWidget({ req }: WidgetServerProps) {
  if (req.user?.collection !== "users") return null;

  const settings = await req.payload.findGlobal({
    slug: "site-settings",
    depth: 0,
    select: { activeTemplate: true },
    req,
    overrideAccess: false,
  });
  const active = toActivatableTemplateId(settings.activeTemplate);

  return (
    <section className="card ak-widget" aria-labelledby="ak-templates-title">
      <header className="ak-widget__head">
        <h2 id="ak-templates-title" className="ak-widget__title">
          Templates
        </h2>
      </header>
      <ul className="ak-templates">
        {TEMPLATE_IDS.map((id) => {
          const meta = TEMPLATE_META[id];
          const isActive = id === active;
          const ready = meta.status === "current";
          const previewURL = `/api/template-preview?template=${encodeURIComponent(id)}&path=/`;
          return (
            <li key={id} className="ak-templates__item">
              <div className="ak-templates__text">
                <span className="ak-templates__name">
                  {meta.name}
                  {isActive ? <span className="ak-badge ak-badge--ok">Live</span> : null}
                  {!ready ? <span className="ak-badge">In progress</span> : null}
                </span>
                <span className="ak-templates__desc">{meta.description}</span>
              </div>
              <div className="ak-templates__actions">
                <a className="ak-button" href={previewURL} target="_blank" rel="noopener">
                  Preview<span className="ak-sr-only"> {meta.name} (opens in a new tab)</span>
                </a>
                {isActive ? null : <ActivateTemplateButton template={id} name={meta.name} disabled={!ready} />}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="ak-widget__note">
        Preview shows the site with that template and your drafts, only to you. Exit it from the banner at the bottom
        of the page.
      </p>
    </section>
  );
}
