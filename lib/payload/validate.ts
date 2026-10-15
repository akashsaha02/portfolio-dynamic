// Server-side field validators for Payload. They run on every create/update, whatever the client.

type Value = string | null | undefined;
type Result = true | string;

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const DAY = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

function empty(value: Value): boolean {
  return value === null || value === undefined || value.trim() === "";
}

/** "YYYY-MM", the contract's month format (lib/content-types.ts). */
export function month({ required = false } = {}) {
  return (value: Value): Result => {
    if (empty(value)) return required ? "Required, as YYYY-MM (e.g. 2025-11)." : true;
    return MONTH.test(value!.trim()) || "Use YYYY-MM, e.g. 2025-11.";
  };
}

/** "YYYY-MM-DD", the contract's day format. */
export function day({ required = false } = {}) {
  return (value: Value): Result => {
    if (empty(value)) return required ? "Required, as YYYY-MM-DD." : true;
    return DAY.test(value!.trim()) || "Use YYYY-MM-DD, e.g. 2026-10-10.";
  };
}

/**
 * Absolute http(s) URL. Rejects `javascript:` and other schemes, since these values become
 * `href`s on the public site.
 */
export function httpUrl({ required = false } = {}) {
  return (value: Value): Result => {
    if (empty(value)) return required ? "Required." : true;
    try {
      const url = new URL(value!.trim());
      return url.protocol === "https:" || url.protocol === "http:" || "Use an http:// or https:// link.";
    } catch {
      return "Use a full link, e.g. https://example.com.";
    }
  };
}

/** A site path such as /work/abroadly, or an absolute http(s) URL. */
export function link({ required = false } = {}) {
  const absolute = httpUrl({ required });
  return (value: Value): Result => {
    const v = value?.trim();
    if (v && v.startsWith("/")) return !v.startsWith("//") || "Use a path like /work or a full https:// link.";
    return absolute(value);
  };
}

/** A bare DOI such as 10.1109/CONIT63138.2025.11167239 (no https://doi.org/ prefix). */
export function doi() {
  return (value: Value): Result => {
    if (empty(value)) return true;
    return /^10\.\d{4,9}\/\S+$/.test(value!.trim()) || "Use the bare DOI, e.g. 10.1109/....";
  };
}
