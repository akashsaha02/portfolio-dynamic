// Folio Lab, /lab (work plan 6.7): the in-browser tomato-leaf classifier. The title and one line;
// the research it grew out of (the tomato publication and research role, from content, left out
// when absent); the demo; then "How it works": the model's facts and four numbered steps, all from
// public/lab/tomato/meta.json. Blocks follow Home's Research: a hairline, the label in 3 of 12
// columns from md, the content in the other 9. Server Component; the demo is the only client part
// and TF.js loads when the visitor presses Classify. Not in the shell's menu (pages.ts) yet.

import type { ReactNode } from "react";
import { TomatoClassifier } from "@/components/shared/lab/TomatoClassifier";
import type { Experience, Publication } from "@/lib/content-types";
import meta from "@/public/lab/tomato/meta.json";
import type { TemplateProps } from "../../types";
import { FolioShell } from "../shell/FolioShell";
import { Note, Notes } from "../ui/Note";
import { Action } from "../ui/Action";
import { Chip } from "../ui/Chip";
import { FillButton } from "../ui/FillButton";
import { ArrowUpRight } from "../ui/icons";

const percent = new Intl.NumberFormat("en-GB", { style: "percent", maximumFractionDigits: 1 });
const count = (n: number) => n.toLocaleString("en-GB");
const BITS: Record<string, string> = { float32: "32-bit", float16: "16-bit", uint8: "8-bit" };

function Block({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    // The footer brings its own curve margin, so the last block needs only half a section below.
    <section aria-labelledby={id} className="f-bleed pb-section last:pb-[calc(var(--section-y)/2)]">
      <div className="grid gap-8 border-t border-(--rule) pt-8 md:grid-cols-12 md:gap-x-8 md:pt-12 lg:gap-x-12">
        <h2 id={id} className="type-label md:col-span-3">
          {label}
        </h2>
        <div className="min-w-0 md:col-span-9">{children}</div>
      </div>
    </section>
  );
}

