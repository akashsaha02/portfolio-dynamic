// Folio's few icons. All decorative (aria-hidden); the control around them carries the label.

type IconProps = { className?: string };

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/** ↗ external / "open" arrow. */
export function ArrowUpRight({ className = "size-4" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" className={className} {...stroke}>
      <path d="M4.5 11.5 11.5 4.5M5.5 4.5h6v6" />
    </svg>
  );
}

/** ↘ the hero role arrow. */
export function ArrowDownRight({ className = "size-4" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" className={className} {...stroke}>
      <path d="M4.5 4.5 11.5 11.5M11.5 5.5v6h-6" />
    </svg>
  );
}

/** Two-line burger for the fixed menu button. */
export function Burger({ className = "w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 10" aria-hidden="true" focusable="false" className={className} {...stroke}>
      <path d="M1 1h22M1 9h22" />
    </svg>
  );
}
