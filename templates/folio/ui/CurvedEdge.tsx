import type { CSSProperties } from "react";

// Curved section edge (guide §4.1 menu panel, §4.2 footer): a quadratic curve that bulges out of
// one edge of its (position: relative) host, filled with the host's colour. Static by default.
// The path is `M… Q…` with the control point at twice the depth, so a later tween (footer
// flattening on scroll, the menu panel morph in 1.2) only has to move that one number.
//
// The SVG is absolutely positioned outside the host, so it paints over the next section as long
// as that section is not itself positioned later in the DOM; give the host `relative z-[1]` if
// it is.

type Edge = "top" | "bottom" | "left" | "right";

const PATHS: Record<Edge, string> = {
  bottom: "M0 0H100Q50 200 0 0Z",
  top: "M0 100H100Q50 -100 0 100Z",
  left: "M100 0V100Q-100 50 100 0Z",
  right: "M0 0V100Q200 50 0 0Z",
};

const PLACEMENT: Record<Edge, string> = {
  bottom: "left-0 top-[calc(100%_-_1px)] w-full",
  top: "left-0 bottom-[calc(100%_-_1px)] w-full",
  left: "top-0 right-[calc(100%_-_1px)] h-full",
  right: "top-0 left-[calc(100%_-_1px)] h-full",
};

/** Guide §4.2: 7svh on phone, 12svh from md. */
const DEFAULT_DEPTH: Record<Edge, string> = {
  bottom: "h-[7svh] md:h-[12svh]",
  top: "h-[7svh] md:h-[12svh]",
  left: "w-[12vw] md:w-24",
  right: "w-[12vw] md:w-24",
};

type CurvedEdgeProps = {
  edge: Edge;
  /** Any CSS colour; usually the host's surface, e.g. "var(--paper)". */
  fill: string;
  /** Overrides the default depth (height for top/bottom, width for left/right), e.g. "4rem". */
  depth?: string;
  className?: string;
};

export function CurvedEdge({ edge, fill, depth, className }: CurvedEdgeProps) {
  const vertical = edge === "top" || edge === "bottom";
  const style: CSSProperties = { fill, ...(depth ? (vertical ? { height: depth } : { width: depth }) : null) };

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={`pointer-events-none absolute ${PLACEMENT[edge]} ${depth ? "" : DEFAULT_DEPTH[edge]} ${className ?? ""}`}
      style={style}
    >
      <path d={PATHS[edge]} />
    </svg>
  );
}
