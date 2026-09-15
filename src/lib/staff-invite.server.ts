import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

export const inviteStaffMember = createServerFn({ method: "POST" })
  .validator((data: { email: string; role: "admin" | "receptionist"; redirectTo?: string }) => data)
  .handler(async ({ data }) => {
    const normalizedEmail = data.email.trim().toLowerCase();
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    const redirectBase =
      data.redirectTo ||
      process.env.VITE_SITE_URL ||
      process.env.APP_URL ||
      "http://localhost:8080";

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        "Missing Supabase service role credentials. Set SUPABASE_SERVICE_ROLE_KEY and VITE_SUPABASE_URL.",
      );
    }

    if (!normalizedEmail || !/.+@.+\..+/.test(normalizedEmail)) {
      throw new Error("Enter a valid email address.");
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: invitedUser, error } = await adminClient.auth.admin.inviteUserByEmail(
      normalizedEmail,
      {
        data: {
          role: data.role,
          invited_by: "admin",
        },
        redirectTo: new URL("/admin", redirectBase).toString(),
      },
    );

    if (error) {
      throw new Error(error.message || "Unable to invite this staff member.");
    }

    return {
      ok: true,
      email: invitedUser?.user?.email ?? normalizedEmail,
      role: data.role,
    };
  });
