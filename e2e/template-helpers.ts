import type { Page } from "@playwright/test";
import { waitForHydration } from "./folio-helpers";

// Shared by the generic template specs (tpl-*.spec.ts), which run once per template project
// ("<id>-phone", "<id>-desktop") from playwright.templates.config.ts.

export const TEMPLATE_IDS = ["bento", "brutal", "terminal"] as const;
export type TplId = (typeof TEMPLATE_IDS)[number];

/** The template a project belongs to: "bento-phone" -> "bento". */
export function tplOf(projectName: string): TplId {
  const id = projectName.replace(/-(phone|desktop|phone-large)$/, "");
  if (!(TEMPLATE_IDS as readonly string[]).includes(id)) throw new Error(`Not a template project: ${projectName}`);
  return id as TplId;
}

export const ROUTES = [
  "/",
  "/work",
  "/work/abroadly",
  "/work/nook",
  "/about",
  "/contact",
  "/archive",
  "/lab",
  "/v",
] as const;

export async function load(page: Page, url: string) {
  const res = await page.goto(url);
  await waitForHydration(page);
  return res;
}

/** Visible interactive elements smaller than 44x44 (skip link, honeypot and sr-only text excluded). */
export async function smallTargets(page: Page) {
  return page.evaluate(() => {
    const out: string[] = [];
    const sel = "a[href], button, input:not([type=hidden]), textarea, select, summary, [role=button]";
    for (const el of document.querySelectorAll<HTMLElement>(sel)) {
      if (el.closest('[aria-hidden="true"], [inert], dialog:not([open])')) continue;
      if (el.matches("a[href^='#main']") || el.closest(".sr-only")) continue;
      const style = getComputedStyle(el);
      if (style.visibility === "hidden" || style.display === "none") continue;
      // Radios and checkboxes are covered by their 44px label.
      let target: HTMLElement =
        el instanceof HTMLInputElement && /radio|checkbox/.test(el.type) ? (el.closest("label") ?? el) : el;
      // Stretched card links: the ::after pseudo covers the positioned card, which is the real target.
      if (getComputedStyle(el, "::after").position === "absolute" && el.offsetParent instanceof HTMLElement) {
        target = el.offsetParent;
      }
      const r = target.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.width < 43.5 || r.height < 43.5) {
        out.push(
          `${el.tagName.toLowerCase()} "${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 30)}" ${Math.round(r.width)}x${Math.round(r.height)}`,
        );
      }
    }
    return out;
  });
}
