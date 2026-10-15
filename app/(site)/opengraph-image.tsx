import { getSiteContent } from "@/lib/data";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og-image";

// Default share image for every (site) page without its own (work plan 2.7). Static: generated at
// build time from SiteContent.

export const alt = "Title card with the site owner’s name and role";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function OpenGraphImage() {
  const { profile } = await getSiteContent();
  return renderOgImage({
    eyebrow: "Portfolio",
    title: profile.name,
    subtitle: profile.headline,
    footer: `${profile.role} · ${profile.location}`,
  });
}
