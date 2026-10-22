# Decision: the /lab tomato-leaf model (work plan 6.7)

Date: 2026-10-22.

`/lab` runs a tomato-leaf disease classifier in the visitor's browser. This page says what was trained, on what, how accurate it is, under which licence, and where it falls short. How to reproduce it: [scripts/ml/README.md](../../scripts/ml/README.md).

**It is not the model from Akash's paper** ("Comparative Performance of Deep Learning Algorithms in Tomato Disease Detection", IEEE CONIT 2025, where VGG16 reached 96%). It is a separate, much smaller network, trained for this page so it downloads quickly and runs on a phone. The two accuracies are not comparable: they come from different data splits, preprocessing and models. The page says so twice: in the Research block and in the classifier's own note.

## What was trained

| | |
| --- | --- |
| Task | One photo of one tomato leaf → 10 classes: bacterial spot, early blight, late blight, leaf mould, Septoria leaf spot, spider mites, target spot, yellow leaf curl virus, mosaic virus, healthy |
| Model | MobileNetV3-Small (alpha 1.0), ImageNet weights from `keras.applications`. Global average pooling, dropout 0.2 and a 10-way softmax on top. 944,890 parameters |
| Input | 224 × 224 RGB, values 0–255; the model rescales to −1..1 itself. The page crops the photo to its centre square and resizes it on a canvas, halving large photos step by step first |
| Training | Two rounds (epochs) training only the new layer (Adam 1e-3). Then six rounds fine-tuning the whole network (Adam 3e-4, cosine decay), with batch-norm statistics frozen, label smoothing 0.1 and batch size 32. The round with the best validation accuracy (round 5) was kept. About 110 minutes on a laptop CPU (Ryzen 5 PRO 5650U), no GPU. TensorFlow 2.21.0, Keras 3.15.1 |
| Augmentation | Random square crop of 70–100% of the short side, horizontal and vertical flips, rotation up to ±29°, brightness and contrast ±15% |
| Files | TF.js graph model (tensorflowjs 4.22.0 converter), float16 weights: `model.json` (206 KB, 7 KB gzipped) plus one 1.86 MB shard (1.72 MB gzipped), 2.07 MB in all, in `public/lab/tomato/` with `labels.json`, `meta.json` and `samples/` |

## Data and licence

