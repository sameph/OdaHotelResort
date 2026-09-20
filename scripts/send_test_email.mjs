#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { Resend } from "resend";

function loadDotenv(filePath) {
  const env = {};
  try {
    const text = fs.readFileSync(filePath, "utf8");
    for (const line of text.split(/\n|\r/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      env[key] = val;
    }
  } catch (e) {
    // ignore
  }
  return env;
}

const root =
  path.resolve(new URL(import.meta.url).pathname).split("/scripts/send_test_email.mjs")[0] ||
  process.cwd();
const envPath = path.join(root, ".env");
const env = loadDotenv(envPath);

// Merge into process.env if not already set
for (const [k, v] of Object.entries(env)) {
  if (!process.env[k]) process.env[k] = v;
}

const RESEND_API_KEY = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
const TO = process.env.RESEND_ADMIN_EMAIL || process.env.TO_EMAIL || process.env.EMAIL_TO;
const FROM =
  process.env.EMAIL_FROM ||
  process.env.SENDER_EMAIL ||
  process.env.VITE_EMAIL_FROM ||
  `onboarding@resend.dev`;
const SITE = process.env.SITE_URL || process.env.VITE_SITE_URL || "http://localhost:5173";

if (!RESEND_API_KEY) {
  console.error("RESEND_API_KEY not found in .env or process.env. Aborting.");
  process.exit(1);
}
if (!TO) {
  console.error(
    "No recipient found (RESEND_ADMIN_EMAIL / TO_EMAIL). Please set RESEND_ADMIN_EMAIL in .env. Aborting.",
  );
  process.exit(1);
}

const resend = new Resend(RESEND_API_KEY);

(async () => {
  try {
    const subject = `ODA Resort — Test Email (${new Date().toISOString()})`;
    const html = `<div style="font-family: sans-serif; max-width:600px; margin:0 auto;">
        <h2>ODA Resort Test Email</h2>
        <p>This is a test email sent from the project using Resend.</p>
        <p>Site: ${SITE}</p>
        <p>Time: ${new Date().toISOString()}</p>
      </div>`;

    const res = await resend.emails.send({
      from: FROM,
      to: TO,
      subject,
      html,
    });

    console.log("Email send response:", res);
    console.log("Test email sent to", TO);
    process.exit(0);
  } catch (err) {
    console.error("Failed to send test email:", err);
    process.exit(2);
  }
})();
