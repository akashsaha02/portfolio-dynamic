import type { ReactNode } from "react";
import { Action, RollLabel, type ActionProps } from "./Action";

// Pill button (guide §4.1 "Buttons", §6 FillButton); RoundButton.tsx is the circle variant.
// Pure CSS, Server Component: the lime ellipse rises from the bottom and the label rolls on
// hover (fine pointer only), every pointer gets the .96 tap scale. Colours come from the surface
// (`surface-paper` / `-ink` / `-lime`). Wrap in <Magnetic> for the desktop pull.

export type Variant = "solid" | "outline";

type FillButtonOwnProps = {
  variant?: Variant;
  size?: "md" | "lg";
  /** Full width (stacked footer pills on phone). */
  block?: boolean;
  /** Trailing icon, e.g. an arrow. Decorative. */
  icon?: ReactNode;
};

export type FillButtonProps = ActionProps & FillButtonOwnProps;

const PILL_SIZES = {
  md: "min-h-12 px-6 text-base",
  lg: "min-h-14 px-7 text-base md:min-h-16 md:px-9 md:text-lg",
} as const;

export function FillButton({
  variant = "solid",
  size = "md",
  block = false,
  icon,
  className,
  children,
  ...action
}: FillButtonProps) {
  const classes = [
    "f-btn f-roll-host",
    `f-btn-${variant}`,
    PILL_SIZES[size],
    block ? "flex w-full" : "",
    className ?? "",
  ].join(" ");

  return (
    <Action {...(action as ActionProps)} className={classes}>
      <RollLabel>{children}</RollLabel>
      {icon ? (
        <span aria-hidden="true" className="flex">
          {icon}
        </span>
      ) : null}
    </Action>
  );
}
