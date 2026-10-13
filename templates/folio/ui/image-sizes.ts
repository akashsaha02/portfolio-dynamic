// `sizes` capped at what the source can give (guide §9.2, QA F-11).
//
// Every distinct (source, w) the optimizer serves is one transformation on the free tier. For a
// source narrower than the widest layout, a high-density screen asks for w=1280 or w=1600 and gets
// the same pixels as w=1080: duplicate cache entries. capSizes() puts density-scoped entries in
// front of the layout's own `sizes`, so on a 1.5x, 2x or 3x screen the browser's pick tops out at
// the first ladder width that covers the source (1080 for the 1024 px portrait, 640 for the 560 px
// phone shot). 1x screens keep the layout's sizes. A browser may still pick one step lower; that
// is a real downscale, not a duplicate.

/** next.config.ts `images.imageSizes` + `deviceSizes`, ascending. Keep in step with it. */
const LADDER = [256, 384, 640, 828, 1080, 1280, 1600];

/** Density tiers: the media condition and the highest density it is sized for. */
const TIERS: [query: string, density: number][] = [
  ["(min-resolution: 2.5dppx)", 3],
  ["(min-resolution: 1.75dppx)", 2],
  ["(min-resolution: 1.25dppx)", 1.5],
];

/**
 * @param sourceWidth intrinsic width of the source image, in px
 * @param layoutSizes the honest `sizes` for the layout, e.g. "(min-width: 768px) 40vw, 100vw"
 */
export function capSizes(sourceWidth: number, layoutSizes: string): string {
  const cap = LADDER.find((w) => w >= sourceWidth);
  if (cap === undefined) return layoutSizes;
  const tiers = TIERS.map(([query, density]) => `${query} ${Math.floor(cap / density)}px`);
  return [...tiers, layoutSizes].join(", ");
}
