// "How this was built" notes (work plan 6.6, guide §12, after Maria Vasilyeva). Off by default;
// the footer switch and ⌘K turn them on, the choice is kept in localStorage, and CSS reveals the
// notes (folio.css .f-note): while off they are display:none, so screen readers skip them too.
//
// Every note must stay true about this codebase. When the thing it describes changes, change the
// note in the same commit. Sources are named next to each one.

/** Set on <html> while the notes are shown. */
export const ANNOTATIONS_ATTR = "data-annotations";

/** localStorage key; the value is "on" or absent. */
export const ANNOTATIONS_KEY = "folio:annotations";

/** Window event that flips the notes (the command menu dispatches it). */
export const ANNOTATIONS_TOGGLE_EVENT = "folio:annotations-toggle";

/** Runs before first paint on full loads, so a reader who left the notes on never sees a jump. */
export const ANNOTATIONS_INIT_SCRIPT = `try{localStorage.getItem("${ANNOTATIONS_KEY}")==="on"&&document.documentElement.setAttribute("${ANNOTATIONS_ATTR}","")}catch(e){}`;

export const NOTES = {
  // motion/NameMarquee.tsx, folio.css .f-marquee
  marquee:
    "The name is two copies on one track that a CSS animation slides by half its width, so it loops from first paint with no JS. A few lines of Web Animations API then ease its playback rate to follow your scroll direction and pause it off-screen. mix-blend-mode: difference keeps it readable over the portrait.",

  // ui/CurvedEdge.tsx, folio.css .f-footer-curve
  footerCurve:
    "This curve is one SVG quadratic whose ends sit on the footer's edge, so scaling it only moves the control point. A scroll-driven CSS animation (animation-timeline: view()) flattens it as the footer rises; browsers without scroll timelines keep the static curve.",

  // ui/CurvedEdge.tsx, folio.css .f-menu-curve
  menuCurve:
    "The panel's curved edge is the same SVG trick: a CSS transform transition scales it towards the panel, so it bows while the panel slides and flattens as it settles. Same easing and duration as the slide, and it holds still with reduced motion.",

  // motion/ProjectHoverModal.tsx, motion/load-gsap.ts
  hoverModal:
    "Hover a row: the cover follows the cursor on three layers that trail at different speeds (GSAP quickTo, 0.8, 0.5 and 0.45 s). Only with a mouse or trackpad and motion allowed, and nothing loads until the first hover: GSAP comes in through a dynamic import, never in the first load.",

  // shell/FolioShell.tsx, shell/PageCurtain.tsx, transitions.css
  pageTransitions:
    "Links between pages run as React Transitions, so each page's <ViewTransition> animates: an ink curtain with the next page's name rises and lifts in 700 ms, all CSS on the view-transition pseudo-elements. Never on the first load; an instant swap with reduced motion or without browser support.",

  // lib/actions/contact.ts, lib/rate-limit.ts, lib/turnstile.ts
  contactPipeline:
    "Sending runs a Server Action: validate every field, a hidden honeypot field, Cloudflare Turnstile, a rate limit per hashed IP (5 an hour, 20 a day, kept in MongoDB), then the message is saved to the inbox in the Payload admin, and the email goes out through Resend after you get the reply.",

  // lib/data.ts, lib/payload/revalidate.ts, lib/cache-tags.ts
  content:
    "Everything on these pages is edited in a Payload admin at /admin. Pages are prerendered and the content reads are cached under tags; saving in the admin calls revalidateTag, so the change goes live on the next visits without a rebuild.",

  // components/shared/CommandMenu.tsx
  commandMenu:
    "Press ⌘K or Ctrl+K. Only the shortcut listener ships with the page; the menu itself is fetched with a dynamic import the first time it opens.",

  // components/shared/lab/TomatoClassifier.tsx (work plan 6.7). Placeholder: the ML lab task
  // replaces the component; check this text against it before the Lab page links here.
  lab: "The classifier runs entirely in your browser: the model files are served from this site and the photo you pick is never uploaded.",
} as const;

export type NoteId = keyof typeof NOTES;
