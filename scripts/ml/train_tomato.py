"""Train the /lab tomato-leaf classifier and export it as a TensorFlow SavedModel.

MobileNetV3-Small (ImageNet weights) fine-tuned on the 10 tomato classes of PlantVillage
(colour images), split 80/10/10 by leaf so that photos of the same leaf never end up in two
splits. The test split is only read once, after training, by `evaluate`.

    python train_tomato.py split    --images <tomato_dir> --leaf-map <leaf-map.json> --out <work>
    python train_tomato.py train    --images <tomato_dir> --out <work>
    python train_tomato.py evaluate --images <tomato_dir> --out <work>

<tomato_dir> holds one folder per class (Tomato___Early_blight/…), as in the dataset's
raw/color/ folder. See README.md for where to get the data and how to convert the result.
"""

from __future__ import annotations

import argparse
import collections
import json
import random
import re
import time
from pathlib import Path

# Model output order. Folder names from the dataset; display names in plain English.
CLASSES = [
    ("Tomato___Bacterial_spot", "Bacterial spot"),
    ("Tomato___Early_blight", "Early blight"),
    ("Tomato___Late_blight", "Late blight"),
    ("Tomato___Leaf_Mold", "Leaf mould"),
    ("Tomato___Septoria_leaf_spot", "Septoria leaf spot"),
    ("Tomato___Spider_mites Two-spotted_spider_mite", "Spider mites (two-spotted)"),
    ("Tomato___Target_Spot", "Target spot"),
    ("Tomato___Tomato_Yellow_Leaf_Curl_Virus", "Yellow leaf curl virus"),
    ("Tomato___Tomato_mosaic_virus", "Mosaic virus"),
    ("Tomato___healthy", "Healthy"),
]
IMG = 224
SEED = 1307


# ------------------------------------------------------------------------------------------------
# Split by leaf
# ------------------------------------------------------------------------------------------------


def leaf_group(cls: str, file_name: str, leaf_map: dict[str, list[str]]) -> str:
    """The physical leaf (or a conservative group of photos) an image belongs to.

    1. The dataset maintainers' leaf map (leaf_grouping/leaf-map.json), matched as in their
       Hugging Face loader: mapped leaves have exactly 4 photos each.
    2. Names such as "GH_HL Leaf 466.1" or "GHLB_PS Leaf 18.2 Day 8": everything under
       "Leaf 466" / "Leaf 18" (the same leaf on another day or shot).
    3. Anything else is a camera series ("UF.GRC_YLCV_Lab 02393"): the photographers took 4-7
       consecutive shots per leaf, so blocks of 20 consecutive numbers stay together.
    """
    ident = file_name.replace("_final_masked", "")
    if "___" in ident:
        ident = ident.split("___")[-1]
    ident = ident.split("copy")[0]
    ident = re.sub(r"\.(jpe?g|png)$", "", ident, flags=re.I).strip()
    key = ident.lower()
    hits = leaf_map.get(key)
    if hits:
        if len(hits) == 1:
            return hits[0]
        for h in hits:
            if cls in h:
                return h
    m = re.match(r"^(.*?leaf\s*\d+)", key)
    if m:
        return f"{cls}:{m.group(1)}"
    m = re.match(r"^(.*?)(\d+)\s*$", key)
    if m:
        return f"{cls}:{m.group(1)}#{int(m.group(2)) // 20}"
    return f"{cls}:{key}"


