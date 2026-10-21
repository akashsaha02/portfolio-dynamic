"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { ANNOTATIONS_ATTR, ANNOTATIONS_KEY, ANNOTATIONS_TOGGLE_EVENT } from "../annotations";

// The footer's annotations switch (work plan 6.6): a toggle button (aria-pressed) that sets
// `data-annotations` on <html>, where CSS reveals the notes, and remembers the choice in
// localStorage (a blocked storage only loses the memory). It also answers the command menu's
// toggle event, and then says what changed, since focus is elsewhere. The attribute lives on
// <html>, which survives client navigations; full loads restore it before first paint
// (ANNOTATIONS_INIT_SCRIPT in FolioShell).

const CHANGE = "folio:annotations-change";

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE, onChange);
  return () => window.removeEventListener(CHANGE, onChange);
}

const isOn = () => document.documentElement.hasAttribute(ANNOTATIONS_ATTR);

function toggle(): boolean {
  const on = !isOn();
  document.documentElement.toggleAttribute(ANNOTATIONS_ATTR, on);
  try {
    if (on) localStorage.setItem(ANNOTATIONS_KEY, "on");
    else localStorage.removeItem(ANNOTATIONS_KEY);
  } catch {}
  window.dispatchEvent(new Event(CHANGE));
  return on;
}

export function AnnotationsToggle() {
  const on = useSyncExternalStore(subscribe, isOn, () => false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const onCommand = () => setStatus(toggle() ? "Notes on how this was built are shown" : "Notes hidden");
    window.addEventListener(ANNOTATIONS_TOGGLE_EVENT, onCommand);
    return () => window.removeEventListener(ANNOTATIONS_TOGGLE_EVENT, onCommand);
  }, []);

  return (
    <>
      <button
        type="button"
        aria-pressed={on}
        onClick={() => {
          toggle();
          setStatus("");
        }}
        className="f-switch inline-flex min-h-11 items-center gap-3"
      >
        <span aria-hidden="true" className="f-switch-track">
          <span className="f-switch-thumb" />
        </span>
        How this was built
      </button>
      <span role="status" className="sr-only">
        {status}
      </span>
    </>
  );
}
