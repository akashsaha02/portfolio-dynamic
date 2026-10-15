import { describe, expect, it } from "vitest";
import { exitRedirectPath, safeRedirectPath } from "@/lib/draft";

const base = "http://localhost:3000/api/draft/disable";
const req = (url: string, referer?: string) => new Request(url, { headers: referer ? { referer } : {} });

describe("lib/draft", () => {
  it("keeps same-origin paths and refuses open redirects", () => {
    expect(safeRedirectPath(`${base}?path=/work/abroadly`)).toBe("/work/abroadly");
    expect(safeRedirectPath(`${base}?path=//evil.example`)).toBe("/");
    expect(safeRedirectPath(`${base}?path=/%5Cevil.example`)).toBe("/");
    expect(safeRedirectPath(`${base}?path=https://evil.example`)).toBe("/");
  });

  it("exit goes to ?path=, else the same-origin Referer, else /", () => {
    expect(exitRedirectPath(req(`${base}?path=/about`, "http://localhost:3000/work"))).toBe("/about");
    expect(exitRedirectPath(req(base, "http://localhost:3000/work/nook?x=1"))).toBe("/work/nook?x=1");
    expect(exitRedirectPath(req(base, "https://evil.example/work"))).toBe("/");
    expect(exitRedirectPath(req(base, "http://localhost:3000//evil.example"))).toBe("/");
    expect(exitRedirectPath(req(base))).toBe("/");
  });
});
