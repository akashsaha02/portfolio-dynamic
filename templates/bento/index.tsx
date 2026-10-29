import type { TemplateModule, TemplateProps } from "../types";

// Placeholder until the Bento template lands. Not selectable in the admin while its status in
// TEMPLATE_META (templates/types.ts) is "placeholder".
function Home({ content }: TemplateProps) {
  return (
    <main id="main" tabIndex={-1} className="mx-auto max-w-2xl p-8 outline-none">
      <h1 className="text-2xl font-semibold">{content.profile.name}</h1>
      <p className="mt-2">The Bento template is being built.</p>
    </main>
  );
}

const bento: TemplateModule = { Home };
export default bento;
