"use client";

import { createContext, use, useEffect, useRef, useState, type ReactNode } from "react";

// Menu state for the Folio shell (guide §4.1). One provider per page: it owns `open`, remembers
// which trigger opened the panel (top-bar "Menu" or the fixed burger) and gives focus back to it
// on close. While open, everything except the panel (`menu`) is `inert`, so it drops out of the
// tab order and the accessibility tree; MenuPanel adds the Tab wrap, Esc and the scroll lock.

type MenuApi = {
  open: boolean;
  /** Opens the panel; `trigger` gets focus back when it closes. */
  show: (trigger: HTMLElement) => void;
  hide: () => void;
};

const MenuContext = createContext<MenuApi | null>(null);

export function useMenu(): MenuApi {
  const api = use(MenuContext);
  if (!api) throw new Error("useMenu must be used inside <MenuRoot>");
  return api;
}

export function MenuRoot({ children, menu }: { children: ReactNode; menu: ReactNode }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLElement | null>(null);
  const restoreFocus = useRef(false);

  // After the close commits: the page is no longer inert, so the trigger can take focus again.
  useEffect(() => {
    if (open || !restoreFocus.current) return;
    restoreFocus.current = false;
    trigger.current?.focus();
  }, [open]);

  const api: MenuApi = {
    open,
    show: (el) => {
      trigger.current = el;
      setOpen(true);
    },
    hide: () => {
      restoreFocus.current = true;
      setOpen(false);
    },
  };

  return (
    <MenuContext value={api}>
      <div inert={open}>{children}</div>
      {menu}
    </MenuContext>
  );
}
