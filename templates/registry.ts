import folio from "./folio";
import index from "./index/index";
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
  index: {
    meta: {
      id: "index",
      name: "Index",
      description: "Two-column, recruiter-first: everything on one scroll (work plan 6.4).",
      status: "current",
    },
    module: index,
  },
};

export function getTemplate(id: TemplateId): TemplateModule {
  return templates[id].module;
}
