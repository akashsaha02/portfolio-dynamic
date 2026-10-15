"use client";

import { useOptimistic, useState, useTransition } from "react";
import { setAvailability } from "@/lib/admin/availability";
import type { AvailabilityStatus } from "@/lib/content-types";

const OPTIONS: Array<{ value: AvailabilityStatus; label: string; hint: string }> = [
  { value: "open", label: "Open", hint: "Looking for work" },
  { value: "limited", label: "Limited", hint: "Selective" },
  { value: "closed", label: "Closed", hint: "Not taking work" },
];

export function AvailabilityToggle({ status }: { status: AvailabilityStatus }) {
  const [shown, setShown] = useOptimistic(status);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function choose(next: AvailabilityStatus) {
    if (next === shown || pending) return;
    setError(null);
    startTransition(async () => {
      setShown(next);
      const result = await setAvailability(next);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div>
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
      <p className="ak-widget__status" role="status">
        {error ?? (pending ? "Saving…" : "")}
      </p>
    </div>
  );
}
