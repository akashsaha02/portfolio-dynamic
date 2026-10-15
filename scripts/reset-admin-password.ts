// Reset the admin password from a machine with database access (QA F-12): no email needed.
//
//   RESET_ADMIN_PASSWORD='new long passphrase' npm run admin:reset-password -- you@example.com
//
// - Email: first argument, or RESET_ADMIN_EMAIL.
// - Password: RESET_ADMIN_PASSWORD (preferred: an argument would land in shell history and the
//   process list), or the second argument. At least 12 characters.
// - Needs DATABASE_URI and PAYLOAD_SECRET of the target environment (shell or .env.local; `payload
//   run` loads env files). Against production: run it locally with the Atlas URI, never on Vercel.
//
// It sets the new password, clears the login lock (5 failed tries lock the account for 15 min),
// and ends every open session, so a stolen session token stops working too. It never prompts and
// never prints the password. Trusted system work: Local API with `overrideAccess: true`.

import { getPayload } from "payload";
import config from "../payload.config";

const MIN_LENGTH = 12;

function fail(message: string): never {
  console.error(`[reset-admin-password] ${message}`);
  process.exit(1);
}

const [argEmail, argPassword] = process.argv.slice(2);
const email = (argEmail || process.env.RESET_ADMIN_EMAIL || "").trim().toLowerCase();
const password = process.env.RESET_ADMIN_PASSWORD || argPassword || "";

if (!email) fail("Pass the admin email as the first argument, or set RESET_ADMIN_EMAIL.");
if (!password) fail("Set RESET_ADMIN_PASSWORD to the new password.");
if (password.length < MIN_LENGTH) fail(`The new password must be at least ${MIN_LENGTH} characters.`);

const payload = await getPayload({ config });

try {
  const { docs } = await payload.find({
    collection: "users",
    overrideAccess: true,
    where: { email: { equals: email } },
    depth: 0,
    limit: 1,
    pagination: false,
  });
  const user = docs[0];
  if (!user) fail(`No user with that email. The admin account is ${await adminHint()}.`);

  await payload.update({
    collection: "users",
    id: user.id,
    overrideAccess: true,
    depth: 0,
    // `sessions` is update-protected for the API; overrideAccess lets trusted code clear it.
    data: { password, sessions: [] },
  });
  // Clears loginAttempts / lockUntil. The generated auth types ask for `password` here; unlock ignores it.
  await payload.unlock({ collection: "users", data: { email, password }, overrideAccess: true });

  console.log(`[reset-admin-password] Password reset for ${email}. Login lock cleared, all sessions signed out.`);
} catch (error) {
  fail(`Failed: ${error instanceof Error ? error.message : String(error)}`);
}

process.exit(0);

/** "a…@example.com" style hint, so a typo is spotted without printing the full address. */
async function adminHint(): Promise<string> {
  const { docs } = await payload.find({ collection: "users", overrideAccess: true, depth: 0, limit: 1, pagination: false });
  const other = docs[0]?.email;
  if (!other) return "missing (the users collection is empty: run `npm run seed` with SEED_ADMIN_*)";
  const [local, domain] = other.split("@");
  return `${local.slice(0, 1)}…@${domain}`;
}
