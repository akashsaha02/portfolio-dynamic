// Pure display helpers shared by the data layer. No Next.js or React imports here, so they stay
// unit-testable and safe to use from templates too.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;

function parseMonth(value: string): { year: string; month: string } {
  const match = MONTH_PATTERN.exec(value);
  if (!match) throw new Error(`Expected a "YYYY-MM" month, got "${value}"`);
  return { year: match[1], month: MONTHS[Number(match[2]) - 1] };
}

/**
 * Formats a start/end month pair the way the site writes periods:
 * - current role:   "2025-11", null       → "Nov 2025 – now"
 * - same year:      "2025-07", "2025-10"  → "Jul – Oct 2025"
 * - across years:   "2024-08", "2025-05"  → "Aug 2024 – May 2025"
 * - same month:     "2024-03", "2024-03"  → "Mar 2024"
 */
export function formatPeriod(start: string, end: string | null): string {
  const from = parseMonth(start);
  if (end === null) return `${from.month} ${from.year} – now`;

  const to = parseMonth(end);
  if (start === end) return `${from.month} ${from.year}`;
  if (from.year === to.year) return `${from.month} – ${to.month} ${to.year}`;
  return `${from.month} ${from.year} – ${to.month} ${to.year}`;
}
