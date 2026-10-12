import Link from "next/link";
import { getActiveTemplate } from "@/lib/template";

// Rendered when a (site) page calls notFound(), including the [...missing] catch-all that takes
// every unmatched URL. The active template can provide its own NotFound page (work plan 1.7);
// otherwise this minimal fallback is used.
export default async function NotFound() {
  const { template, props } = await getActiveTemplate();
  if (template.NotFound) return <template.NotFound {...props} />;

  return (
    <main
      id="main"
      tabIndex={-1}
      className="grid min-h-svh place-content-center gap-4 p-6 text-center outline-none"
    >
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <p>
        <Link href="/" className="underline underline-offset-4">
          Back to the home page
        </Link>
      </p>
    </main>
  );
}
