import folio from "./folio";
import index from "./index/index";
import { TEMPLATE_META, type TemplateDefinition, type TemplateId, type TemplateModule } from "./types";

/**
 * Every template the site can render. The active one comes from `getSettings().activeTemplate`.
 * Names, descriptions and status (current / placeholder) live in TEMPLATE_META (types.ts), so
 * the admin can read them without importing the pages. Editorial (v1) was retired in work plan
 * 5.2: git tag `v1-editorial`.
 */
export const templates: Record<TemplateId, TemplateDefinition> = {
  folio: { meta: TEMPLATE_META.folio, module: folio },
  index: { meta: TEMPLATE_META.index, module: index },
};

export function getTemplate(id: TemplateId): TemplateModule {
  return templates[id].module;
}
