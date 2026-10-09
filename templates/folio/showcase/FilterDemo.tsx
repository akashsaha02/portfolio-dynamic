"use client";

// SHOWCASE ONLY (remove in work plan 1.3). Exercises ChipToggle with real state; the Work index
// (1.5) owns the real filters and the `?type=` URL.

import { useState } from "react";
import type { ProjectType } from "@/lib/content-types";
import { ChipToggle } from "../ui/Chip";

type Filter = "all" | ProjectType;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "fullstack", label: "Full-stack" },
  { id: "ml", label: "Machine learning" },
];

export function FilterDemo({ counts }: { counts: Record<Filter, number> }) {
  const [active, setActive] = useState<Filter>("all");

  return (
    <div>
      <div role="group" aria-label="Filter projects" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <ChipToggle key={f.id} pressed={active === f.id} onClick={() => setActive(f.id)}>
            {f.label}
          </ChipToggle>
        ))}
      </div>
      <p aria-live="polite" className="mt-3 type-label">
        {counts[active]} {counts[active] === 1 ? "project" : "projects"}
      </p>
    </div>
  );
}
