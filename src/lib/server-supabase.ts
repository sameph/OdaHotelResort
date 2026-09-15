import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase-types";

/**
 * Server-only Supabase client. Keep the service-role key out of VITE_* vars:
 * it is used to re-price a booking and process payment webhooks after RLS has
 * correctly prevented anonymous users from reading or modifying bookings.
 */
export function getServerSupabase(): SupabaseClient<Database> {
  const url = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY on the server.");
  }
  return createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
