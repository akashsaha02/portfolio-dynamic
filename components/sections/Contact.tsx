import { profile } from "@/lib/content";
import { ArrowIcon } from "../ArrowIcon";

export function Contact() {
  const year = new Date().getFullYear();

  return (
    <footer id="contact" className="px-2 pb-2 md:px-4 md:pb-4">
      <div className="on-ink relative overflow-hidden rounded-4xl bg-ink px-5 pb-8 pt-20 text-on-ink md:px-10 md:pt-32">
        <h2 className="display max-w-[12ch] text-[clamp(3.5rem,10vw,10rem)]">
          Have a product that needs <span className="text-lime">building?</span>
        </h2>
        <p className="mt-8 max-w-[44ch] text-lg leading-relaxed text-on-ink/75">
          I’m happy to talk about full-stack roles, freelance work or research collaborations.
        </p>

        <a
          href={`mailto:${profile.email}`}
          className="group mt-12 inline-flex max-w-full items-center gap-4 rounded-full bg-lime py-3 pl-6 pr-3 text-ink transition-transform duration-200 ease-out hover:-translate-y-1 active:scale-[0.96] md:mt-16 md:gap-6 md:py-4 md:pl-9 md:pr-4"
        >
          <span className="headline min-w-0 break-all text-[clamp(1.35rem,4.2vw,3.75rem)] normal-case">
            {profile.email}
          </span>
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-ink text-lime transition-transform duration-200 ease-out group-hover:rotate-45 md:size-16">
            <ArrowIcon className="size-5 -rotate-45 md:size-6" />
          </span>
        </a>

        <div className="mt-20 flex flex-col gap-8 border-t border-on-ink/15 pt-8 md:mt-28 md:flex-row md:items-center md:justify-between">
          <ul className="flex gap-3">
            {[
              { href: profile.github, label: "GitHub" },
              { href: profile.linkedin, label: "LinkedIn" },
            ].map((l) => (
              <li key={l.label}>
                <a
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-12 items-center gap-2 rounded-full px-5 font-semibold ring-1 ring-on-ink/25 transition-[color,background-color,box-shadow,scale] duration-150 hover:bg-lime hover:text-ink hover:ring-lime active:scale-[0.96]"
                >
                  {l.label}
                  <ArrowIcon newTab />
                </a>
              </li>
            ))}
          </ul>
          <p className="text-[0.9375rem] text-on-ink/60">
            © {year} {profile.name}. {profile.location}.
          </p>
        </div>
      </div>
    </footer>
  );
}
