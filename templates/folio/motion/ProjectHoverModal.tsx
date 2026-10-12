"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import type { ImageAsset } from "@/lib/content-types";
import { loadGsap, onIdle } from "./load-gsap";
import { useFinePointer, usePrefersReducedMotion } from "./media";
import "../desktop-fx.css";

// Cursor-following project preview for hairline rows (guide §4.2 row 3, §6 ProjectHoverModal).
// Wrap a server-rendered <RowList> and pass one item per row, in the same order:
//
//   <ProjectHoverRows items={projects.map((p) => ({ name: p.name, cover: p.cover }))}>
//     <RowList>…<Row /> per project…</RowList>
//   </ProjectHoverRows>
//
// The hovered row is found from the pointer target (its <li>'s position in the list), so rows
// hidden by a filter keep their index. Three layers trail the pointer at different speeds (GSAP
// quickTo: card 0.8s, cursor 0.5s, label 0.45s) and scale in with --ease-inout; the card's strip
// of covers slides to the hovered project. Decoration only: aria-hidden, pointer-events none, and
// nothing shows for keyboard focus (rows get the focus highlight from desktop-fx.css instead).
//
// Fine pointer and motion allowed only: on touch, with reduced motion and on the server the
// wrapper renders just its children. The modal mounts (and its covers load) on the first hover
// of the rows or when the page is idle; GSAP arrives through the lazy loader at the same time.

type Item = { name: string; cover?: ImageAsset };

type ProjectHoverRowsProps = {
  items: Item[];
  children: ReactNode;
  className?: string;
};

type Setter = (value: number) => void;

export function ProjectHoverRows({ items, children, className }: ProjectHoverRowsProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const finePointer = useFinePointer();
  const reducedMotion = usePrefersReducedMotion();
  const enabled = finePointer && !reducedMotion;
  const [armed, setArmed] = useState(false);

  // Mount the modal on first hover or when idle, whichever comes first.
  useEffect(() => {
    const host = hostRef.current;
    if (!enabled || armed || !host) return;
    const arm = () => setArmed(true);
    const cancelIdle = onIdle(arm, 3000);
    host.addEventListener("pointerenter", arm);
    return () => {
      cancelIdle();
      host.removeEventListener("pointerenter", arm);
    };
  }, [enabled, armed]);

  return (
    <div ref={hostRef} className={className}>
      {children}
      {enabled && armed ? <HoverModal hostRef={hostRef} items={items} /> : null}
    </div>
  );
}

function HoverModal({ hostRef, items }: { hostRef: RefObject<HTMLDivElement | null>; items: Item[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const root = rootRef.current;
    const strip = stripRef.current;
    const layers = [cardRef.current, cursorRef.current, labelRef.current];
    if (!host || !root || !strip || layers.some((l) => !l)) return;
    const els = layers as HTMLDivElement[];

    let cancelled = false;
    let revert: (() => void) | undefined;
    let gsapSet: ((targets: HTMLElement[], vars: { x: number; y: number }) => void) | null = null;
    let setters: { x: Setter; y: Setter }[] | null = null;
    let current = -1;
    let placed = false;
    let x = 0;
    let y = 0;

    // Until GSAP is here, and for the very first position (so the card doesn't fly in from a
    // corner), the layers jump straight to the pointer.
    const jump = () => {
      if (gsapSet) gsapSet(els, { x, y });
      else for (const el of els) el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };

    const show = (index: number) => {
      if (index === current) return;
      current = index;
      if (index < 0) {
        root.removeAttribute("data-active");
        return;
      }
      strip.style.transform = `translate3d(0, ${-index * 100}%, 0)`;
      root.setAttribute("data-active", "");
    };

    const rowIndex = (target: EventTarget | null): number => {
      const li = target instanceof Element ? target.closest(".f-rows > li") : null;
      if (!li || !li.parentElement || !host.contains(li)) return -1;
      const index = Array.prototype.indexOf.call(li.parentElement.children, li);
      return index < items.length ? index : -1;
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return show(-1);
      x = e.clientX;
      y = e.clientY;
      if (!placed || !setters) {
        jump();
        placed = true;
      } else {
        for (const s of setters) {
          s.x(x);
          s.y(y);
        }
      }
      show(rowIndex(e.target));
    };
    // Scrolling under a still pointer changes the row without a pointermove.
    const onOver = (e: PointerEvent) => {
      if (placed && e.pointerType !== "touch") show(rowIndex(e.target));
    };
    const onLeave = () => show(-1);

    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerover", onOver);
    host.addEventListener("pointerleave", onLeave);

    loadGsap().then((gsap) => {
      if (cancelled) return;
      const ctx = gsap.context(() => {
        gsapSet = (targets, vars) => gsap.set(targets, vars);
        if (placed) jump();
        setters = [0.8, 0.5, 0.45].map((duration, i) => ({
          x: gsap.quickTo(els[i], "x", { duration, ease: "power3" }),
          y: gsap.quickTo(els[i], "y", { duration, ease: "power3" }),
        }));
      }, root);
      revert = () => ctx.revert();
    });

    return () => {
      cancelled = true;
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerover", onOver);
      host.removeEventListener("pointerleave", onLeave);
      revert?.();
    };
  }, [hostRef, items.length]);

  return (
    <div ref={rootRef} aria-hidden="true" className="f-hm">
      <div ref={cardRef} className="f-hm-layer">
        <div className="f-hm-card">
          <div ref={stripRef} className="f-hm-strip">
            {items.map((item, i) => (
              <div key={i} className="f-hm-slide">
                {item.cover ? (
                  <div className="f-hm-shot">
                    <Image
                      src={item.cover.src}
                      alt=""
                      fill
                      // The card is clamp(18rem, 24vw, 25rem) wide; the shot is 84% of it.
                      sizes="336px"
                      className="object-cover object-top"
                    />
                  </div>
                ) : (
                  <span className="f-hm-name">{item.name}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div ref={cursorRef} className="f-hm-layer">
        <span className="f-hm-cursor" />
      </div>
      <div ref={labelRef} className="f-hm-layer">
        <span className="f-hm-label">View</span>
      </div>
    </div>
  );
}
