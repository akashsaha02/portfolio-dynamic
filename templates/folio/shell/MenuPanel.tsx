"use client";

import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";
import { CurvedEdge } from "../ui/CurvedEdge";
import { Close } from "../ui/icons";
import { RoundButton } from "../ui/RoundButton";
import { useMenu } from "./MenuRoot";
import { MENU_ID } from "./pages";

// The menu panel (guide §4.1): full-screen ink on phone, ~40vw from md with a curved left edge
// over a dimmed backdrop. It slides with a CSS transform (.f-menu in folio.css, --ease-inout,
// --dur-smooth) and the curve bows while it moves, flattening as the panel settles (.f-menu-curve,
// work plan 5.1); reduced motion makes the slide instant and keeps the static curve. The links are
// server-rendered children; a click on any same-tab link closes it.
//
// Modal behaviour: focus moves to the close button, Tab and Shift+Tab wrap inside the panel (the
// page behind is inert, but the layout's skip link sits outside the shell), Esc and the backdrop
// close it, and the page behind can't scroll (html[data-folio-menu-open]).

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function MenuPanel({ children }: { children: ReactNode }) {
  const { open, hide } = useMenu();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = panel.current;
    if (!open || !el) return;

    // Lock scroll; pad by the classic scrollbar's width so the page doesn't jump sideways.
    const root = document.documentElement;
    root.style.setProperty("--folio-scrollbar", `${window.innerWidth - root.clientWidth}px`);
    root.setAttribute("data-folio-menu-open", "");
    el.querySelector<HTMLElement>("[data-menu-close]")?.focus();

    const ends = () => {
      const items = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE));
      return { first: items[0], last: items[items.length - 1] };
    };
    let backwards = false;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        hide();
        return;
      }
      if (e.key !== "Tab") return;
      backwards = e.shiftKey;
      const { first, last } = ends();
      if (!first) return;
      const active = document.activeElement;
      const inside = active instanceof Node && el.contains(active);
      if (e.shiftKey && (active === first || !inside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !inside)) {
        e.preventDefault();
        first.focus();
      }
    };

    // Safari's default Tab skips links, so "last" may never be reached and Tab would leave the
    // panel; pull focus straight back from wherever it lands outside.
    const onFocusIn = (e: FocusEvent) => {
      if (e.target instanceof Node && el.contains(e.target)) return;
      const { first, last } = ends();
      (backwards ? last : first)?.focus();
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("focusin", onFocusIn);
      root.removeAttribute("data-folio-menu-open");
      root.style.removeProperty("--folio-scrollbar");
    };
  }, [open, hide]);

  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const link = (e.target as Element).closest("a");
    if (link && link.target !== "_blank") hide();
  };

  const state = open ? "" : undefined;

  return (
    <>
      <div aria-hidden="true" data-open={state} className="f-menu-backdrop" onClick={hide} />
      <div
        ref={panel}
        id={MENU_ID}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        inert={!open}
        data-open={state}
        className="f-menu surface-ink"
        onClick={onClick}
      >
        <CurvedEdge edge="left" fill="var(--ink)" className="f-menu-curve hidden md:block" />
        <div className="f-corner absolute z-1">
          <RoundButton size="sm" aria-label="Close menu" data-menu-close="" onClick={hide}>
            <Close />
          </RoundButton>
        </div>
        <div className="f-menu-scroll">{children}</div>
      </div>
    </>
  );
}