def cmd_split(args: argparse.Namespace) -> None:
    leaf_map = json.loads(Path(args.leaf_map).read_text(encoding="utf-8"))
    rng = random.Random(SEED)
    images = Path(args.images)
    splits: dict[str, list[list]] = {"train": [], "val": [], "test": []}
    for label, (folder, _) in enumerate(CLASSES):
        files = sorted(p.name for p in (images / folder).iterdir() if p.is_file())
        groups: dict[str, list[str]] = collections.defaultdict(list)
        for f in files:
            groups[leaf_group(folder, f, leaf_map)].append(f)
        keys = sorted(groups)
        rng.shuffle(keys)
        target = {"test": 0.1 * len(files), "val": 0.1 * len(files)}
        counts = {"test": 0, "val": 0}
        for k in keys:
            name = "test" if counts["test"] < target["test"] else "val" if counts["val"] < target["val"] else "train"
            if name != "train":
                counts[name] += len(groups[k])
            splits[name].extend([f"{folder}/{f}", label] for f in groups[k])
        print(f"{folder}: {len(files)} images in {len(groups)} groups -> test {counts['test']}, val {counts['val']}")
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    (out / "split.json").write_text(json.dumps(splits, indent=0), encoding="utf-8")
    labels = [{"id": folder, "name": name} for folder, name in CLASSES]
    (out / "labels.json").write_text(json.dumps(labels, indent=2) + "\n", encoding="utf-8")
    print({k: len(v) for k, v in splits.items()})


def load_split(out: Path) -> dict[str, list[list]]:
    return json.loads((out / "split.json").read_text(encoding="utf-8"))


# ------------------------------------------------------------------------------------------------
# Data pipeline and model
# ------------------------------------------------------------------------------------------------


def dataset(tf, items, images: Path, batch: int, training: bool):
    paths = [str(images / p) for p, _ in items]
    labels = [y for _, y in items]
    ds = tf.data.Dataset.from_tensor_slices((paths, labels))
    if training:
        ds = ds.shuffle(len(items), seed=SEED, reshuffle_each_iteration=True)

    def load(path, label):
        x = tf.io.decode_image(tf.io.read_file(path), channels=3, expand_animations=False)
        x = tf.cast(x, tf.float32)
        if training:
            # Random square crop of 70-100% of the short side: framing and scale vary in photos.
            side = tf.cast(tf.reduce_min(tf.shape(x)[:2]), tf.float32)
            size = tf.cast(side * tf.random.uniform([], 0.7, 1.0), tf.int32)
            x = tf.image.random_crop(x, tf.stack([size, size, 3]))
        x = tf.image.resize(x, (IMG, IMG), antialias=True)
        return x, tf.one_hot(label, len(CLASSES))

    ds = ds.map(load, num_parallel_calls=tf.data.AUTOTUNE).batch(batch)
    if training:
        from keras import layers, Sequential

        augment = Sequential(
            [
                layers.RandomFlip("horizontal_and_vertical", seed=SEED),
                layers.RandomRotation(0.08, fill_mode="reflect", seed=SEED),
                layers.RandomBrightness(0.15, value_range=(0, 255), seed=SEED),
                layers.RandomContrast(0.15, seed=SEED),
            ]
        )
        ds = ds.map(
            lambda x, y: (tf.clip_by_value(augment(x, training=True), 0.0, 255.0), y),
            num_parallel_calls=tf.data.AUTOTUNE,
        )
    return ds.prefetch(tf.data.AUTOTUNE)


