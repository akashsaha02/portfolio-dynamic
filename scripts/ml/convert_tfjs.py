"""Convert the SavedModel from train_tomato.py into TF.js graph models, one per weight format.

    python convert_tfjs.py --saved-model <work>/saved_model --out <work>/tfjs

writes <out>/float32, <out>/float16 and <out>/uint8 (model.json + weight shards). Pick one with
eval-tfjs.mjs on the validation split, then copy it to public/lab/tomato/ (README.md).

tensorflowjs 4.22 imports TensorFlow Decision Forests, TF Hub, tf_keras and JAX at module load,
though converting a SavedModel uses none of them, and TFDF has no Windows build. Install it with
`pip install --no-deps tensorflowjs==4.22.0`; any of those packages that is missing is replaced
by an empty stand-in module below, so the import succeeds.

oneDNN graph rewrites are switched off: with them, TensorFlow's remapper fuses MobileNetV3's
hard-swish into `_FusedConv2D(..., _FusedHardSwish)`, which no TF.js backend can run.
`check_fused_ops` fails the conversion if any fused activation TF.js lacks is left in the graph.
"""

from __future__ import annotations

import argparse
import base64
import importlib.util
import json
import os
import shutil
import sys
import types
from pathlib import Path

os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"  # before TensorFlow is imported

# What tfjs-converter can map for _FusedConv2D / FusedDepthwiseConv2dNative / _FusedMatMul.
TFJS_FUSED = {"biasadd", "relu", "relu6", "elu", "prelu", "leakyrelu", "sigmoid", "fusedbatchnorm"}


def check_fused_ops(model: dict) -> list[str]:
    found = set()
    for node in model["modelTopology"]["node"]:
        ops = node.get("attr", {}).get("fused_ops", {}).get("list", {}).get("s", [])
        found.update(base64.b64decode(s).decode() for s in ops)
    bad = sorted(op for op in found if op.lower() not in TFJS_FUSED)
    if bad:
        raise SystemExit(f"fused ops TF.js can't run: {bad}")
    return sorted(found)


def stub_missing(*names: str) -> None:
    for name in names:
        try:
            found = importlib.util.find_spec(name) is not None
        except ModuleNotFoundError:  # parent package missing
            found = False
        if not found:
            module = types.ModuleType(name)
            module.__path__ = []  # lets "from <name>.x import y" find the stub child below
            sys.modules[name] = module
            parent, _, child = name.rpartition(".")
            if parent in sys.modules:
                setattr(sys.modules[parent], child, module)


FORMATS = {
    "float32": None,
    "float16": {"float16": True},
    "uint8": {"uint8": True},
}


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--saved-model", required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--formats", default="float32,float16,uint8")
    args = p.parse_args()

    # Load TensorFlow and Keras first, as they are: Keras probes for JAX and must not see a stub.
    import keras  # noqa: F401
    import tensorflow  # noqa: F401

    stub_missing("tensorflow_decision_forests", "tensorflow_hub", "tf_keras", "jax", "jax.experimental",
                 "jax.experimental.jax2tf")
    from tensorflowjs.converters import tf_saved_model_conversion_v2 as conversion

    for name in args.formats.split(","):
        dst = Path(args.out) / name
        if dst.exists():
            shutil.rmtree(dst)
        conversion.convert_tf_saved_model(
            args.saved_model,
            str(dst),
            signature_def="serving_default",
            saved_model_tags="serve",
            quantization_dtype_map=FORMATS[name],
            weight_shard_size_bytes=8 * 1024 * 1024,  # one shard: one request
        )
        model = json.loads((dst / "model.json").read_text(encoding="utf-8"))
        sizes = {f.name: f.stat().st_size for f in dst.iterdir()}
        ops = sorted({n["op"] for n in model["modelTopology"]["node"]})
        print(f"{name}: {sum(sizes.values()) / 1e6:.2f} MB {sizes}")
        print(f"  ops: {ops}")
        print(f"  fused: {check_fused_ops(model)}")
        print(f"  signature: {json.dumps(model.get('signature'))[:300]}")


if __name__ == "__main__":
    main()
