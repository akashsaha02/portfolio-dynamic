"use client";

import { useEffect, useRef, useState } from "react";
import { openCommandMenu, preloadCommandMenu } from "@/components/shared/CommandMenu";
import { Burger } from "../ui/icons";
import { Magnetic } from "../ui/Magnetic";
import { RoundButton } from "../ui/RoundButton";
import { RollLabel } from "../ui/Action";
import { useMenu } from "./MenuRoot";
import { MENU_ID } from "./pages";

// The two ways into the menu panel (guide §4.1). Both are real buttons with aria-expanded and
// aria-controls; whichever opened the panel gets focus back when it closes.

/** Top bar "Menu", phone only (md+ shows the links instead). */
export function MenuButton({ className }: { className?: string }) {
  const { open, show } = useMenu();
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-controls={MENU_ID}
      onClick={(e) => show(e.currentTarget)}
      className={`f-roll-host inline-flex min-h-11 min-w-11 items-center justify-center px-3 font-medium ${className ?? ""}`}
    >
      <RollLabel>Menu</RollLabel>
    </button>
  );
}

/**
 * The command menu from inside the menu panel (work plan 6.2): the touch way in, since phones and
 * tablets have no ⌘K and the top bar's pill is fine-pointer only (hidden there, .f-cmdk-touch). Closes
 * the panel first; once its trigger has focus back, the command menu opens and will return focus
 * there.
 */
export function CommandMenuEntry() {
  const { hide } = useMenu();
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      onPointerDown={preloadCommandMenu}
      onClick={() => {
        hide();
        // Two frames: the close commits and MenuRoot hands focus back to the trigger first.
        requestAnimationFrame(() => requestAnimationFrame(openCommandMenu));
      }}
      className="f-roll-host inline-flex min-h-11 items-center"
    >
      <RollLabel>Search and shortcuts</RollLabel>
    </button>
  );
}

/**
 * The fixed round burger. It scales in once the hero has left the viewport: it observes the
 * element marked `data-folio-hero` (work plan 1.3), or, on pages without one, a 100svh sentinel
 * at the top of the page. While hidden it is `visibility: hidden`, so it is neither focusable nor
 * announced, and the top bar keeps the only way in. Magnetic on a fine pointer.
 */
export function FixedBurger() {
  const { open, show } = useMenu();
  const sentinel = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const target = document.querySelector("[data-folio-hero]") ?? sentinel.current;
    if (!target) return;
    const io = new IntersectionObserver(([entry]) => setShown(!entry.isIntersecting));
    io.observe(target);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <span ref={sentinel} aria-hidden="true" className="pointer-events-none absolute top-0 left-0 h-svh w-px" />
      <div data-shown={shown ? "" : undefined} className="f-burger f-corner fixed z-40">
        <Magnetic>
          <RoundButton
            size="sm"
            aria-label="Menu"
            aria-expanded={open}
            aria-controls={MENU_ID}
            onClick={(e) => show(e.currentTarget)}
          >
            <Burger />
          </RoundButton>
        </Magnetic>
      </div>
    </>
  );
}
