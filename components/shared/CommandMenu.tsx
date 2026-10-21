"use client";

import { lazy, Suspense, useEffect, useRef, useState, useSyncExternalStore, type ButtonHTMLAttributes } from "react";

// ⌘K command menu (work plan 6.2, guide §12, after Paco Coursey's cmdk). Shared by every template:
// the template passes the commands as plain data (Server Components can build the list), styles
// come from the global tokens, nothing here imports a template.
//
// Lazy by design: this module is only the host (the ⌘K / Ctrl+K listener, open state, focus
// return and the "copied" notice) and the trigger. The dialog itself (CommandMenuDialog.tsx,
// filtering, keyboard and the listbox) is fetched with import() on the first open, or earlier when
// a trigger is hovered or focused.
//
// Anything can open it: a <CommandMenuButton>, ⌘K / Ctrl+K anywhere, or openCommandMenu(). Every
// open is broadcast as OPEN_EVENT on window, so other overlays (a template's menu panel) can get
// out of the way. On close, focus goes back to whatever had it before (or to the page's <main>
// when that is gone or hidden).

export type CommandAction =
  /** Internal paths use the router (page transitions included); `external` opens a new tab. */
  | { type: "link"; href: string; external?: boolean }
  /** Copies `value`; `status` is announced. Where the clipboard is refused, goes to `fallbackHref`. */
  | { type: "copy"; value: string; status: string; fallbackHref?: string }
  /** Dispatches a window CustomEvent with this name, for template features (e.g. annotations). */
  | { type: "event"; name: string };

export type CommandItem = {
  /** Unique among the items. */
  id: string;
  label: string;
  /** Heading the item is listed under, e.g. "Pages". Items of a group should be adjacent. */
  group: string;
  /** Extra words the filter matches, e.g. ["mail"] for "Copy email address". */
  keywords?: string[];
  /** Short trailing text, e.g. "Case study" or "↗". Decorative. */
  hint?: string;
  action: CommandAction;
};

export const OPEN_EVENT = "command-menu:open";

/** Opens the command menu of the current page (if one is mounted). Client only. */
export function openCommandMenu() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

const loadDialog = () => import("./CommandMenuDialog");
const CommandMenuDialog = lazy(loadDialog);

/** Starts fetching the dialog's code; call on hover or focus of anything that opens it. */
export function preloadCommandMenu() {
  void loadDialog();
}

function isShortcut(e: KeyboardEvent) {
  return (e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === "k";
}

/** Somewhere focus can actually land: connected, not inside an inert subtree, rendered. */
function canFocus(el: HTMLElement | null): el is HTMLElement {
  return !!el && el.isConnected && !el.closest("[inert]") && el.getClientRects().length > 0;
}

type CommandMenuProps = {
  items: CommandItem[];
  /** The dialog's accessible name. */
  label?: string;
  placeholder?: string;
};

export function CommandMenu({ items, label = "Command menu", placeholder = "Search or jump to…" }: CommandMenuProps) {
  const [open, setOpen] = useState(false);
  // The dialog mounts on the first open and then stays (closed), so reopening is instant.
  const [loaded, setLoaded] = useState(false);
  // Bumped on every opening: the dialog remounts, so it starts with an empty query.
  const [opens, setOpens] = useState(0);
  const [notice, setNotice] = useState("");
  const openRef = useRef(false);
  const returnTo = useRef<HTMLElement | null>(null);
  const restore = useRef(false);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const show = () => {
      if (openRef.current) return;
      openRef.current = true;
      returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setLoaded(true);
      setOpens((n) => n + 1);
      setOpen(true);
    };
    const onKey = (e: KeyboardEvent) => {
      if (!isShortcut(e)) return;
      e.preventDefault();
      if (openRef.current) close();
      else openCommandMenu();
    };
    window.addEventListener(OPEN_EVENT, show);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(OPEN_EVENT, show);
      document.removeEventListener("keydown", onKey);
      clearTimeout(noticeTimer.current);
    };
  }, []);

  // After the close commits, focus goes back (unless an action navigated or moved it on purpose).
  useEffect(() => {
    if (open || !restore.current) return;
    restore.current = false;
    const target = canFocus(returnTo.current) ? returnTo.current : document.getElementById("main");
    target?.focus({ preventScroll: true });
  }, [open]);

  function close(options: { restoreFocus?: boolean } = {}) {
    restore.current = options.restoreFocus ?? true;
    openRef.current = false;
    setOpen(false);
  }

  function announce(text: string) {
    setNotice(text);
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(""), 2400);
  }

  return (
    <>
      {loaded ? (
        <Suspense fallback={null}>
          <CommandMenuDialog
            key={opens}
            open={open}
            items={items}
            label={label}
            placeholder={placeholder}
            onClose={close}
            onNotice={announce}
          />
        </Suspense>
      ) : null}
      {/* Always in the DOM, so screen readers pick up the change; visible only while it says something. */}
      <p
        role="status"
        className={`fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-1/2 z-60 -translate-x-1/2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-on-ink shadow-[0_0_0_1px_var(--hairline-on-ink)] ${notice ? "" : "sr-only"}`}
      >
        {notice}
      </p>
    </>
  );
}

const subscribeNever = () => () => {};
const isApple = () => /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);

/** "⌘K" on Apple devices, "Ctrl K" elsewhere (and "⌘K" in the server HTML). Decorative. */
export function ShortcutHint({ className }: { className?: string }) {
  const apple = useSyncExternalStore(subscribeNever, isApple, () => true);
  return (
    <kbd aria-hidden="true" className={className}>
      {apple ? "⌘K" : "Ctrl K"}
    </kbd>
  );
}

type CommandMenuButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "onClick">;

/** A button that opens the command menu. Unstyled: pass the classes, the label and an aria-label. */
export function CommandMenuButton({ onPointerEnter, onFocus, children, ...button }: CommandMenuButtonProps) {
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-keyshortcuts="Meta+K Control+K"
      onClick={openCommandMenu}
      onPointerEnter={(e) => {
        preloadCommandMenu();
        onPointerEnter?.(e);
      }}
      onFocus={(e) => {
        preloadCommandMenu();
        onFocus?.(e);
      }}
      {...button}
    >
      {children}
    </button>
  );
}
