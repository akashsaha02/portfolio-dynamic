import meta from "@/public/lab/tomato/meta.json";
import { ClassifierDemo } from "./ClassifierDemo";

// The in-browser tomato-leaf classifier (work plan 6.7), rendered by each template's Lab page.
// The interactive part is ClassifierDemo; the two notes below come with it wherever it is shown:
// nothing leaves the device, and what the model is (and is not). This file has no client code of
// its own: the notes are HTML from public/lab/tomato/meta.json, and TF.js loads only when the
// visitor presses Classify. Model files: public/lab/tomato/ (docs/decisions/ml-lab.md).

const BASE = "/lab/tomato/";

const percent = new Intl.NumberFormat("en-GB", { style: "percent", maximumFractionDigits: 1 });

export function TomatoClassifier({ className }: { className?: string }) {
  const size = `${(meta.files.bytes / 1e6).toFixed(1)} MB`;
  const muted = "text-sm text-[var(--fg-muted,var(--muted))]";

  return (
    <div className={`@container ${className ?? ""}`}>
      <ClassifierDemo samples={meta.samples.map((s) => ({ src: BASE + s.file, label: s.label }))} modelSize={size} />

      <dl className="mt-10 grid gap-6 border-t border-[var(--rule,var(--hairline))] pt-6 @xl:grid-cols-2 @xl:gap-10">
        <div>
          <dt className={muted}>On your device</dt>
          <dd className="mt-2 leading-relaxed text-pretty">
            Your photo is never uploaded. The model ({size}) downloads once, the first time you press Classify,
            and runs in your browser.
          </dd>
        </div>
        <div>
          <dt className={muted}>What the model is</dt>
          <dd className="mt-2 leading-relaxed text-pretty">
            A small model trained for this demo, not the one from the paper: {percent.format(meta.test.accuracy)}{" "}
            right on {meta.test.images.toLocaleString("en-GB")} test photos it never saw in training. Those are lab
            photos of single leaves, so photos from a field will fool it more often. It is not agricultural advice.
          </dd>
        </div>
      </dl>
    </div>
  );
}
