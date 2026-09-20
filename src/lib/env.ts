type EnvLike = Record<string, string | undefined>;

function getEnvValue(key: string): string | undefined {
  const metaEnv = typeof import.meta !== "undefined" ? (import.meta as ImportMeta & { env?: EnvLike }).env : undefined;
  const fromMeta = metaEnv?.[key];
  if (fromMeta) return fromMeta;

  if (typeof process !== "undefined" && process.env) {
    return process.env[key];
  }

  return undefined;
}

export const env = {
  supabaseUrl: getEnvValue("VITE_SUPABASE_URL") || "",
  supabaseAnonKey: getEnvValue("VITE_SUPABASE_ANON_KEY") || "",
  supabaseServiceRoleKey:
    getEnvValue("VITE_SUPABASE_SERVICE_ROLE_KEY") || getEnvValue("SUPABASE_SERVICE_ROLE_KEY") || "",
  chapaSecretKey: getEnvValue("VITE_CHAPA_SECRET_KEY") || getEnvValue("CHAPA_SECRET_KEY") || "",
  chapaPublicKey: getEnvValue("VITE_CHAPA_PUBLIC_KEY") || getEnvValue("CHAPA_PUBLIC_KEY") || "",
  siteUrl: getEnvValue("VITE_SITE_URL") || "http://localhost:5173",
  resendApiKey: getEnvValue("RESEND_API_KEY") || getEnvValue("VITE_RESEND_API_KEY") || "",
  senderEmail: getEnvValue("EMAIL_FROM") || getEnvValue("VITE_EMAIL_FROM") || "onboarding@resend.dev",
  smtpUser: getEnvValue("VITE_SMTP_USER") || getEnvValue("SMTP_USER") || "",
  smtpPass: getEnvValue("VITE_SMTP_PASS") || getEnvValue("SMTP_PASS") || "",
};
