const items = ["MongoDB", "Express", "React", "Node", "Next.js", "TypeScript", "Stripe", "TensorFlow", "Three.js"];

function Row({ hidden }: { hidden?: boolean }) {
  return (
    <ul aria-hidden={hidden} translate="no" className="flex shrink-0 items-center">
      {items.map((item) => (
        <li key={item} className="flex items-center">
          <span className="headline px-6 text-[clamp(2.25rem,5vw,4.5rem)] md:px-9">{item}</span>
          <svg viewBox="0 0 20 20" aria-hidden className="size-5 text-lime md:size-7">
            <path fill="currentColor" d="M10 0l2.4 7.6L20 10l-7.6 2.4L10 20l-2.4-7.6L0 10l7.6-2.4z" />
          </svg>
        </li>
      ))}
    </ul>
  );
}

export function Marquee() {
  return (
    <section aria-label="Technologies I use" className="overflow-hidden bg-ink py-7 text-on-ink md:py-9">
      <div className="marquee flex w-max motion-reduce:animate-none">
        <Row />
        <Row hidden />
      </div>
    </section>
  );
}
