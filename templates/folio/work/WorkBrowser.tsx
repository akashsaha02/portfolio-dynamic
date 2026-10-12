"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import type { ProjectType } from "@/lib/content-types";
import { ChipToggle } from "../ui/Chip";
import { GridIcon, ListIcon } from "../ui/icons";

// Work index controls (guide §4.3): filter chips All · Full-stack · Machine learning and, on lg
// with a fine pointer, a list ↔ grid toggle. The projects themselves are Server Components passed
// in as children, every one in the HTML; this leaf only sets `data-filter` / `data-view` on their
// container and work.css hides what doesn't match. So without JS every project is listed and
// every link works; only the filtering needs JS.
//
// The filter lives in the URL (?type=fullstack|ml) through the native History API, which Next's
// router picks up (01-getting-started/04-linking-and-navigating.md), so a filtered view can be
// shared and back/forward step through filters. On the server and during hydration it reads as
// "all", then the real URL takes over.

export type WorkFilter = "all" | ProjectType;

const FILTERS: { id: WorkFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "fullstack", label: "Full-stack" },
  { id: "ml", label: "Machine learning" },
];

type View = "list" | "grid";

const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("popstate", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("popstate", onChange);
  };
}

function urlType(): string | null {
  return new URLSearchParams(window.location.search).get("type");
}

function pushType(filter: WorkFilter) {
  const url = new URL(window.location.href);
  if (filter === "all") url.searchParams.delete("type");
  else url.searchParams.set("type", filter);
  window.history.pushState(null, "", `${url.pathname}${url.search}${url.hash}`);
  for (const notify of listeners) notify();
}

type WorkBrowserProps = {
  /** Projects per filter; a type with none gets no chip. */
  counts: Record<WorkFilter, number>;
  children: ReactNode;
};

export function WorkBrowser({ counts, children }: WorkBrowserProps) {
  const raw = useSyncExternalStore(subscribe, urlType, () => null);
  // Unknown or empty types (?type=foo, a type with no projects yet) fall back to All.
  const filter: WorkFilter = FILTERS.some((f) => f.id === raw && f.id !== "all" && counts[f.id] > 0)
    ? (raw as WorkFilter)
    : "all";
  const [view, setView] = useState<View>("list");
  // Set on the first chip press, so only filtering (never the first paint) animates tiles in.
  const [touched, setTouched] = useState(false);

  const filters = FILTERS.filter((f) => f.id === "all" || counts[f.id] > 0);
  const shown = counts[filter];

  function choose(next: WorkFilter) {
    setTouched(true);
    if (next !== filter) pushType(next);
  }

  return (
    <div
      className="f-work"
      data-filter={filter}
      data-view={view}
      data-touched={touched ? "" : undefined}
    >
      <div className="mt-10 flex flex-wrap items-center justify-between gap-x-8 gap-y-5 md:mt-16">
        {filters.length > 2 ? (
          <div role="group" aria-label="Filter by type" className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <ChipToggle key={f.id} pressed={filter === f.id} onClick={() => choose(f.id)}>
                {f.label}
                <sup aria-hidden="true" className="-mt-2 text-[0.6875rem] tabular-nums opacity-70">
                  {counts[f.id]}
                </sup>
              </ChipToggle>
            ))}
          </div>
        ) : null}

        <div className="flex items-center gap-6">
          <p role="status" className="type-label tabular-nums">
            {shown} {shown === 1 ? "project" : "projects"}
          </p>
          <div role="group" aria-label="Layout" className="f-work-views gap-2">
            <ViewButton label="List" pressed={view === "list"} onClick={() => setView("list")}>
              <ListIcon className="size-5" />
            </ViewButton>
            <ViewButton label="Grid" pressed={view === "grid"} onClick={() => setView("grid")}>
              <GridIcon className="size-5" />
            </ViewButton>
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}

function ViewButton({
  label,
  pressed,
  onClick,
  children,
}: {
  label: string;
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className="f-chip f-chip-toggle size-12 justify-center"
    >
      {children}
      <span className="sr-only">{label}</span>
    </button>
  );
}
