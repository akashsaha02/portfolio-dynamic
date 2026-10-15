// Shared renderer for the generated Open Graph images (app/(site)/**/opengraph-image.tsx).
//
// Uses next/og's bundled default font (Geist Regular), so rendering never needs the network.
// Colours mirror the Folio tokens in app/globals.css (paper, ink, lime); keep them in sync.

import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const PAPER = "#ebeee0";
const INK = "#282c20";
const LIME = "#d2ff00";

export function renderOgImage({
  eyebrow,
  title,
  subtitle,
  footer,
}: {
  /** Small label above the title, e.g. "Case study". */
  eyebrow: string;
  title: string;
  subtitle: string;
  /** Bottom line, e.g. "Akash Saha · Full-stack developer". */
  footer: string;
}): ImageResponse {
  // Long project names shrink so they stay on two lines at most.
  const titleSize = title.length > 28 ? 88 : title.length > 18 ? 112 : 136;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: PAPER,
          color: INK,
          padding: "72px 80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 30 }}>
          <div style={{ width: 28, height: 28, borderRadius: 999, background: LIME, border: `3px solid ${INK}` }} />
          <div style={{ display: "flex" }}>{eyebrow}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", fontSize: titleSize, lineHeight: 1, letterSpacing: -4 }}>{title}</div>
          <div style={{ display: "flex", fontSize: 40, opacity: 0.75 }}>{subtitle}</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 28 }}>
          <div style={{ display: "flex" }}>{footer}</div>
          <div style={{ display: "flex", width: 160, height: 16, borderRadius: 999, background: LIME }} />
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
