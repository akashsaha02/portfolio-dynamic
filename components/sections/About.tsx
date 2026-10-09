"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { profile } from "@/lib/content";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function About() {
  const ref = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          ".word",
          { opacity: 0.16 },
          {
            opacity: 1,
            ease: "none",
            stagger: 0.08,
            scrollTrigger: { trigger: ref.current, start: "top 78%", end: "bottom 50%", scrub: 0.4 },
          },
        );
      });
    },
    { scope: ref },
  );

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
