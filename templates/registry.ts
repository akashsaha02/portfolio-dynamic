import folio from "./folio";
import type { TemplateDefinition, TemplateId, TemplateModule } from "./types";

/**
 * Every template the site can render. The active one comes from `getSettings().activeTemplate`.
 * Editorial (v1) was retired in work plan 5.2: git tag `v1-editorial`.
 */
export const templates: Record<TemplateId, TemplateDefinition> = {
  folio: {
    meta: {
      id: "folio",
      name: "Folio",
      description: "Mobile-first multi-page template (guide §3–§4).",
      status: "current",
    },
    module: folio,
  },
};

export function getTemplate(id: TemplateId): TemplateModule {
  return templates[id].module;
}
