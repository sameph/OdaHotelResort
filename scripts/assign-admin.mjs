import { createClient } from "@supabase/supabase-js";
import { readFile } from "fs/promises";
import { resolve } from "path";

function usage() {
  console.log(`Usage: node scripts/assign-admin.mjs --email <USER_EMAIL> [--env-file <path>]

Requires keys: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment or an .env file.

Examples:
  node scripts/assign-admin.mjs --email admin@odaresortandhotel.com
  node scripts/assign-admin.mjs --email admin@odaresortandhotel.com --env-file ./deploy/.env
`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--email") out.email = args[++i];
    else if (a === "--role") out.role = args[++i];
    else if (a === "--env-file") out.envFile = args[++i];
    else if (a === "--help" || a === "-h") out.help = true;
  }
  return out;
}

function parseDotenv(content) {
  const result = {};
  for (const line of content.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    result[key] = val;
  }
  return result;
}

async function loadEnv(envFile) {
  try {
    const root = envFile ? resolve(process.cwd(), envFile) : resolve(process.cwd(), ".env");
    const txt = await readFile(root, { encoding: "utf8" });
    return parseDotenv(txt);
  } catch (e) {
    return {};
  }
}

const { email, envFile, help } = parseArgs();
if (help) {
  usage();
  process.exit(0);
}

if (!email) {
  console.error("Error: --email <USER_EMAIL> is required");
  usage();
  process.exit(1);
}

const env = await loadEnv(envFile);

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  env.SUPABASE_URL ||
  env.NEXT_PUBLIC_SUPABASE_URL ||
  env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required (in env or .env)");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function findUserByEmail(email) {
  try {
    if (typeof supabase.auth.admin?.listUsers === "function") {
      const listRes = await supabase.auth.admin.listUsers();
      const users = listRes?.data?.users ?? listRes?.users ?? [];
      return users.find((u) => (u.email || "").toLowerCase() === email.toLowerCase()) || null;
    }
  } catch (e) {
    // ignore and try REST
  }

  try {
    const url = new URL("/auth/v1/admin/users", SUPABASE_URL).toString();
    const res = await fetch(`${url}?email=${encodeURIComponent(email)}`, {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (Array.isArray(json)) return json[0] ?? null;
    if (Array.isArray(json.users)) return json.users[0] ?? null;
    return null;
  } catch (e) {
    return null;
  }
}

const targetRole = (out.role || "admin").toLowerCase();

async function assignRoleById(userId, role) {
  try {
    if (typeof supabase.auth.admin?.updateUserById === "function") {
      const res = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: { role },
      });
      if (res?.error) throw res.error;
      return res?.data?.user ?? res?.user ?? res?.data ?? res;
    }
  } catch (e) {
    // continue to REST fallback
  }

  try {
    const url = new URL(
      `/auth/v1/admin/users/${encodeURIComponent(userId)}`,
      SUPABASE_URL,
    ).toString();
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_metadata: { role } }),
    });
    if (!res.ok) throw new Error(`REST update failed: ${res.status}`);
    return await res.json();
  } catch (e) {
    throw e;
  }
}

(async () => {
  try {
    process.stdout.write(`Looking up user by email ${email}... `);
    const user = await findUserByEmail(email);
    if (!user) {
      console.error(`\nUser with email ${email} not found via admin API.`);
      process.exit(2);
    }
    process.stdout.write("found\n");
    const userId = user.id || user.user?.id || user.uid || user.uuid;
    if (!userId) {
      console.error("Could not determine user id from lookup result:", user);
      process.exit(3);
    }

    process.stdout.write(`Assigning ${targetRole} role to user ${userId}... `);
    const updated = await assignRoleById(userId, targetRole);
    console.log("done");
    console.log("Result:");
    console.log({ id: userId, email: email, role: targetRole, updated: !!updated });
    console.log("\nNote: This requires a Supabase service role key. Keep it secret.");
    process.exit(0);
  } catch (err) {
    console.error("\nFailed:", err instanceof Error ? err.message : err);
    process.exit(1);
  }
})();
