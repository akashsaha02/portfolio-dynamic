import type { TemplateDefinition, TemplateId, TemplateModule } from "./types";

/** Every template the site can render. The active one comes from `getSettings().activeTemplate`. */
export const templates: Record<TemplateId, TemplateDefinition> = {
  editorial: {
    meta: {
      id: "editorial",
      name: "Editorial",
      description: "The original single-page design (v1-editorial). Reads lib/content.ts directly.",
      status: "legacy",
    },
    load: () => import("./editorial"),
  },
  folio: {
    meta: {
      id: "folio",
      name: "Folio",
      description: "Mobile-first multi-page template (guide §3–§4), in progress during Phase 1.",
      status: "placeholder",
    },
    load: () => import("./folio"),
  },
};

export async function loadTemplate(id: TemplateId): Promise<TemplateModule> {
  const mod = await templates[id].load();
  return mod.default;
}
