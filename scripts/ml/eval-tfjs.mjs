// Measures a converted TF.js graph model on one split with the site's own TF.js packages, so the
// reported accuracy is that of the shipped files (quantised weights included).
//
// Usage (paths are placeholders; nothing here reads from the repo except the model):
//   node scripts/ml/eval-tfjs.mjs --model public/lab/tomato --images <tomato_dir> \
//     --split <work>/split.json --set test [--limit 200] [--out result.json] [--backend wasm]
//
// <tomato_dir> has one folder per class; split.json comes from train_tomato.py (README.md).
// Images are resized to 224 x 224 with sharp (bilinear), as the page draws them on a canvas.
// --backend cpu (default) is the site's fallback: pure JavaScript, ~0.5-2 s an image in Node.
// --backend wasm is the same float32 maths ~10x faster; it is not a site dependency, so install
// it for the run only: npm install --no-save @tensorflow/tfjs-backend-wasm@4.22.0

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import sharp from "sharp";
import * as tf from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-cpu";
import { loadGraphModel } from "@tensorflow/tfjs-converter";

const { values: args } = parseArgs({
  options: {
    model: { type: "string" },
    images: { type: "string" },
    split: { type: "string" },
    set: { type: "string", default: "test" },
    limit: { type: "string" },
    out: { type: "string" },
    batch: { type: "string", default: "16" },
    backend: { type: "string", default: "cpu" },
  },
});
if (!args.model || !args.images || !args.split) {
  console.error("usage: node scripts/ml/eval-tfjs.mjs --model <dir> --images <dir> --split <split.json> [--set test]");
  process.exit(1);
}

/** Reads model.json and its weight shards from disk (tfjs-core alone has no file:// loader). */
function fromDisk(dir) {
  return {
    async load() {
      const json = JSON.parse(await readFile(path.join(dir, "model.json"), "utf8"));
      const shards = [];
      for (const group of json.weightsManifest) {
        for (const p of group.paths) shards.push(await readFile(path.join(dir, p)));
      }
      const all = Buffer.concat(shards);
      return {
        modelTopology: json.modelTopology,
        format: json.format,
        generatedBy: json.generatedBy,
        convertedBy: json.convertedBy,
        signature: json.signature,
        userDefinedMetadata: json.userDefinedMetadata,
        weightSpecs: json.weightsManifest.flatMap((g) => g.weights),
        weightData: all.buffer.slice(all.byteOffset, all.byteOffset + all.byteLength),
      };
    },
  };
}

const SIZE = 224;
const labels = JSON.parse(await readFile(path.join(args.model, "labels.json"), "utf8"));
let items = JSON.parse(await readFile(args.split, "utf8"))[args.set];
if (args.limit) items = items.slice(0, Number(args.limit));

if (args.backend === "wasm") await import("@tensorflow/tfjs-backend-wasm");
if (!(await tf.setBackend(args.backend))) throw new Error(`backend ${args.backend} failed to start`);
const model = await loadGraphModel(fromDisk(args.model));
const n = labels.length;
const confusion = Array.from({ length: n }, () => new Array(n).fill(0));
const batch = Number(args.batch);
const t0 = performance.now();
let inferMs = 0;
/** [image, true label, predicted label, its probability], for --out. */
const predictions = [];

for (let i = 0; i < items.length; i += batch) {
  const chunk = items.slice(i, i + batch);
  const pixels = new Float32Array(chunk.length * SIZE * SIZE * 3);
  await Promise.all(
    chunk.map(async ([rel], j) => {
      const { data } = await sharp(path.join(args.images, rel))
        .removeAlpha()
        .resize(SIZE, SIZE, { fit: "cover", kernel: "linear" })
        .raw()
        .toBuffer({ resolveWithObject: true });
      pixels.set(Float32Array.from(data), j * SIZE * SIZE * 3);
    }),
  );
  const t = performance.now();
  const probs = tf.tidy(() => model.predict(tf.tensor4d(pixels, [chunk.length, SIZE, SIZE, 3])));
  const best = tf.argMax(probs, 1);
  const top = await best.data();
  const p = await probs.data();
  tf.dispose([probs, best]);
  inferMs += performance.now() - t;
  chunk.forEach(([rel, label], j) => {
    confusion[label][top[j]]++;
    predictions.push([rel, label, top[j], +p[j * n + top[j]].toFixed(4)]);
  });
  if ((i / batch) % 20 === 0) process.stdout.write(`  ${i + chunk.length}/${items.length}\r`);
}

const total = confusion.flat().reduce((a, b) => a + b, 0);
const correct = confusion.reduce((a, row, k) => a + row[k], 0);
const perClass = Object.fromEntries(
  labels.map((l, k) => [l.name, +(confusion[k][k] / Math.max(1, confusion[k].reduce((a, b) => a + b, 0))).toFixed(4)]),
);
const result = {
  model: args.model,
  backend: tf.getBackend(),
  set: args.set,
  images: total,
  accuracy: +(correct / total).toFixed(4),
  macroRecall: +(Object.values(perClass).reduce((a, b) => a + b, 0) / n).toFixed(4),
  perClassRecall: perClass,
  confusion,
  msPerImage: +(inferMs / total).toFixed(1),
  seconds: Math.round((performance.now() - t0) / 1000),
};
console.log(JSON.stringify({ ...result, confusion: undefined }, null, 1));
if (args.out) await writeFile(args.out, JSON.stringify({ ...result, predictions }));
