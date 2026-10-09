import type { ButtonHTMLAttributes, ReactNode } from "react";

// Chips (guide §4.2 research status, §4.3 work filters). `Chip` is a static label; `ChipToggle` is
// a real <button> with aria-pressed and a 44px hit area. Neither relies on colour alone: the
// pressed state inverts the fill, and the label is always text.

type ChipProps = {
  children: ReactNode;
  /** `solid` is a small ink pill on paper (paper on ink); `outline` is a hairline pill. */
  variant?: "solid" | "outline";
  /** Leading status dot (lime on ink, ink on paper). */
  dot?: boolean;
  className?: string;
};

export function Chip({ children, variant = "outline", dot = false, className }: ChipProps) {
  return (
    <span className={`f-chip min-h-8 px-3 ${variant === "solid" ? "f-chip-solid" : ""} ${className ?? ""}`}>
      {dot ? <span aria-hidden="true" className="f-dot" /> : null}
      {children}
    </span>
  );
}

type ChipToggleProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-pressed" | "type"> & {
  pressed: boolean;
  children: ReactNode;
};

/** Filter chip. Render it from a Client Component that owns the state (and the `?type=` URL). */
export function ChipToggle({ pressed, children, className, ...button }: ChipToggleProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={`f-chip f-chip-toggle min-h-11 px-5 text-base ${className ?? ""}`}
      {...button}
    >
      {children}
    </button>
  );
}
