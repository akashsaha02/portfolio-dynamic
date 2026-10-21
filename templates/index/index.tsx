import type { TemplateModule, TemplateProps } from "../types";

// Placeholder until the Index template lands (work plan 6.4). Not selectable in the admin while
// its registry status is "placeholder".
function Home({ content }: TemplateProps) {
  return (
    <main id="main" tabIndex={-1} className="mx-auto max-w-2xl p-8 outline-none">
      <h1 className="text-2xl font-semibold">{content.profile.name}</h1>
      <p className="mt-2">The Index template is being built.</p>
    </main>
  );
}

const index: TemplateModule = { Home };
export default index;
