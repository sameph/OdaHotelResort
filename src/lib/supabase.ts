import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase-types";

// Prefer runtime environment (process.env) for server deploys, fallback to Vite
const SUPABASE_URL =
  (typeof process !== "undefined" && (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL)) ||
  import.meta.env.VITE_SUPABASE_URL ||
  "";
const SUPABASE_ANON_KEY =
  (typeof process !== "undefined" &&
    (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)) ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "";

export const supabase: SupabaseClient<Database> = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
);

export function ensureSupabase(): SupabaseClient<Database> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Missing Supabase configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.",
    );
  }
  return supabase;
}
