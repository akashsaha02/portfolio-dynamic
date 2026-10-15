import { JsonLd } from "@/components/shared/JsonLd";
import { homeJsonLd } from "@/lib/json-ld";
import { siteUrl } from "@/lib/seo";
import { getActiveTemplate } from "@/lib/template";

export default async function HomePage() {
  const { template, props } = await getActiveTemplate();
  return (
    <>
      <JsonLd data={homeJsonLd(props.content, siteUrl())} />
      <template.Home {...props} />
    </>
  );
}
