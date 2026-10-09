import { profile } from "@/lib/content";

const links = [
  { href: "#work", label: "Work" },
  { href: "#experience", label: "Experience", wide: true },
  { href: "#research", label: "Research" },
];

export function Nav() {
  return (
    <nav
      aria-label="Main"
      className="on-ink hero-fade-in fixed inset-x-0 top-[max(1rem,env(safe-area-inset-top))] z-40 flex justify-center px-4"
    >
      <div className="flex items-center gap-1 rounded-full bg-ink/90 p-1.5 text-on-ink shadow-[0_12px_30px_-14px_rgba(40,44,32,0.6)] backdrop-blur-md">
        <a
          href="#top"
          aria-label={`${profile.name}, back to top`}
          className="headline grid size-10 place-items-center rounded-full bg-lime text-[0.95rem] text-ink"
        >
          AS
        </a>
        {links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            className={`h-10 items-center rounded-full px-3.5 text-[0.9375rem] font-medium transition-[background-color,scale] duration-150 hover:bg-on-ink/10 active:scale-[0.96] md:px-4 ${
              l.wide ? "hidden sm:inline-flex" : "inline-flex"
            }`}
          >
            {l.label}
          </a>
        ))}
        <a
          href="#contact"
          className="inline-flex h-10 items-center rounded-full bg-on-ink px-4 text-[0.9375rem] font-semibold text-ink transition-[background-color,scale] duration-150 hover:bg-lime active:scale-[0.96]"
        >
          Contact
        </a>
      </div>
    </nav>
  );
}
