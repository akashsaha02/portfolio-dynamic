import { describe, expect, it } from "vitest";
import {
  ACTIVATABLE_TEMPLATE_IDS,
  DEFAULT_TEMPLATE,
  isActivatableTemplateId,
  isTemplateId,
  TEMPLATE_IDS,
  TEMPLATE_META,
  toActivatableTemplateId,
  toTemplateId,
} from "@/templates/types";

describe("template id helpers", () => {
  it("knows every template; the default is folio", () => {
    expect([...TEMPLATE_IDS]).toEqual(["folio", "index", "bento", "brutal", "terminal"]);
    expect(DEFAULT_TEMPLATE).toBe("folio");
  });

  it("isTemplateId accepts only current ids (retired and junk are rejected)", () => {
    expect(isTemplateId("folio")).toBe(true);
    expect(isTemplateId("index")).toBe(true);
    for (const bad of ["editorial", "", "Folio", undefined, null, 1, {}]) expect(isTemplateId(bad)).toBe(false);
  });

  it("toTemplateId falls back to the default quietly", () => {
    expect(toTemplateId("index")).toBe("index");
    expect(toTemplateId("editorial")).toBe("folio");
    expect(toTemplateId(undefined)).toBe("folio");
  });

  it("activatable ids are the ones whose status is current", () => {
    expect([...ACTIVATABLE_TEMPLATE_IDS]).toEqual(TEMPLATE_IDS.filter((id) => TEMPLATE_META[id].status === "current"));
    expect(isActivatableTemplateId("index")).toBe(true);
    expect(isActivatableTemplateId("editorial")).toBe(false);
    expect(toActivatableTemplateId("index")).toBe("index");
    expect(toActivatableTemplateId("nope")).toBe("folio");
  });

  it("every id has meta with a matching id", () => {
    for (const id of TEMPLATE_IDS) expect(TEMPLATE_META[id].id).toBe(id);
  });
});
