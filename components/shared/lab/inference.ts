// The in-browser half of the tomato-leaf demo (work plan 6.7). ClassifierDemo loads this module
// with import() when the visitor presses Classify, and not before: TF.js core, the graph-model
// loader and two backends (WebGL, and the plain JavaScript CPU kernels where WebGL can't start).
// Everything runs on the device; the only requests are for the model files in public/lab/tomato/.

import { browser, cast, dispose, expandDims, getBackend, ready, setBackend, tidy, zeros } from "@tensorflow/tfjs-core";
import type { Tensor } from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-cpu";
import "@tensorflow/tfjs-backend-webgl";
import { loadGraphModel, type GraphModel } from "@tensorflow/tfjs-converter";

export type Prediction = { name: string; p: number };

export type Classification = {
  /** The three most likely classes, most likely first. */
  top: Prediction[];
  /** "webgl" or "cpu". */
  backend: string;
  /** Model download, set-up and one warm-up run. Only on the first classification. */
  modelMs?: number;
  /** This image: resize, inference and reading the result back. */
  inferMs: number;
};

type Session = { model: GraphModel; labels: string[]; size: number; backend: string };

let session: Promise<Session> | null = null;

async function start(base: string): Promise<Session> {
  // WebGL first. setBackend resolves false (or throws) when the backend can't initialise, e.g.
  // without WebGL or with a blocked GPU; the CPU kernels are slower but work everywhere.
  const webgl = await setBackend("webgl").catch(() => false);
  if (!webgl) await setBackend("cpu");
  await ready();

  const [model, labels] = await Promise.all([
    loadGraphModel(`${base}model.json`),
    fetch(`${base}labels.json`).then((r) => {
      if (!r.ok) throw new Error(`labels.json: HTTP ${r.status}`);
      return r.json() as Promise<{ name: string }[]>;
    }),
  ]);
  const size = model.inputs[0]?.shape?.[1] ?? 224;

  // One run on a blank image compiles the WebGL shaders, so the timed run below is the real cost.
  const warm = model.predict(zeros([1, size, size, 3])) as Tensor;
  await warm.data();
  dispose(warm);

  return { model, labels: labels.map((l) => l.name), size, backend: getBackend() };
}

/**
 * The centre square of the image, resized to `size` x `size` on a canvas: what the model sees.
 * Large photos are halved step by step first, so the final resize averages pixels rather than
 * skipping most of them (a 4000 px photo straight to 224 px would alias).
 */
function centreSquare(img: HTMLImageElement, size: number) {
  let side = Math.min(img.naturalWidth, img.naturalHeight);
  let x = (img.naturalWidth - side) / 2;
  let y = (img.naturalHeight - side) / 2;
  let source: CanvasImageSource = img;
  const draw = (to: number) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = to;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D is not available.");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source, x, y, side, side, 0, 0, to, to);
    source = canvas;
    side = to;
    x = y = 0;
    return canvas;
  };
  while (side / 2 >= size * 2) draw(Math.round(side / 2));
  return draw(size);
}

/** Classifies a loaded <img>. The first call downloads and prepares the model (cached after). */
export async function classify(img: HTMLImageElement, base = "/lab/tomato/"): Promise<Classification> {
  const first = !session;
  const t0 = performance.now();
  session ??= start(base);
  let s: Session;
  try {
    s = await session;
  } catch (error) {
    session = null; // let the next press try again (e.g. after a dropped connection)
    throw error;
  }
  const t1 = performance.now();

  await img.decode();
  const canvas = centreSquare(img, s.size);
  const probs = tidy(() => s.model.predict(expandDims(cast(browser.fromPixels(canvas), "float32"), 0)) as Tensor);
  const p = await probs.data();
  dispose(probs);
  const t2 = performance.now();

  const top = Array.from(p, (value, i) => ({ name: s.labels[i] ?? `Class ${i + 1}`, p: value }))
    .sort((a, b) => b.p - a.p)
    .slice(0, 3);
  return { top, backend: s.backend, modelMs: first ? t1 - t0 : undefined, inferMs: t2 - t1 };
}