- **Source:** PlantVillage, colour images, the 10 tomato classes (18,160 photos), from the Hugging Face copy published by the dataset's authors ([mohanty/PlantVillage](https://huggingface.co/datasets/mohanty/PlantVillage); the same files as [spMohanty/PlantVillage-Dataset](https://github.com/spMohanty/PlantVillage-Dataset)). Only the tomato members were downloaded from its `data.zip`, about 390 MB of 2.2 GB, with HTTP range requests.
- **Licence: CC BY-SA 3.0, which also covers the model.** The GitHub repo has no licence file. The Hugging Face card says `cc-by-sa-3.0`, but its loader marks that as an assumption. The primary source settles it. Hughes & Salathé (2015, [arXiv:1511.08060](https://arxiv.org/abs/1511.08060)) state that the images are "released under the Creative Commons Attribution-ShareAlike 3.0 Unported (CC BY-SA 3.0), with the clarification that algorithms trained on the data fall under the same license."
  - So the model files and the six sample photos in `public/lab/tomato/` are CC BY-SA 3.0, with attribution.
  - The page credits the dataset and links the licence.
  - `meta.json` records all of this.
  - The site's own code is not affected.
- **Other copies were not used.** The Mendeley "augmented PlantVillage" (labelled CC0 there) is a third party's re-upload and includes augmented images. Kaggle copies carry whatever licence the uploader chose.

## Split: by leaf, stricter than the dataset's own

PlantVillage has 4–7 photos of each leaf, turned between shots. A random split puts photos of the same leaf in train and test, which inflates the score. The dataset's own 80/20 split groups leaves with its leaf map, but 37% of tomato photos are not in that map. Those photos are split one by one, and for example 111 "GH_HL Leaf N" leaves land in both halves.

`train_tomato.py split` groups photos as follows, then splits 80/10/10 per class with seed 1307:
1. The leaf map, where it covers a photo.
2. Otherwise the "Leaf N" part of the name.
3. Otherwise blocks of 20 consecutive photo numbers from the same camera series.

Result: 14,439 train, 1,857 validation and 1,864 test photos. Mosaic virus is coarse here: 373 photos in 20 groups, so its 40 test photos come from 2 groups and its per-class figure is noisy.

## Accuracy

The test split was used once, at the end, after the weight format had been chosen on validation. All TF.js figures come from `scripts/ml/eval-tfjs.mjs`. It runs the site's own TF.js 4.22 packages in Node on the exact files, with the WASM backend: the same float32 maths as the site's WebGL and CPU backends, about 25 times faster than the CPU backend in Node.

| Weights | Size (model.json + shard) | Validation accuracy (1,857) |
| --- | --- | --- |
| float32 | 3.9 MB | 97.68% (Keras float32: 97.68%) |
| float16 | 2.1 MB | 97.63% |
| uint8 | 1.1 MB | 95.26% |

**Shipped: float16.** It keeps validation accuracy (one photo of 1,857 differs from float32) at about half the size, well inside the 5 MB budget. uint8 loses 2.4 points. The TF.js converter quantises each weight tensor with a single scale after folding batch norm into the convolutions, and MobileNet's depthwise filters then span very different ranges per channel. A mixed map (uint8 for the pointwise convolutions, float16 for the rest) might save about 0.7 MB more, but it was not tried.

**Test accuracy of the shipped files: 97.64% on 1,864 photos.** Macro recall is 96.77%; the Keras float32 model also scores 97.64%. A spot check on the CPU backend, the site's fallback, gave the same prediction as WASM for all of the first 200 test photos.

| Class | Test photos | Right | Most common mistake |
| --- | --- | --- | --- |
| Bacterial spot | 216 | 97.7% | late blight, healthy (2 each) |
| Early blight | 100 | **81.0%** | late blight (11), leaf mould (4) |
| Late blight | 191 | 100% | — |
| Leaf mould | 96 | 100% | — |
| Septoria leaf spot | 188 | 96.3% | late blight (4) |
| Spider mites (two-spotted) | 168 | 100% | — |
| Target spot | 160 | **93.1%** | spider mites (9) |
| Yellow leaf curl virus | 544 | 99.6% | late blight (2) |
| Mosaic virus | 40 | 100% | — (only 2 leaf groups, noisy) |
| Healthy | 161 | 100% | — |

Early blight is the weak class: most of its misses are called late blight, whose brown lesions look much alike at 224 px. Class weighting, more fine-tuning rounds or a larger input are the obvious next tries.

## Limits (also on the page)

- PlantVillage photos show single detached leaves laid on a plain grey or black sheet, shot outdoors in daylight. Leaves on the plant, busy backgrounds, other lighting or other cameras will fool the model more often. The test score says nothing about field photos.
- It only knows these ten classes. A photo of another plant, another disease or no leaf at all still gets one of them, sometimes with high confidence. The probabilities are not calibrated against photos like yours.
- The six samples are random test photos (one per class for six of the ten classes, fixed seed), not picked for being right. Five come out right, with 88–96% confidence. The early-blight photo comes out as late blight: 51% from the original JPEG in Node, 57.5% from the WebP in the browser, with early blight second at 23.6%. It is kept as an honest example of the weakest class, and shown last so that the sample selected on arrival isn't the one miss. `meta.json` records each sample's prediction.
- Not agricultural advice; the page says so.

## In the browser

- **Nothing from TF.js loads until Classify.** `ClassifierDemo` calls `import("./inference")` in the click handler. That chunk brings `@tensorflow/tfjs-core`, `tfjs-converter`, `tfjs-backend-webgl` and `tfjs-backend-cpu` (all pinned to 4.22.0), then fetches `model.json`, the shard and `labels.json`. WebGL is tried first, with the CPU kernels as fallback. One warm-up run compiles the shaders, so the timing shown for the photo is the real per-photo cost.
- **Privacy.** The photo never leaves the device: it is read into an `<img>` from an object URL and drawn on a canvas.
- **JS budget, measured on this build** (`next build` with `NEXT_DIST_DIR=.next-lab`, then `next start`):
  - First load is the same 157.5 KB gz of modern scripts on `/`, `/lab`, `/about`, `/work` and `/contact`, against QA's 161 KB on 2026-10-21.
  - `ClassifierDemo` is the only new first-load code: 5.1 KB raw, **1.7 KB gz** in its chunk.
  - It ships on every route, because all template pages share one route graph (`templates/types.ts`). `next/image` was already in that chunk.
  - No TF.js code is in any first-load script, and no initial HTML references its chunks.
  - On the first Classify the browser loads two chunks, 819 KB raw and 200 KB gz (TF.js plus `inference.ts`), then `model.json` (7 KB gz), the 1.86 MB shard and `labels.json`.
  - A custom TF.js kernel bundle, registering only the dozen or so kernels this graph uses, would shrink the 200 KB. Not done.
- **Tried in Chromium** (Playwright script, not part of the suite; SwiftShader WebGL):
  - Zero model or TF.js requests before Classify.
  - All six samples and an uploaded photo classify, at 90–180 ms per photo in software WebGL. The first run spent 3.8 s loading the model locally.
  - No console errors.
  - No horizontal scroll at 320, 360 or 1280 px.
  - Every control was at least 44 px except two inline credit links. Those now use the 44 px fact-link style; that change was not re-run in the browser.
- **Conversion quirk.** With oneDNN graph rewrites on (the x86 default), TensorFlow fuses MobileNetV3's hard-swish into `_FusedConv2D(_FusedHardSwish)`, which no TF.js backend implements. The model would load and then fail on its first prediction. `convert_tfjs.py` turns the rewrites off and fails the conversion if any fused op TF.js lacks is left.
- **Future CSP.** A script-src CSP (open item from 4.5) needs nothing extra for WebGL or CPU. A WASM backend would need `'wasm-unsafe-eval'`. `Permissions-Policy: camera=()` does not affect `<input capture>`, which hands off to the system camera.
