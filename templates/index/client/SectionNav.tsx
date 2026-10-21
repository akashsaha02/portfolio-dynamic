"use client";

import { useEffect, useState } from "react";

// The Home section nav (lg, in the sticky left column): jump links to the sections on the right,
// with the one in view marked aria-current and drawn with a long lime hairline (index.css).
// Scrollspy is one IntersectionObserver over a thin band 40% down the viewport: whichever
// section crosses it is current. No scroll listeners, no animation library. Before the observer
// runs (and without JS) the links are plain in-page anchors.

export type NavItem = { id: string; label: string };

export function SectionNav({ items, className }: { items: NavItem[]; className?: string }) {
  const [active, setActive] = useState<string>();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-40% 0px -59% 0px" },
    );
    for (const { id } of items) {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    }
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav aria-label="Sections" className={`i-nav ${className ?? ""}`}>
      <ul className="grid">
        {items.map(({ id, label }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              aria-current={active === id ? "true" : undefined}
              className="inline-flex min-h-11 items-center gap-4 text-xs font-semibold tracking-widest uppercase"
            >
              <span aria-hidden="true" className="i-nav-line" />
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
