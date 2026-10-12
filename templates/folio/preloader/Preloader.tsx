import type { CSSProperties } from "react";
import type { Greeting } from "@/lib/content-types";
import { InlineScript } from "@/components/shared/InlineScript";
import "../preloader.css";

// Preloader (guide §4.1, §6; work plan 1.4): an ink screen that says hello in each of the
// profile's greetings, then lifts away with a curved bottom edge. Home only, first full page
// load of the session only, never with reduced motion. Total ≤ 1.6s; a tap, click, scroll or any
// key skips it.
//
// It never holds the page back. The page is server-rendered underneath and stays in the DOM and
// the accessibility tree the whole time; the overlay is aria-hidden, has nothing focusable and
// doesn't make anything inert. It is `display: none` by default, so without JS, on repeat
// visits and on soft navigations to Home nothing is ever covered. The inline script below runs
// while the HTML is parsed, before first paint: it decides whether to run, and if so sets
// `data-run`, which shows the overlay and starts its CSS animations (preloader.css). No GSAP, no
// hydration needed: the script also handles skipping and clean-up, and the overlay goes back to
// `display: none` when the lift ends.

const FIRST_HOLD = 300; // ms the first word holds
const MAX_STEP = 150; // ms per following word
const LIFT_AT = 1100; // latest lift start; the lift is --dur (500ms), so total ≤ 1.6s
const STORAGE_KEY = "folio:preloader";

function timeline(count: number) {
  if (count <= 1) return { step: 0, liftAt: 600 };
  const step = Math.min(MAX_STEP, Math.floor((LIFT_AT - FIRST_HOLD) / (count - 1)));
  return { step, liftAt: FIRST_HOLD + step * (count - 1) };
}

/** The run/skip/clean-up logic, inlined into the HTML. Built from constants only. */
function script(liftAt: number) {
  return `(function(){var p=document.getElementById("f-pre");if(!p||matchMedia("(prefers-reduced-motion: reduce)").matches)return;try{if(sessionStorage.getItem("${STORAGE_KEY}"))return;sessionStorage.setItem("${STORAGE_KEY}","1")}catch(e){}var t0=performance.now(),ev=["keydown","pointerdown","wheel"],o={capture:true,passive:true};function skip(){if(performance.now()-t0<${liftAt})p.setAttribute("data-skip","")}function done(e){if(e&&e.target!==p)return;p.removeAttribute("data-run");p.removeAttribute("data-skip");p.removeEventListener("animationend",done);ev.forEach(function(n){removeEventListener(n,skip,o)})}p.setAttribute("data-run","");p.addEventListener("animationend",done);ev.forEach(function(n){addEventListener(n,skip,o)});setTimeout(done,${liftAt + 2000})})()`;
}

type Vars = CSSProperties & Record<`--${string}`, string>;

export function Preloader({ greetings }: { greetings: Greeting[] }) {
  if (greetings.length === 0) return null;
  const { step, liftAt } = timeline(greetings.length);

  return (
    <>
      <div
        id="f-pre"
        aria-hidden="true"
        // The inline script adds data-run / data-skip before React hydrates.
        suppressHydrationWarning
        className="f-pre surface-ink"
        style={{ "--f-pre-lift-at": `${liftAt}ms` } as Vars}
      >
        <p className="f-pre-words">
          {greetings.map((g, i) => {
            const vars: Vars = {
              "--t": `${i === 0 ? 0 : FIRST_HOLD + (i - 1) * step}ms`,
              "--d": `${i === 0 ? FIRST_HOLD : step}ms`,
            };
            return (
              <span key={`${g.lang}-${i}`} lang={g.lang} className="f-pre-word" style={vars}>
                <span className="f-dot" />
                {g.text}
              </span>
            );
          })}
        </p>
        <span className="f-pre-curve" />
      </div>
      <InlineScript html={script(liftAt)} />
    </>
  );
}
