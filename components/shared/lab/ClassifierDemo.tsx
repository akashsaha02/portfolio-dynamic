"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState, type ChangeEvent, type CSSProperties } from "react";
import type { Classification } from "./inference";

// The interactive part of the tomato-leaf demo (work plan 6.7): pick a sample or a photo, press
// Classify. TF.js, the model and inference.ts load only on that press (import() below), so this
// file is all the page ships up front. Styled with plain utilities and the surface variables
// Folio sets (--rule, --fg-muted, --btn-*), with fallbacks, so any template can render it.
// Layout follows the component's own width (container queries), not the viewport's.

export type Sample = { src: string; label: string };

type Result = Classification & { libMs?: number };

const percent = new Intl.NumberFormat("en-GB", { style: "percent", maximumFractionDigits: 1 });
const pct = (p: number) => (p < 0.001 ? "<0.1%" : percent.format(p));
const secs = (ms: number) => (ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1)} s`);

const pill =
  "inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-full px-6 font-medium " +
  "transition-colors duration-300 ease-inout has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2";

export function ClassifierDemo({ samples, modelSize }: { samples: Sample[]; modelSize: string }) {
  const id = useId();
  const img = useRef<HTMLImageElement>(null);
  const loaded = useRef(false);
  const [pick, setPick] = useState(0); // a sample, or -1 for the visitor's own photo
  const [photo, setPhoto] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<Result>();

  // The object URL lives as long as it is shown.
  useEffect(() => () => void (photo && URL.revokeObjectURL(photo)), [photo]);

  const sample = samples[pick];
  const src = pick < 0 ? photo : sample?.src;

  function choose(i: number) {
    setPick(i);
    setResult(undefined);
    setMessage("");
  }

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // choosing the same file again still fires
    if (!file) return;
    setPhoto(URL.createObjectURL(file));
    choose(-1);
  }

  async function classify() {
    if (busy || !img.current) return;
    setBusy(true);
    setResult(undefined);
    setMessage(loaded.current ? "Classifying…" : `Loading TensorFlow.js and the model (${modelSize})…`);
    try {
      const t = performance.now();
      const lib = await import("./inference");
      const libMs = loaded.current ? undefined : performance.now() - t;
      const r = await lib.classify(img.current);
      loaded.current = true;
      setResult({ ...r, libMs });
      setMessage(`Most likely ${r.top[0].name}, ${pct(r.top[0].p)}.`);
    } catch {
      setMessage(
        pick < 0
          ? "This image couldn’t be read or classified. Try a JPEG or PNG photo."
          : "The model couldn’t load. Check your connection and press Classify again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="@container">
      <div className="grid gap-8 @xl:grid-cols-2 @xl:gap-10">
        <div className="grid content-start gap-6">
          <fieldset>
            <legend className="text-sm text-[var(--fg-muted,var(--muted))]">Pick a leaf from the test set</legend>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {samples.map((s, i) => (
                <label
                  key={s.src}
                  className="cursor-pointer rounded-xl p-1 outline-offset-2 ring-current has-[:checked]:ring-2 has-[:focus-visible]:outline-2"
                >
                  <input
                    type="radio"
                    name={`${id}-sample`}
                    className="sr-only"
                    checked={pick === i}
                    onChange={() => choose(i)}
                  />
                  <Image
                    src={s.src}
                    alt=""
                    width={256}
                    height={256}
                    unoptimized
                    className="aspect-square w-full rounded-lg bg-paper-2 object-cover"
                  />
                  <span className="mt-1.5 block px-0.5 pb-0.5 text-sm leading-tight">{s.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <p className="text-sm text-[var(--fg-muted,var(--muted))]">Or use your own photo of one leaf</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <label className={`${pill} border border-current/30 hover:border-current`}>
                <input type="file" accept="image/*" className="sr-only" onChange={onFile} />
                Upload a photo
              </label>
              {/* Straight to the camera; phones and tablets only (a mouse means a file picker). */}
              <label className={`${pill} border border-current/30 hover:border-current pointer-fine:hidden`}>
                <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={onFile} />
                Take a photo
              </label>
            </div>
          </div>
        </div>

        <div className="grid content-start gap-5">
          <figure>
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-paper-2">
              {src ? (
                <Image
                  ref={img}
                  src={src}
                  alt={pick < 0 ? "Your photo" : `Sample leaf, labelled ${sample?.label}`}
                  fill
                  unoptimized
                  // Classify decodes this very element, so it must not wait for the viewport.
                  loading="eager"
                  sizes="(min-width: 768px) 40vw, 100vw"
                  className="object-cover"
                />
              ) : null}
            </div>
            <figcaption className="mt-2 text-sm text-[var(--fg-muted,var(--muted))]">
              {pick < 0 ? "Your photo" : `Test-set photo, labelled ${sample?.label}`}. The model sees the centre
              square.
            </figcaption>
          </figure>

          <button
            type="button"
            onClick={classify}
            aria-disabled={busy || !src}
            className="inline-flex min-h-14 w-full items-center justify-center rounded-full bg-[var(--btn-bg,var(--ink))] px-7 text-lg font-medium text-[var(--btn-fg,var(--on-ink))] transition-[background-color,color,scale] duration-300 ease-inout hover:bg-lime hover:text-ink active:scale-[0.98] aria-disabled:opacity-60"
          >
            {busy ? "Classifying…" : "Classify"}
          </button>

          <div role="status" className="grid gap-4">
            <p className={result ? "sr-only" : ""}>{message}</p>
            {result ? (
              <>
                <ol aria-label="Top three classes" className="grid gap-4">
                  {result.top.map((t) => (
                    <li key={t.name}>
                      <p className="flex justify-between gap-4 text-lg leading-snug">
                        <span>{t.name}</span>
                        <span className="tabular-nums">{pct(t.p)}</span>
                      </p>
                      {/* Grows from zero once (@starting-style); --p, not an inline `scale`, which
                          would outrank the starting style. Instant with reduced motion. */}
                      <div aria-hidden="true" className="mt-2 h-2 overflow-hidden rounded-full bg-current/10">
                        <div
                          className="h-full origin-left rounded-full bg-current [scale:var(--p)_1] transition-[scale] duration-700 ease-inout motion-reduce:transition-none starting:[scale:0_1]"
                          style={{ "--p": Math.max(t.p, 0.005) } as CSSProperties}
                        />
                      </div>
                    </li>
                  ))}
                </ol>
                <p className="text-sm text-[var(--fg-muted,var(--muted))]">
                  {result.libMs !== undefined && result.modelMs !== undefined
                    ? `First run: TensorFlow.js ${secs(result.libMs)}, model ${secs(result.modelMs)}. `
                    : ""}
                  This photo: {secs(result.inferMs)} on the {result.backend === "webgl" ? "GPU (WebGL)" : "CPU"}.
                </p>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
