import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Lets the Editorial and Folio e2e builds sit side by side (e.g. NEXT_DIST_DIR=.next-folio).
  // `next build` and `next start` must see the same value. Must stay inside the project.
  distDir: process.env.NEXT_DIST_DIR || ".next",

  // Vercel Hobby allows 5,000 image transformations a month (guide §9.2). Each distinct
  // (source, w, q, format) is one transformation, cached up to 31 days and kept across
  // redeploys, so the budget is roughly: images x allowed widths x qualities x formats.
  images: {
    // No component passes `quality`, so everything uses the default 75. A `quality` prop would be
    // coerced to 75; any other `q` in a hand-made /_next/image URL gets a 400.
    qualities: [75],
    // Our largest sources are 1600 px (screenshots); the portrait is 1024 and the phone shot 560.
    // A wider variant would re-encode the same pixels, so the list stops at 1600. Picks for real
    // layouts: phones 360-414 @2-3x -> 828 / 1080 / 1280; tablet 768 / 1024 @2x -> 828-1600;
    // desktop 1440 @1x -> 828, @2x -> 1600. Defaults were 640 ... 3840 (8 widths).
    deviceSizes: [640, 828, 1080, 1280, 1600],
    // Only the editorial phone mockup is narrower than a phone (~190-400 px). 32-128 were never
    // requested. Defaults were 32, 48, 64, 96, 128, 256, 384.
    imageSizes: [256, 384],
    // Sources in public/ are versioned by filename (rename to change), and Payload/Blob uploads
    // get new URLs, so a long TTL is safe: 31 days, Vercel's maximum. Default is 4 hours.
    minimumCacheTTL: 2678400,
    // WebP only (the Next 16 default, stated so nobody flips it casually). Vercel keys the cache
    // on the Accept header, so adding AVIF would roughly double transformations for ~20% smaller
    // files on sources that are already small WebP.
    formats: ["image/webp"],
    // Any local path, but no query string: otherwise `?v=1`, `?v=2`, ... each counts as a new
    // source and could burn the monthly budget. Add remotePatterns when Payload media goes to Blob.
    localPatterns: [{ pathname: "/**", search: "" }],
  },
};

export default nextConfig;
