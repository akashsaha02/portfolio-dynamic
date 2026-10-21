"use client";

import { useState, useTransition } from "react";
import { activateTemplate } from "@/lib/admin/template";
import type { TemplateId } from "@/templates/types";

/** "Activate" in the Templates widget: confirms, then saves site-settings via a Server Action. */
export function ActivateTemplateButton({
  template,
  name,
  disabled,
}: {
  template: TemplateId;
  name: string;
  disabled: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function activate() {
    if (pending) return;
    if (!window.confirm(`Make ${name} the live template? Visitors see it on their next page load.`)) return;
    setError(null);
    startTransition(async () => {
      const result = await activateTemplate(template);
      // On success the action refreshes the dashboard, which re-renders this row as "Live".
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <>
      <button
        type="button"
        className="ak-button ak-button--primary"
        onClick={activate}
        disabled={disabled || pending}
        aria-busy={pending}
        title={disabled ? "Not ready yet: preview only." : undefined}
      >
        {pending ? "Activating…" : "Activate"}
        <span className="ak-sr-only"> {name}</span>
      </button>
      {/* Live region kept in the DOM so screen readers announce errors. */}
      <span className="ak-widget__status" role="status">
        {error ?? ""}
      </span>
    </>
  );
}