def build_model(keras):
    """Input: a batch of 224x224 RGB images with values 0-255 (the backbone rescales them)."""
    from keras import layers

    base = keras.applications.MobileNetV3Small(
        input_shape=(IMG, IMG, 3),
        include_top=False,
        weights="imagenet",
        include_preprocessing=True,
    )
    inputs = keras.Input((IMG, IMG, 3), name="image")
    # training=False keeps the backbone's batch norm in inference mode, also while fine-tuning.
    x = base(inputs, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dropout(0.2)(x)
    outputs = layers.Dense(len(CLASSES), activation="softmax", name="probabilities")(x)
    return keras.Model(inputs, outputs, name="tomato_leaf_mobilenetv3s"), base


def cmd_train(args: argparse.Namespace) -> None:
    import tensorflow as tf
    import keras

    keras.utils.set_random_seed(SEED)
    out = Path(args.out)
    images = Path(args.images)
    split = load_split(out)
    train = dataset(tf, split["train"], images, args.batch, training=True)
    val = dataset(tf, split["val"], images, args.batch, training=False)
    if args.limit:
        train, val = train.take(args.limit), val.take(max(1, args.limit // 4))
    model, base = build_model(keras)
    loss = keras.losses.CategoricalCrossentropy(label_smoothing=0.1)
    history = {}

    # Stage 1: only the new classifier learns.
    base.trainable = False
    model.compile(optimizer=keras.optimizers.Adam(1e-3), loss=loss, metrics=["accuracy"])
    t0 = time.time()
    h = model.fit(train, validation_data=val, epochs=args.head_epochs, verbose=2)
    history["head"] = h.history
    print(f"stage 1: {time.time() - t0:.0f}s", flush=True)

    # Stage 2: fine-tune the whole network at a low, decaying learning rate; keep the best epoch.
    base.trainable = True
    steps = (args.limit or len(train)) * args.epochs
    lr = keras.optimizers.schedules.CosineDecay(args.lr, decay_steps=steps, alpha=0.05)
    model.compile(optimizer=keras.optimizers.Adam(lr), loss=loss, metrics=["accuracy"])
    best = str(out / "best.weights.h5")
    callbacks = [
        keras.callbacks.ModelCheckpoint(best, monitor="val_accuracy", save_best_only=True, save_weights_only=True),
        keras.callbacks.CSVLogger(str(out / "finetune_log.csv")),
    ]
    t0 = time.time()
    h = model.fit(train, validation_data=val, epochs=args.epochs, callbacks=callbacks, verbose=2)
    history["finetune"] = h.history
    print(f"stage 2: {time.time() - t0:.0f}s", flush=True)
    model.load_weights(best)
    model.save(str(out / "model.keras"))
    (out / "history.json").write_text(json.dumps(history, indent=1), encoding="utf-8")
    model.export(str(out / "saved_model"))
    print("exported", out / "saved_model", flush=True)


def cmd_evaluate(args: argparse.Namespace) -> None:
    """Float32 Keras accuracy on val and (once) on test, per class, with a confusion matrix."""
    import numpy as np
    import tensorflow as tf
    import keras

    out = Path(args.out)
    images = Path(args.images)
    split = load_split(out)
    model = keras.models.load_model(str(out / "model.keras"))
    report = {"parameters": int(model.count_params())}
    for name in ("val", "test"):
        ds = dataset(tf, split[name], images, args.batch, training=False)
        probs = model.predict(ds, verbose=0)
        y = np.array([label for _, label in split[name]])
        pred = probs.argmax(1)
        cm = np.zeros((len(CLASSES), len(CLASSES)), dtype=int)
        for t, p in zip(y, pred):
            cm[t, p] += 1
        recall = {CLASSES[i][1]: round(float(cm[i, i] / max(1, cm[i].sum())), 4) for i in range(len(CLASSES))}
        report[name] = {
            "images": int(len(y)),
            "accuracy": round(float((pred == y).mean()), 4),
            "macro_recall": round(float(np.mean(list(recall.values()))), 4),
            "per_class_recall": recall,
            "confusion": cm.tolist(),
        }
        print(name, report[name]["accuracy"], report[name]["macro_recall"], flush=True)
    (out / "keras_eval.json").write_text(json.dumps(report, indent=1), encoding="utf-8")


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("command", choices=["split", "train", "evaluate"])
    p.add_argument("--images", required=True, help="folder with one sub-folder per tomato class")
    p.add_argument("--leaf-map", help="leaf_grouping/leaf-map.json from the dataset (split only)")
    p.add_argument("--out", required=True, help="work folder: split.json, weights, saved_model/")
    p.add_argument("--batch", type=int, default=32)
    p.add_argument("--head-epochs", type=int, default=2)
    p.add_argument("--epochs", type=int, default=8, help="fine-tuning epochs")
    p.add_argument("--lr", type=float, default=3e-4, help="fine-tuning learning rate (cosine decay)")
    p.add_argument("--limit", type=int, default=0, help="batches per epoch, for a quick smoke run")
    args = p.parse_args()
    {"split": cmd_split, "train": cmd_train, "evaluate": cmd_evaluate}[args.command](args)


if __name__ == "__main__":
    main()
