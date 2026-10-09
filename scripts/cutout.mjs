// Removes the white studio background from the portrait and bakes a soft depth map.
// Usage: node scripts/cutout.mjs
import sharp from "sharp";

const SRC = "assets/portrait-source.png";
const SIZE = 1024;

const { data, info } = await sharp(SRC)
  .resize(SIZE, SIZE)
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width: w, height: h } = info;
const isBackground = (i) => {
  const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
  const min = Math.min(r, g, b), max = Math.max(r, g, b);
  return min > 205 && max - min < 28;
};

// Flood fill from every border pixel so white areas inside the subject survive.
const bg = new Uint8Array(w * h);
const stack = [];
for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
while (stack.length) {
  const i = stack.pop();
  if (bg[i] || !isBackground(i)) continue;
  bg[i] = 1;
  const x = i % w, y = (i / w) | 0;
  if (x > 0) stack.push(i - 1);
  if (x < w - 1) stack.push(i + 1);
  if (y > 0) stack.push(i - w);
  if (y < h - 1) stack.push(i + w);
}

// Grow into light, desaturated fringe pixels (studio white seen through the hair)
// that touch the background. Hair is dark and skin is saturated, so both survive.
const isFringe = (i) => {
  const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
  const min = Math.min(r, g, b), max = Math.max(r, g, b);
  return min > 120 && max - min < 45;
};
for (let pass = 0; pass < 8; pass++) {
  const grow = [];
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      if (bg[i] || !isFringe(i)) continue;
      if (bg[i - 1] || bg[i + 1] || bg[i - w] || bg[i + w]) grow.push(i);
    }
  }
  if (!grow.length) break;
  for (const i of grow) bg[i] = 1;
}

const mask = Buffer.alloc(w * h);
for (let i = 0; i < w * h; i++) mask[i] = bg[i] ? 0 : 255;

// Feathered alpha, tightened slightly so the white fringe disappears.
const alpha = await sharp(mask, { raw: { width: w, height: h, channels: 1 } })
  .blur(1.2)
  .linear(1.25, -50)
  .extractChannel(0)
  .raw()
  .toBuffer();

// Pull any leftover white spill on the edge toward the subject's dark tones.
const rgba = Buffer.alloc(w * h * 4);
for (let i = 0; i < w * h; i++) {
  const a = alpha[i] / 255;
  const spill = a < 1 ? (1 - a) * 0.85 : 0;
  for (let c = 0; c < 3; c++) {
    rgba[i * 4 + c] = Math.round(data[i * 3 + c] * (1 - spill) + 30 * spill);
  }
  rgba[i * 4 + 3] = alpha[i];
}

await sharp(rgba, { raw: { width: w, height: h, channels: 4 } })
  .webp({ quality: 84, alphaQuality: 90, effort: 6 })
  .toFile("public/portrait.webp");

// Depth: a heavily blurred silhouette gives a rounded "pillow" relief.
await sharp(mask, { raw: { width: w, height: h, channels: 1 } })
  .resize(256, 256)
  .blur(14)
  .webp({ quality: 80 })
  .toFile("public/portrait-depth.webp");

console.log("wrote public/portrait.webp and public/portrait-depth.webp");
