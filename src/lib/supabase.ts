import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase-types";
import { env } from "./env";

const SUPABASE_URL = env.supabaseUrl;
const SUPABASE_ANON_KEY = env.supabaseAnonKey;

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
