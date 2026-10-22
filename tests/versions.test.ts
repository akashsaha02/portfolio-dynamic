import { describe, expect, it } from "vitest";
import { VERSIONS, versionsFor } from "@/lib/versions";

describe("versionsFor", () => {
  it("Folio active: Folio (current) plus the Editorial snapshot, never Index", () => {
    const list = versionsFor("folio");
    expect(list.map((v) => v.id)).toEqual(["folio", "editorial"]);
    expect(list.find((v) => v.id === "folio")?.current).toBe(true);
    expect(list.find((v) => v.id === "editorial")?.current).toBe(false);
  });

  it("Index active: Index (current) plus the snapshot, never Folio", () => {
    const list = versionsFor("index");
    expect(list.map((v) => v.id)).toEqual(["index", "editorial"]);
    expect(list.filter((v) => v.current).map((v) => v.id)).toEqual(["index"]);
  });

  it("exactly one entry is current and snapshots link under /v/", () => {
    for (const id of ["folio", "index"] as const) {
      const list = versionsFor(id);
      expect(list.filter((v) => v.current)).toHaveLength(1);
      for (const v of list.filter((e) => !e.template)) expect(v.href).toMatch(/^\/v\/[a-z0-9-]+$/);
    }
  });

  it("does not mutate the source list", () => {
    versionsFor("folio");
    expect(VERSIONS.every((v) => v.current === undefined)).toBe(true);
  });
});
