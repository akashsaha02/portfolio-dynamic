import { getActiveTemplate } from "@/lib/template";

export default async function HomePage() {
  const { template, props } = await getActiveTemplate();
  return <template.Home {...props} />;
}
