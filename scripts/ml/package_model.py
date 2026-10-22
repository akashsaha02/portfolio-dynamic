"""Assemble public/lab/tomato/ from a finished run: the chosen TF.js model, labels.json, meta.json
(with the accuracy measured by eval-tfjs.mjs on those exact files) and sample photos (WebP).

    python package_model.py --work <work> --images <tomato_dir> --format float16 --out public/lab/tomato

Reads from <work>: split.json, labels.json, keras_eval.json, history.json, tfjs/<format>/,
eval/val-<format>.json for every converted format and eval/test-<format>.json for the chosen one.
Samples: one random test photo (fixed seed) from each of SAMPLE_CLASSES, never picked by result.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import random
import shutil
from pathlib import Path

from PIL import Image

SAMPLE_CLASSES = [
    "Tomato___Early_blight",
    "Tomato___Late_blight",
    "Tomato___Septoria_leaf_spot",
    "Tomato___Bacterial_spot",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
    "Tomato___healthy",
]
SEED = 1307
# Display order only; the draw above keeps its order (and so its photos). The drawn early-blight
# photo is one the model gets wrong (late blight, 51%): it stays, as the weakest class's honest
# example, but last, so the sample selected on arrival is not the one miss.
DISPLAY_ORDER = [
    "Tomato___Late_blight",
    "Tomato___Septoria_leaf_spot",
    "Tomato___Bacterial_spot",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
    "Tomato___healthy",
    "Tomato___Early_blight",
]


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--work", required=True)
    p.add_argument("--images", required=True)
    p.add_argument("--format", required=True, choices=["float32", "float16", "uint8"])
    p.add_argument("--out", required=True)
    p.add_argument("--train-minutes", type=int, required=True, help="wall-clock training time, for meta.json")
    args = p.parse_args()

    work, images, out = Path(args.work), Path(args.images), Path(args.out)
    split = json.loads((work / "split.json").read_text(encoding="utf-8"))
    labels = json.loads((work / "labels.json").read_text(encoding="utf-8"))
    keras_eval = json.loads((work / "keras_eval.json").read_text(encoding="utf-8"))
    history = json.loads((work / "history.json").read_text(encoding="utf-8"))
    test = json.loads((work / "eval" / f"test-{args.format}.json").read_text(encoding="utf-8"))
    val = {
        f: json.loads((work / "eval" / f"val-{f}.json").read_text(encoding="utf-8"))
        for f in ("float32", "float16", "uint8")
        if (work / "eval" / f"val-{f}.json").exists()
    }

    # Model files: replace whatever is there (model.json + shards), keep nothing stale.
    out.mkdir(parents=True, exist_ok=True)
    for old in list(out.glob("group*-shard*.bin")) + [out / "model.json"]:
        old.unlink(missing_ok=True)
    src = work / "tfjs" / args.format
    model_files = ["model.json"] + sorted(f.name for f in src.glob("group*-shard*.bin"))
    for name in model_files:
        shutil.copy2(src / name, out / name)
    model_bytes = sum((out / f).stat().st_size for f in model_files)
    (out / "labels.json").write_text(json.dumps(labels, indent=2) + "\n", encoding="utf-8")

    # Samples: one per class, seeded, from the test split; WebP at the source's 256 x 256.
    rng = random.Random(SEED)
    sample_dir = out / "samples"
    if sample_dir.exists():
        shutil.rmtree(sample_dir)
    sample_dir.mkdir()
    predicted = {row[0]: row for row in test["predictions"]}
    names = {l["id"]: l["name"] for l in labels}
    samples = []
    for cls in SAMPLE_CLASSES:
        rel = rng.choice(sorted(r for r, _ in split["test"] if r.startswith(cls + "/")))
        name = names[cls]
        file = f"samples/{name.lower().replace(' ', '-').replace('(', '').replace(')', '')}.webp"
        with Image.open(images / rel) as im:
            im.convert("RGB").save(out / file, "WEBP", quality=82, method=6)
        _, label, pred, prob = predicted[rel]
        samples.append({
            "class": cls,
            "file": file,
            "label": name,
            "source": f"PlantVillage raw/color/{rel}",
            "bytes": (out / file).stat().st_size,
            "predicted": labels[pred]["name"],
            "probability": prob,
        })
    samples.sort(key=lambda s: DISPLAY_ORDER.index(s.pop("class")))

    epochs_ft = len(history["finetune"]["val_accuracy"])
    best_epoch = 1 + max(range(epochs_ft), key=lambda i: history["finetune"]["val_accuracy"][i])
    meta = {
        "title": "Tomato leaf classifier (demo)",
        "date": dt.date.today().isoformat(),
        "task": "Classifies a photo of one tomato leaf into 10 classes: 9 diseases or pests, or healthy.",
        "model": {
            "name": "MobileNetV3-Small",
            "backbone": "MobileNetV3-Small",
            "weightsInit": "ImageNet (keras.applications, alpha 1.0, 224 x 224)",
            "head": "Global average pooling, dropout 0.2, dense softmax over 10 classes",
            "parameters": keras_eval["parameters"],
            "training": (
                f"First the new layer alone for {len(history['head']['val_accuracy'])} rounds (epochs), then the "
                f"whole network for {epochs_ft} more at a small, decaying learning rate; the best round on the "
                f"validation photos (round {best_epoch}) was kept. About {args.train_minutes} minutes on a "
                "laptop CPU, no GPU."
            ),
            "augmentation": (
                "Each training photo is randomly cropped, flipped, turned and lightened or darkened, so the "
                "model can't just memorise how the dataset's photos were framed."
            ),
            "details": {
                "optimizer": "Adam",
                "learningRate": "1e-3 (head), then 3e-4 with cosine decay to 1.5e-5 (fine-tuning)",
                "batchSize": 32,
                "labelSmoothing": 0.1,
                "batchNorm": "frozen statistics (inference mode) throughout",
                "augmentation": "random square crop of 70-100% of the short side, horizontal and vertical "
                "flips, rotation up to +/-29 degrees (reflect fill), brightness and contrast +/-15%",
                "framework": "TensorFlow 2.21.0, Keras 3.15.1, Python 3.12",
            },
        },
        "input": {
            "size": 224,
            "channels": "RGB",
            "range": "0-255",
            "layout": "NHWC, batch of 1",
            "preprocessing": "Centre square crop, resized to 224 x 224 RGB, values 0-255 as float32 "
            "(the model rescales them to -1..1 itself).",
        },
        "output": "Softmax probabilities over 10 classes, in the order of labels.json",
        "files": {
            "format": "TensorFlow.js graph model (tensorflowjs 4.22.0 converter)",
            "weights": args.format,
            "bytes": model_bytes,
            "list": model_files,
            "runtime": "@tensorflow/tfjs-core + tfjs-converter 4.22.0, WebGL backend, CPU backend fallback",
        },
        "dataset": {
            "name": "PlantVillage, tomato leaves (colour images)",
            "url": "https://huggingface.co/datasets/mohanty/PlantVillage",
            "repository": "https://github.com/spMohanty/PlantVillage-Dataset",
            "licence": "CC BY-SA 3.0",
            "licenceUrl": "https://creativecommons.org/licenses/by-sa/3.0/",
            "licenceSource": "Hughes & Salathé (2015), arXiv:1511.08060: images released under CC BY-SA 3.0 "
            "Unported, 'with the clarification that algorithms trained on the data fall under the same license'.",
            "credit": "Hughes & Salathé, 2015; Mohanty, Hughes & Salathé, 2016",
            "citation": [
                "D. P. Hughes and M. Salathé, An open access repository of images on plant health to enable "
                "the development of mobile disease diagnostics, arXiv:1511.08060, 2015.",
                "S. P. Mohanty, D. P. Hughes and M. Salathé, Using deep learning for image-based plant disease "
                "detection, Frontiers in Plant Science 7:1419, 2016. doi:10.3389/fpls.2016.01419",
            ],
            "images": sum(len(v) for v in split.values()),
            "train": len(split["train"]),
            "val": len(split["val"]),
            "test": len(split["test"]),
            "split": "80/10/10 per class, by leaf: the dataset's leaf map (leaf_grouping/leaf-map.json), "
            "'Leaf N' names, and blocks of 20 consecutive photo numbers for unmapped camera series, so "
            "photos of one leaf never cross splits (seed 1307). Stricter than the dataset's own 80/20 "
            "split, which leaves 37% of tomato photos ungrouped.",
        },
        "val": {f: {"images": v["images"], "accuracy": v["accuracy"]} for f, v in val.items()},
        "test": {
            "images": test["images"],
            "accuracy": test["accuracy"],
            "macroRecall": test["macroRecall"],
            "perClassRecall": test["perClassRecall"],
            "confusion": test["confusion"],
            "measured": f"These files, TensorFlow.js 4.22.0 ({test['backend']} backend) in Node, images "
            "resized to 224 x 224 with sharp. Read once, after the format was chosen on the validation photos.",
            "kerasFloat32Accuracy": keras_eval["test"]["accuracy"],
        },
        "licence": {
            "model": "CC BY-SA 3.0",
            "samples": "CC BY-SA 3.0 (PlantVillage photos, re-encoded as WebP)",
            "why": "The dataset's terms put algorithms trained on it under the same licence.",
        },
        "samples": samples,
        "limits": [
            "PlantVillage photos show single leaves, picked and laid on a plain grey or black sheet, shot "
            "outdoors in daylight; leaves on the plant, busy backgrounds or other lighting will fool it more often.",
            "It only knows these ten classes, so a photo of another plant, another disease or no leaf at all "
            "still gets one of them, sometimes with high confidence.",
            "Test accuracy is measured on PlantVillage photos only, so it says little about photos from a field.",
        ],
        "notThePaper": "Not the model from Comparative Performance of Deep Learning Algorithms in Tomato Disease "
        "Detection (IEEE CONIT 2025): a separate, much smaller model trained for this page.",
    }
    (out / "meta.json").write_text(json.dumps(meta, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"bytes": model_bytes, "test": test["accuracy"], "samples": samples}, indent=1))


if __name__ == "__main__":
    main()