function Research({ paper, role }: { paper: Publication; role?: Experience }) {
  const href = paper.url ?? (paper.doi ? `https://doi.org/${paper.doi}` : undefined);
  return (
    <Block id="lab-research" label="Research">
      <Chip variant={paper.status === "published" ? "solid" : "outline"}>{paper.statusLabel}</Chip>
      <h3 className="mt-4 max-w-[34ch] text-[clamp(1.375rem,1.1rem+1vw,2rem)] leading-tight font-medium tracking-tight">
        {paper.title}
      </h3>
      <p className="mt-2 type-label">
        {paper.venue}, {paper.year}
      </p>
      <p className="mt-6 max-w-[60ch] type-lead">{paper.summary}</p>
      {role?.points.length ? (
        <ul className="mt-6 grid max-w-[60ch] gap-2 leading-relaxed text-(--fg-muted)">
          {role.points.map((point) => (
            <li key={point} className="flex gap-3">
              <span aria-hidden="true" className="f-dot mt-[0.6em]" />
              {point}
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-6 max-w-[60ch] leading-relaxed text-pretty">
        The model on this page is not the paper’s. It is a much smaller network, trained for this demo so that it
        runs on a phone.
      </p>
      {href ? (
        <div className="mt-8">
          <FillButton
            href={href}
            external
            variant="outline"
            icon={<ArrowUpRight />}
            aria-label={`${paper.doi ? "DOI" : "Paper"}: ${paper.title} (opens in a new tab)`}
          >
            {paper.doi ? "DOI" : "Paper"}
          </FillButton>
        </div>
      ) : null}
    </Block>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="border-b border-(--rule) pb-3 type-label">{label}</dt>
      <dd className="pt-3 text-lg leading-snug text-pretty">{children}</dd>
    </div>
  );
}

function HowItWorks() {
  const { dataset, model, files, test } = meta;
  const size = `${(files.bytes / 1e6).toFixed(1)} MB`;
  const classes = Object.entries(test.perClassRecall);
  const steps = [
    {
      title: "Data",
      body: `${count(dataset.images)} photos of tomato leaves from the PlantVillage dataset, in ten classes: nine diseases or pests, and healthy. Photos of the same leaf always stay together, so the ${count(dataset.test)} test photos show leaves the model never saw. ${count(dataset.train)} photos train it and ${count(dataset.val)} pick the best round of training.`,
    },
    {
      title: "Training",
      body: `${model.backbone}: a network designed for phones, pretrained on ImageNet, with a new ten-class layer on top. ${model.training} ${model.augmentation}`,
    },
    {
      title: "In your browser",
      body: `TensorFlow.js runs the model on your GPU through WebGL, or on the CPU where WebGL isn’t available. The weights are stored as ${BITS[files.weights] ?? files.weights} numbers (${size}). Your photo is cropped to its centre square and resized to ${meta.input.size} × ${meta.input.size} pixels before the model sees it. Nothing loads until you press Classify.`,
    },
    {
      title: "Limits",
      body: meta.limits.join(" "),
    },
  ];

  return (
    <Block id="lab-how" label="How it works">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-7 lg:grid-cols-4 lg:gap-x-8">
        <Fact label="Model">{model.name}</Fact>
        <Fact label="Input">
          {meta.input.size} × {meta.input.size} px
        </Fact>
        <Fact label="Download">{size}</Fact>
        <Fact label="Test accuracy">
          {percent.format(test.accuracy)}{" "}
          <span className="text-base text-(--fg-muted)">of {count(test.images)}</span>
        </Fact>
      </dl>

      <ol className="mt-14 grid md:mt-20">
        {steps.map((s, i) => (
          <li key={s.title} className="grid gap-3 border-t border-(--rule) py-8 first:border-t-0 first:pt-0 lg:grid-cols-9 lg:gap-x-12">
            <p aria-hidden="true" className="type-label tabular-nums lg:col-span-1">
              {String(i + 1).padStart(2, "0")}
            </p>
            <div className="lg:col-span-8">
              <h3 className="text-[clamp(1.375rem,1.15rem+0.9vw,1.875rem)] leading-tight font-medium tracking-tight">
                {s.title}
              </h3>
              <p className="mt-3 max-w-[60ch] leading-relaxed text-pretty text-(--fg-muted)">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <h3 className="mt-6 type-label">Accuracy by class, on the test photos</h3>
      <ul className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2">
        {classes.map(([name, recall]) => (
          <li key={name} className="flex justify-between gap-4 border-b border-(--rule) pb-2">
            <span>{name}</span>
            <span className="tabular-nums">{percent.format(recall)}</span>
          </li>
        ))}
      </ul>

      <p className="mt-12 max-w-[60ch] text-sm leading-relaxed text-pretty text-(--fg-muted)">
        Dataset: PlantVillage ({dataset.credit}), licensed {dataset.licence}. Its terms put models trained on it
        under the same licence, so the model files and sample photos are {dataset.licence} too.
      </p>
      {/* 44px targets, as the case-study fact links (work/Facts.tsx). */}
      <ul className="mt-2 flex flex-wrap gap-x-6">
        <li>
          <Action href={dataset.url} external className="f-link -mx-1 inline-flex min-h-11 items-center gap-1.5 px-1 font-medium">
            Dataset
            <ArrowUpRight />
          </Action>
        </li>
        <li>
          <Action
            href={dataset.licenceUrl}
            external
            className="f-link -mx-1 inline-flex min-h-11 items-center gap-1.5 px-1 font-medium"
          >
            Licence ({dataset.licence})
            <ArrowUpRight />
          </Action>
        </li>
      </ul>
    </Block>
  );
}

export default function Lab({ content, settings }: TemplateProps) {
  const paper = content.publications.find((p) => /tomato/i.test(p.title));
  const role = content.experience.find((e) => e.points.some((p) => /tomato/i.test(p)));

  return (
    <FolioShell content={content} settings={settings} title="Lab">
      <main id="main" tabIndex={-1} className="outline-none">
        <header className="f-bleed pt-[calc(var(--section-y)/2)] pb-section">
          <h1 className="type-display">Lab</h1>
          <p className="mt-4 max-w-[40ch] type-lead text-(--fg-muted) md:mt-6">
            A tomato-leaf disease classifier that runs in your browser.
          </p>
        </header>

        {paper ? <Research paper={paper} role={role} /> : null}

        <Block id="lab-demo" label="Try it">
          <TomatoClassifier />
          {/* Annotations (work plan 6.6): where the model runs. */}
          <Notes className="mt-10">
            <Note id="lab" />
          </Notes>
        </Block>

        <HowItWorks />
      </main>
    </FolioShell>
  );
}
