import Image from "next/image";
import { profile } from "@/lib/content";

export function Hero() {
  return (
    <header className="relative h-svh min-h-[34rem] overflow-hidden bg-paper text-ink [container-type:size]">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(50%_55%_at_50%_48%,#f7f8f1_0%,rgba(235,238,224,0)_72%)]"
      />

      <h1 translate="no" className="display absolute inset-x-0 top-[14cqh] z-0 text-center md:top-[12cqh]">
        <span className="sr-only">
          {profile.name}, {profile.role.toLowerCase()}
        </span>
        <span
          aria-hidden
          className="flex flex-col items-center text-[31cqw] md:flex-row md:justify-center md:gap-[0.14em] md:text-[19cqw]"
        >
          <span className="block overflow-hidden">
            <span className="hero-rise block">Akash</span>
          </span>
          <span className="block overflow-hidden">
            <span className="hero-rise block [animation-delay:150ms]">Saha</span>
          </span>
        </span>
      </h1>

      <Image
        src="/portrait.webp"
        alt="Portrait of Akash Saha"
        width={1024}
        height={1024}
        preload
        sizes="(max-width: 768px) 135vw, 92vh"
        className="hero-fade hero-develop absolute bottom-0 left-1/2 z-10 aspect-square h-[min(92cqh,135cqw)] w-auto max-w-none -translate-x-1/2"
      />

      <p
        aria-hidden
        className="hero-sign pointer-events-none absolute bottom-[9cqh] left-1/2 z-20 hidden -translate-x-1/2 -rotate-[8deg] whitespace-nowrap font-script text-[clamp(4.5rem,11cqw,10rem)] leading-none text-lime [text-shadow:0_2px_0_rgba(40,44,32,0.35)] md:block"
      >
        Akash Saha
      </p>

      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 z-10 h-[24cqh] bg-gradient-to-t from-paper via-paper/80 to-transparent md:hidden"
      />

      <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col gap-4 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:flex-row md:items-end md:justify-between md:px-10 md:pb-10">
        <p className="hero-fade-in text-center text-[0.9375rem] font-semibold md:hidden">
          {profile.role} in Dhaka
        </p>
        <p className="hero-fade-in hidden max-w-[19rem] text-[1.0625rem] font-medium leading-snug md:block">
          {profile.intro}
        </p>
        <div className="hero-fade-in flex gap-2.5 md:gap-3">
          <a
            href="#work"
            className="inline-flex h-12 flex-1 items-center justify-center rounded-full bg-lime px-6 font-semibold text-ink shadow-[inset_0_0_0_1px_rgba(40,44,32,0.12)] transition-transform duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.96] md:flex-none"
          >
            See my work
          </a>
          <a
            href={`mailto:${profile.email}`}
            className="inline-flex h-12 flex-1 items-center justify-center rounded-full bg-ink px-6 font-semibold text-on-ink transition-[background-color,scale] duration-150 hover:bg-ink-2 active:scale-[0.96] md:flex-none"
          >
            Email me
          </a>
        </div>
      </div>
    </header>
  );
}
