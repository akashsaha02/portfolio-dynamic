const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

const STEPS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ["minute", 60],
  ["hour", 60],
  ["day", 24],
  ["week", 7],
  ["month", 4.35],
  ["year", 12],
];

/**
 * "5 minutes ago", "yesterday". Relative, so it reads the same whatever the server's time zone
 * (UTC on Vercel); the exact time is in the `<time dateTime>` next to it.
 */
export function timeAgo(iso: string, now: number = Date.now()): string {
  let value = (new Date(iso).getTime() - now) / 1000;
  if (!Number.isFinite(value)) return "";
  if (Math.abs(value) < 60) return "just now";
  value /= 60;
  for (let i = 1; i < STEPS.length; i++) {
    const [, size] = STEPS[i];
    if (Math.abs(value) < size) return relative.format(Math.round(value), STEPS[i - 1][0]);
    value /= size;
  }
  return relative.format(Math.round(value), "year");
}
