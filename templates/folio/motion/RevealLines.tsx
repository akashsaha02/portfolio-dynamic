"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "./media";

type RevealLinesProps = {
  text: string;
  className?: string;
};

/**
 * Line-by-line reveal (guide §6 RevealLines): every word rises out of its own clip, and the words
 * of one line rise together, a short stagger after the line above. CSS transitions do the motion
 * (folio.css .f-reveal); this component only decides when.
 *
 * Start visible, enhance: the server renders the words in place. After hydration, and only if
 * the block is still entirely below the fold, it is "armed" (words tucked below their clips),
 * then revealed when it scrolls into view. Without JS, with reduced motion, or when the block is
 * already on screen (a reload halfway down), nothing is ever hidden. Screen readers get the
 * sentence once, from the sr-only copy; the split words are aria-hidden.
 */
export function RevealLines({ text, className }: RevealLinesProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const words = text.split(/\s+/).filter(Boolean);

  useEffect(() => {
    const el = ref.current;
    if (reducedMotion || !el) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return;

    el.setAttribute("data-armed", "");
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        // Group by line now, after fonts and layout have settled. Transforms don't move offsetTop.
        let line = -1;
        let top = Number.NEGATIVE_INFINITY;
        for (const w of el.querySelectorAll<HTMLElement>(".f-w")) {
          if (w.offsetTop > top + 2) {
            line += 1;
            top = w.offsetTop;
          }
          w.style.setProperty("--l", String(line));
        }
        el.setAttribute("data-in", "");
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      el.removeAttribute("data-armed");
      el.removeAttribute("data-in");
    };
  }, [reducedMotion]);

  return (
    <p ref={ref} className={`f-reveal ${className ?? ""}`}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((w, i) => (
          <span key={i}>
            <span className="f-w">
              <span>{w}</span>
            </span>
            {i < words.length - 1 ? " " : null}
          </span>
        ))}
      </span>
    </p>
  );
}
