"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import type { CommandItem } from "./CommandMenu";

// The command menu's dialog (work plan 6.2), loaded by CommandMenu.tsx with import() on the first
// open. A native modal <dialog> (top layer; the page behind is inert while it is open) holding the
// ARIA 1.2 combobox pattern: the search field is the only stop in the tab order besides "Close",
// it owns a listbox of grouped options, and aria-activedescendant points at the highlighted one,
// so focus never leaves the field. Typing filters (every word must match the label, group or
// keywords; diacritics and case don't matter), ↑/↓ move with wrap-around, Enter runs, Esc and a
// tap on the backdrop close. A polite status line says how many commands match.
//
// Ink panel on any surface, hairline rows, a lime dot on the highlighted row; 16px+ text in the
// field (no iOS zoom), 48px rows. It fades and drops in by a few pixels with --ease-inout (CSS
// @starting-style), instantly with reduced motion. Phone: near the top with the gutters, so the
// keyboard never covers the field; from md: a 40rem column at 14svh.

type DialogProps = {
  open: boolean;
  items: CommandItem[];
  label: string;
  placeholder: string;
  onClose: (options?: { restoreFocus?: boolean }) => void;
  onNotice: (text: string) => void;
};

function normalize(text: string) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function filterItems(items: CommandItem[], query: string) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (!words.length) return items;
  return items.filter((item) => {
    const haystack = normalize([item.label, item.group, ...(item.keywords ?? [])].join(" "));
    return words.every((w) => haystack.includes(w));
  });
}

/** Consecutive items of the same group, in order. */
function groupItems(items: CommandItem[]) {
  const groups: { name: string; items: { item: CommandItem; index: number }[] }[] = [];
  items.forEach((item, index) => {
    const last = groups[groups.length - 1];
    if (last && last.name === item.group) last.items.push({ item, index });
    else groups.push({ name: item.group, items: [{ item, index }] });
  });
  return groups;
}

export default function CommandMenuDialog({ open, items, label, placeholder, onClose, onNotice }: DialogProps) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const uid = useId();

  const results = filterItems(items, query);
  const groups = groupItems(results);
  const current = results.length ? Math.min(active, results.length - 1) : -1;
  const optionId = (i: number) => `${uid}-option-${i}`;

  // Open and close the native dialog with the prop. The host remounts this component for every
  // opening, so the query and the highlight always start fresh.
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
      input.current?.focus();
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);

  // Keep the highlighted row in view while moving with the keyboard.
  useEffect(() => {
    if (current < 0) return;
    document.getElementById(optionId(current))?.scrollIntoView({ block: "nearest" });
    // optionId is derived from the stable useId value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  function run(item: CommandItem) {
    const { action } = item;
    switch (action.type) {
      case "link":
        if (action.external) {
          window.open(action.href, "_blank", "noopener,noreferrer");
          onClose();
        } else {
          // The new page takes focus itself (FocusMain in Folio), so focus isn't sent back.
          onClose({ restoreFocus: false });
          router.push(action.href);
        }
        return;
      case "copy":
        onClose();
        navigator.clipboard.writeText(action.value).then(
          () => onNotice(action.status),
          () => {
            if (action.fallbackHref) window.location.href = action.fallbackHref;
            else onNotice("Couldn’t copy: the browser blocked the clipboard");
          },
        );
        return;
      case "event":
        onClose();
        window.dispatchEvent(new CustomEvent(action.name));
        return;
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.nativeEvent.isComposing) return;
    const count = results.length;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!count) return;
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((current + step + count) % count);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (current >= 0) run(results[current]);
    }
  }

  // A press on the backdrop lands on the <dialog> itself (the panel covers the rest).
  function onDialogClick(e: MouseEvent<HTMLDialogElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <dialog
      ref={dialog}
      aria-label={label}
      // Esc: the browser would close the dialog behind React's back; let the state do it.
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={onDialogClick}
      className="fixed inset-0 m-0 h-full border-0 max-h-none w-full max-w-none overflow-hidden bg-transparent p-0 text-on-ink backdrop:bg-[rgb(40_44_32/0.45)]"
    >
      <div
        className="mx-auto mt-[max(0.75rem,env(safe-area-inset-top))] flex max-h-[min(36rem,calc(100dvh-1.5rem))] w-[min(40rem,calc(100%-2*max(var(--gutter),env(safe-area-inset-left))))] flex-col overflow-hidden rounded-2xl bg-ink shadow-[0_0_0_1px_var(--hairline-on-ink)] transition-[opacity,translate] duration-(--dur-fast) ease-inout starting:-translate-y-2 starting:opacity-0 motion-reduce:transition-none md:mt-[14svh] md:max-h-[min(36rem,72svh)]"
      >
        <div className="flex items-center gap-2 border-b border-hairline-on-ink pr-2">
          <input
            ref={input}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={`${uid}-list`}
            aria-activedescendant={current >= 0 ? optionId(current) : undefined}
            aria-autocomplete="list"
            aria-label="Search commands"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            placeholder={placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            className="min-h-14 min-w-0 flex-1 bg-transparent px-5 text-lg text-on-ink outline-none placeholder:text-[rgb(244_244_237/0.6)]"
          />
          <button
            type="button"
            onClick={() => onClose()}
            className="inline-flex min-h-11 shrink-0 items-center rounded-full px-4 text-sm font-medium text-[rgb(244_244_237/0.75)] transition-colors duration-(--dur-fast) ease-inout hover:text-on-ink focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-lime"
          >
            Close
          </button>
        </div>

        <div
          id={`${uid}-list`}
          role="listbox"
          aria-label="Commands"
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2"
        >
          {groups.map((g, gi) => (
            <div key={g.name} role="group" aria-labelledby={`${uid}-group-${gi}`}>
              <p
                id={`${uid}-group-${gi}`}
                role="presentation"
                className="px-4 pt-4 pb-2 text-sm text-[rgb(244_244_237/0.68)]"
              >
                {g.name}
              </p>
              {g.items.map(({ item, index }) => (
                <div
                  key={item.id}
                  id={optionId(index)}
                  role="option"
                  aria-selected={index === current}
                  onClick={() => run(item)}
                  onPointerMove={() => {
                    if (index !== current) setActive(index);
                  }}
                  className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl px-4 py-2 aria-selected:bg-[rgb(244_244_237/0.1)]"
                >
                  <span
                    aria-hidden="true"
                    className={`size-2 shrink-0 rounded-full bg-lime transition-transform duration-(--dur-fast) ease-inout motion-reduce:transition-none ${index === current ? "scale-100" : "scale-0"}`}
                  />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.hint ? (
                    <span aria-hidden="true" className="shrink-0 text-sm text-[rgb(244_244_237/0.6)]">
                      {item.hint}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          ))}
          {results.length === 0 ? (
            <p className="px-4 py-8 text-center text-[rgb(244_244_237/0.75)]">
              No commands match &ldquo;{query.trim()}&rdquo;
            </p>
          ) : null}
        </div>

        <p role="status" className="sr-only">
          {query ? `${results.length} ${results.length === 1 ? "command" : "commands"}` : ""}
        </p>
        <p
          aria-hidden="true"
          className="hidden gap-5 border-t border-hairline-on-ink px-5 py-3 text-xs text-[rgb(244_244_237/0.6)] [@media(hover:hover)_and_(pointer:fine)]:flex"
        >
          <span>↑ ↓ to move</span>
          <span>Enter to choose</span>
          <span>Esc to close</span>
        </p>
      </div>
    </dialog>
  );
}
