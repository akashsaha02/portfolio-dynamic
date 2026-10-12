"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "./media";

type NameMarqueeProps = {
  /** e.g. "Akash Saha"; rendered uppercase with a trailing dash. */
  name: string;
  className?: string;
};

/**
 * The hero name marquee (guide §4.2, §6 NameMarquee). Two identical halves on one track; a CSS
 * animation (folio.css .f-marquee-track) slides the track by -50%, so it loops seamlessly and
 * drifts from first paint without any JS. Decorative: the page's real <h1> is sr-only.
 *
 * The enhancement below is a few lines of Web Animations API on that same CSS animation, no
 * GSAP: it eases the playback rate to +1 or -1 to follow the last scroll direction, and pauses
 * the loop while the hero is off-screen. With reduced motion the CSS animation is `none`, there
 * is nothing to drive, and the name sits still.
 */
export function NameMarquee({ name, className }: NameMarqueeProps) {
  const track = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const el = track.current;
    if (reducedMotion || !el) return;
    const anim = el.getAnimations()[0];
    if (!anim) return;

    // An infinite animation played backwards stops at time 0. Jump ahead by whole loops (same
    // phase, so nothing moves) to leave hours of runway in both directions.
    const loop = Number(anim.effect?.getComputedTiming().duration) || 0;
    const now = Number(anim.currentTime) || 0;
    if (loop > 0) anim.currentTime = (now % loop) + loop * 1000;

    let direction = 1;
    let rate = 1;
    let lastY = window.scrollY;
    let frame = 0;

    const ease = () => {
      rate += (direction - rate) * 0.08;
      if (Math.abs(direction - rate) < 0.01) rate = direction;
      anim.playbackRate = rate;
      frame = rate === direction ? 0 : requestAnimationFrame(ease);
    };

    const onScroll = () => {
      const y = window.scrollY;
      const next = y > lastY ? 1 : y < lastY ? -1 : direction;
      lastY = y;
      if (next === direction) return;
      direction = next;
      if (!frame) frame = requestAnimationFrame(ease);
    };

    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) anim.play();
      else anim.pause();
    });
    io.observe(el);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
      anim.playbackRate = 1;
      anim.play();
    };
  }, [reducedMotion]);

  // Each half says the name three times (~16em): a half narrower than the viewport would show a
  // gap as it loops, and at 17vw, or on a short landscape phone, one name is less than that.
  const half = <span>{`${name} — ${name} — ${name} —`}</span>;

  return (
    <div aria-hidden="true" className={`f-marquee type-marquee ${className ?? ""}`}>
      <div ref={track} className="f-marquee-track">
        {half}
        {half}
      </div>
    </div>
  );
}
