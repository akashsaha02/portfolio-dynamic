// Payload logger that writes expected client errors (HTTP 4xx: denied, not found, invalid input,
// locked login, not logged in) as one `info` line instead of an `error` with a stack trace (QA F-13).
//
// Why not just `loggingLevels`: Payload matches those by error class name (`err.name`, set from
// `this.constructor.name`), and the production server bundle minifies class names, so in
// `next build` output nothing matched and every anonymous 403 logged a full stack. Bots probing
// /api would bury real errors in Vercel's 1-hour log window. The HTTP status survives minification.
//
// Output format is Payload's default (pino-pretty, same as without a custom logger).

import { defaultLoggerOptions, type Config } from "payload";

type LoggerConfig = Extract<NonNullable<Config["logger"]>, { options: unknown }>;

const ERROR_LEVEL = 50; // pino: error = 50, fatal = 60

function clientErrorStatus(arg: unknown): number | null {
  if (!arg || typeof arg !== "object" || !("err" in arg)) return null;
  const err = (arg as { err: unknown }).err;
  if (!err || typeof err !== "object") return null;
  const status = (err as { status?: unknown }).status;
  return typeof status === "number" && status >= 400 && status < 500 ? status : null;
}

export const payloadLogger: LoggerConfig = {
  destination: defaultLoggerOptions,
  options: {
    hooks: {
      logMethod(args, method, level) {
        const status = level >= ERROR_LEVEL ? clientErrorStatus(args[0]) : null;
        if (status !== null) {
          const err = (args[0] as { err: { message?: unknown } }).err;
          this.info(`${status} ${typeof err.message === "string" ? err.message : "Client error"}`);
          return;
        }
        method.apply(this, args);
      },
    },
  },
};
