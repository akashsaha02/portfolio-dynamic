import type { Metadata, Viewport } from "next";
import { Mona_Sans } from "next/font/google";
import { PreviewBanner } from "@/components/shared/PreviewBanner";
import { getSiteContent } from "@/lib/data";
import { siteUrl } from "@/lib/seo";
import "../globals.css";

// Root layout for the public site. Payload adds its own root layout in app/(payload)/ (work
// plan 2.2), which is why this is a route group and there is no app/layout.tsx.
// Template-specific chrome (smooth scroll, extra fonts) belongs in the template, not here.

const mona = Mona_Sans({
  variable: "--font-mona",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const { profile, site } = await getSiteContent();
  const { title, description } = site.seo;

  return {
    metadataBase: siteUrl(),
    title: { default: title, template: `%s · ${profile.name}` },
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: { card: "summary_large_image" },
  };
}

export const viewport: Viewport = {
  themeColor: "#ebeee0",
};

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${mona.variable} antialiased`}>
      <body>
        {/* min-h-11: 44px hit area (guide §5); flex centres the label. -translate-y-24 (96px)
            still clears top-4 + 44px, so it stays fully off-screen until focused. */}
        <a
          href="#main"
          className="fixed left-4 top-4 z-50 inline-flex min-h-11 -translate-y-24 items-center justify-center rounded-full bg-lime px-4 py-2 font-semibold text-ink focus:translate-y-0"
        >
          Skip to content
        </a>
        {children}
        {/* Draft mode only (work plan 3.4); renders nothing for visitors. */}
        <PreviewBanner />
      </body>
    </html>
  );
}
