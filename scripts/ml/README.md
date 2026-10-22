# Tomato-leaf model for /lab (work plan 6.7)

How the model in `public/lab/tomato/` was made, and how to make it again. What it is, how accurate it is and its limits: [docs/decisions/ml-lab.md](../../docs/decisions/ml-lab.md). Nothing here is needed to build or run the site.

Keep data, the Python environment and the training output **outside the repo**. `<work>`, `<data>` and `<venv>` below are placeholders for folders you choose. The whole run needs about 3 GB: the images are 0.3 GB, the virtual environment with TensorFlow is about 2 GB, and the work folder is under 0.1 GB.

## Files

| File | What it does |
| --- | --- |
| `fetch_tomato.py` | Downloads only the 18,160 tomato colour images (about 390 MB) from the 2.2 GB PlantVillage `data.zip` on Hugging Face, using HTTP range requests. Standard library only |
| `train_tomato.py` | `split`: leaf-grouped 80/10/10 split and `labels.json`. `train`: MobileNetV3-Small, head then fine-tune, SavedModel export. `evaluate`: float32 Keras accuracy on val and test |
| `convert_tfjs.py` | SavedModel → TF.js graph models in float32, float16 and uint8 |
| `eval-tfjs.mjs` | Accuracy of a converted model, measured with the site's own TF.js packages (Node) |
| `package_model.py` | Copies the chosen model into `public/lab/tomato/` and writes `labels.json`, `meta.json` and the sample WebPs |

## Steps

Python 3.12. TensorFlow 2.21 doesn't support Python 3.13+ on Windows. Any CPU works; a GPU just makes it faster. The published run took about 110 minutes on a 6-core laptop CPU.

```sh
# 1. Environment (uv shown; plain venv + pip works too)
uv venv --python 3.12 <venv>
uv pip install --python <venv> tensorflow==2.21.0 pillow
uv pip install --python <venv> --no-deps tensorflowjs==4.22.0   # see "Converter quirks"

# 2. Data: one folder per class under <data>/tomato, plus the dataset's leaf map
python -I scripts/ml/fetch_tomato.py <data>/tomato
curl -L -o <data>/leaf-map.json https://huggingface.co/datasets/mohanty/PlantVillage/resolve/main/leaf_grouping/leaf-map.json

# 3. Split, train, evaluate (Keras, float32)
python -I scripts/ml/train_tomato.py split    --images <data>/tomato --leaf-map <data>/leaf-map.json --out <work>
python -I scripts/ml/train_tomato.py train    --images <data>/tomato --out <work> --head-epochs 2 --epochs 6
python -I scripts/ml/train_tomato.py evaluate --images <data>/tomato --out <work>

# 4. Convert, then measure each format on the validation split in TF.js
python -I scripts/ml/convert_tfjs.py --saved-model <work>/saved_model --out <work>/tfjs
npm install --no-save @tensorflow/tfjs-backend-wasm@4.22.0      # optional, ~25x faster than --backend cpu
for f in float32 float16 uint8; do
  cp <work>/labels.json <work>/tfjs/$f/
  node scripts/ml/eval-tfjs.mjs --backend wasm --model <work>/tfjs/$f --images <data>/tomato \
    --split <work>/split.json --set val --out <work>/eval/val-$f.json
done

# 5. Pick the smallest format that holds validation accuracy, and only then read the test split
node scripts/ml/eval-tfjs.mjs --backend wasm --model <work>/tfjs/float16 --images <data>/tomato \
  --split <work>/split.json --set test --out <work>/eval/test-float16.json

# 6. Publish into the site
python -I scripts/ml/package_model.py --work <work> --images <data>/tomato --format float16 \
  --out public/lab/tomato --train-minutes 110
```

Run `node` from the repo root so it finds the site's `@tensorflow/*` packages and `sharp`. Run Python with `-I`, which keeps the downloaded data's folder off the import path.

## Converter quirks (tensorflowjs 4.22.0)

- Its pip dependencies include TensorFlow Decision Forests, which has no Windows build, plus JAX, Flax and TF Hub. Converting a SavedModel uses none of them. Install with `--no-deps`; `convert_tfjs.py` puts empty stand-in modules in place of whichever are missing.
- On x86 TensorFlow builds, oneDNN graph rewrites fuse MobileNetV3's hard-swish into `_FusedConv2D(..., _FusedHardSwish)`, which no TF.js backend implements. The model then loads but fails on the first prediction. `convert_tfjs.py` sets `TF_ENABLE_ONEDNN_OPTS=0` and refuses to finish if any fused op TF.js lacks is left.

## Licence

PlantVillage images are CC BY-SA 3.0, "with the clarification that algorithms trained on the data fall under the same license" (Hughes & Salathé 2015, arXiv:1511.08060). So the published model files and sample photos are CC BY-SA 3.0. These scripts are part of the site's code.
