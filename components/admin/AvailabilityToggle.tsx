"use client";

import { useOptimistic, useState, useTransition } from "react";
import { setAvailability } from "@/lib/admin/availability";
import type { AvailabilityStatus } from "@/lib/content-types";

const OPTIONS: Array<{ value: AvailabilityStatus; label: string; hint: string }> = [
  { value: "open", label: "Open", hint: "Looking for work" },
  { value: "limited", label: "Limited", hint: "Selective" },
  { value: "closed", label: "Closed", hint: "Not taking work" },
];

export function AvailabilityToggle({ status, label }: { status: AvailabilityStatus; label: string }) {
  const [shown, setShown] = useOptimistic(status);
  const [pending, startTransition] = useTransition();
  // Last outcome, announced by the live region below: "Saved …" or the error.
  const [outcome, setOutcome] = useState<string | null>(null);

  function choose(next: AvailabilityStatus) {
    if (next === shown || pending) return;
    setOutcome(null);
    startTransition(async () => {
      setShown(next);
      const result = await setAvailability(next);
      const label = OPTIONS.find((option) => option.value === next)?.label ?? next;
      setOutcome(result.ok ? `Saved. Availability is now ${label}.` : result.error);
    });
  }

  return (
    <div className="ak-availability">
      <div className="ak-segmented" role="group" aria-label="Availability status" aria-busy={pending}>
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`ak-segmented__btn ak-segmented__btn--${option.value}`}
            aria-pressed={shown === option.value}
            disabled={pending}
            onClick={() => choose(option.value)}
          >
            <span className="ak-segmented__label">{option.label}</span>
            <span className="ak-segmented__hint">{option.hint}</span>
          </button>
        ))}
      </div>
      {/* Always rendered (never display:none) so screen readers track it and announce changes. */}
      <p className="ak-widget__status" role="status">
        {pending ? "Saving…" : (outcome ?? "")}
      </p>
      {/* What visitors see in the hero: the badge text, with the dot unless the status is Closed. */}
      <p className="ak-onsite">
        <span className="ak-onsite__label">On the site</span>
        <span className="ak-chip" data-status={shown}>
          {shown === "closed" ? null : <span className="ak-chip__dot" aria-hidden="true" />}
          {label || "No badge text yet"}
        </span>
      </p>
    </div>
  );
}
