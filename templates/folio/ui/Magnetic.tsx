"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useFinePointer, usePrefersReducedMotion } from "../motion/media";
import { loadGsap, onIdle } from "../motion/load-gsap";

type MagneticProps = {
  children: ReactNode;
  /** Share of the pointer's offset from the centre that the child follows. */
  strength?: number;
  className?: string;
};

/**
 * Pulls its child towards the pointer while hovered and springs back on leave (guide §6).
 * Fine pointer only: on touch, with reduced motion and on the server it renders a plain wrapper
 * and never loads GSAP. GSAP itself is fetched when the page is idle, or on first hover if that
 * comes sooner.
 */
export function Magnetic({ children, strength = 0.35, className }: MagneticProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const finePointer = useFinePointer();
  const reducedMotion = usePrefersReducedMotion();
  const enabled = finePointer && !reducedMotion;

  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;

    let cancelled = false;
    let started = false;
    let revert: (() => void) | undefined;
    let xTo: ((value: number) => void) | undefined;
    let yTo: ((value: number) => void) | undefined;

    const start = () => {
      if (started) return;
      started = true;
      el.removeEventListener("pointerenter", start);
      loadGsap().then((gsap) => {
        if (cancelled) return;
        const ctx = gsap.context(() => {
          const spring = { duration: 1, ease: "elastic.out(1, 0.3)" };
          xTo = gsap.quickTo(el, "x", spring);
          yTo = gsap.quickTo(el, "y", spring);
        }, el);
        revert = () => ctx.revert();
      });
    };

    const onMove = (e: PointerEvent) => {
      if (!xTo || !yTo) return;
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * strength);
      yTo((e.clientY - (r.top + r.height / 2)) * strength);
    };
    const onLeave = () => {
      xTo?.(0);
      yTo?.(0);
    };

    const cancelIdle = onIdle(start);
    el.addEventListener("pointerenter", start);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);

    return () => {
      cancelled = true;
      cancelIdle();
      el.removeEventListener("pointerenter", start);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      revert?.();
    };
  }, [enabled, strength]);

  return (
    <span ref={ref} className={`inline-flex ${className ?? ""}`}>
      {children}
    </span>
  );
}
