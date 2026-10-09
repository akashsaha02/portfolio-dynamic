import { Action, RollLabel, type ActionProps } from "./Action";
import type { Variant } from "./FillButton";

// Circle variant of FillButton: same fill, roll and tap scale. Icon-only uses (the 56px burger)
// need an aria-label.

type RoundButtonOwnProps = {
  variant?: Variant;
  /** sm 56px (burger), md 120 → 160px ("About me"), lg 144 → 208px ("Get in touch"). */
  size?: "sm" | "md" | "lg";
};

export type RoundButtonProps = ActionProps & RoundButtonOwnProps;

const ROUND_SIZES = {
  sm: "size-14 text-sm",
  md: "size-30 text-base md:size-40 md:text-lg",
  lg: "size-36 text-lg md:size-44 lg:size-52 lg:text-xl",
} as const;

export function RoundButton({
  variant = "solid",
  size = "md",
  className,
  children,
  ...action
}: RoundButtonProps) {
  const classes = ["f-btn f-roll-host shrink-0", `f-btn-${variant}`, ROUND_SIZES[size], className ?? ""].join(" ");

  return (
    <Action {...(action as ActionProps)} className={classes}>
      <RollLabel>{children}</RollLabel>
    </Action>
  );
}
