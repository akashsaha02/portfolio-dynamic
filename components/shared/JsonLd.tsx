import { jsonLdScript } from "@/lib/json-ld";

/**
 * Renders schema.org structured data. Server Component, no client JS. Build `data` with the
 * helpers in lib/json-ld.ts; page files mount it next to the template (templates never do).
 */
export function JsonLd({ data }: { data: object }) {
  // The JSON is escaped by jsonLdScript (`<` → <), so content can't break out of the tag.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(data) }} />;
}
