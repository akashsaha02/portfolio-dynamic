import type { Metadata, Viewport } from "next";
import { Mona_Sans, Mrs_Saint_Delafield } from "next/font/google";
import { SmoothScroll } from "@/components/SmoothScroll";
import "./globals.css";

const mona = Mona_Sans({
  variable: "--font-mona",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

// Only used for the signature in the hero.
const signature = Mrs_Saint_Delafield({
  variable: "--font-signature",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  preload: false,
});

const description =
  "Akash Saha is a full-stack developer in Dhaka building SaaS products with MongoDB, Express, React and Node, with published research in deep learning.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Akash Saha, full-stack developer",
  description,
  openGraph: {
    title: "Akash Saha, full-stack developer",
    description,
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#ebeee0",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${mona.variable} ${signature.variable} antialiased`}>
      <body>
        <a
          href="#main"
          className="fixed left-4 top-4 z-50 -translate-y-24 rounded-full bg-lime px-4 py-2 font-semibold text-ink focus:translate-y-0"
        >
          Skip to content
        </a>
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
