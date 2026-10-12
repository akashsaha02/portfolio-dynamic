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

/** × for the menu panel's close button. */
export function Close({ className = "w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false" className={className} {...stroke}>
      <path d="M3 3l14 14M17 3 3 17" />
    </svg>
  );
}

/**
 * Globe for the hero's location pill. Three front-half meridians sweep across with scaleX
 * (folio.css .f-globe), which reads as the globe turning; static with reduced motion.
 */
export function Globe({ className = "size-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={`f-globe ${className}`} {...stroke}>
      <circle cx="12" cy="12" r="9.25" />
      <path d="M3 9h18M3 15h18" />
      <path className="f-globe-m" d="M12 2.75a9.25 9.25 0 0 1 0 18.5" />
      <path className="f-globe-m" d="M12 2.75a9.25 9.25 0 0 1 0 18.5" />
      <path className="f-globe-m" d="M12 2.75a9.25 9.25 0 0 1 0 18.5" />
    </svg>
  );
}

/** Two sheets: "tap to copy". */
export function CopyIcon({ className = "size-4" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" className={className} {...stroke}>
      <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
      <path d="M10.5 3.5v-.5a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h.5" />
    </svg>
  );
}

/** ✓ for "Copied". */
export function Check({ className = "size-4" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" className={className} {...stroke}>
      <path d="M3 8.5 6.5 12 13 4.5" />
    </svg>
  );
}
