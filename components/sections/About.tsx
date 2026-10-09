"use client";

import { useEffect, useRef } from "react";
import { profile } from "@/lib/content";

export function About() {
  const ref = useRef<HTMLParagraphElement>(null);

  // GSAP loads after first paint (guide §5 rule 11), so the words start fully visible and only
  // dim once the scroll reveal is ready.
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cancelled = false;
    let revert: (() => void) | undefined;

    Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      const ctx = gsap.context(() => {
        gsap.fromTo(
          ".word",
          { opacity: 0.16 },
          {
            opacity: 1,
            ease: "none",
            stagger: 0.08,
            scrollTrigger: { trigger: el, start: "top 78%", end: "bottom 50%", scrub: 0.4 },
          },
        );
      }, el);
      revert = () => ctx.revert();
    });

    return () => {
      cancelled = true;
      revert?.();
    };
  }, []);

  return (
    <section id="about" aria-label="About me" className="px-5 pb-24 pt-28 md:px-10 md:pb-36 md:pt-44">
      <p
        ref={ref}
        className="max-w-[32ch] text-[clamp(1.85rem,4.2vw,3.9rem)] font-semibold leading-[1.05] tracking-[-0.02em] [font-variation-settings:'wdth'_88]"
      >
        {profile.about.split(" ").map((w, i) => (
          <span key={i} className="word">
            {w}{" "}
          </span>
        ))}
      </p>
    </section>
  );
}
