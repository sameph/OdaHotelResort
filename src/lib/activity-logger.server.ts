import { createServerFn } from "@tanstack/react-start";
import { getServerSupabase } from "./server-supabase";

export interface ActivityLog {
  id: number;
  user_email: string;
  user_role: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  resource_name?: string;
  details?: Record<string, string | number | boolean>;
  created_at: string;
}

export const logActivity = createServerFn({ method: "POST" })
  .validator(
    (data: {
      action: string;
      resource_type: string;
      resource_id?: string;
      resource_name?: string;
      details?: Record<string, string | number | boolean>;
    }) => data,
  )
  .handler(async ({ data }) => {
    const supabase = getServerSupabase();
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;

    if (!user) {
      throw new Error("User not authenticated");
    }

    const userRole = (user.user_metadata?.role || user.app_metadata?.role || "unknown") as string;

    const { error } = await supabase
      .from("activity_logs")
      .insert([
        {
          user_email: user.email,
          user_role: userRole,
          action: data.action,
          resource_type: data.resource_type,
          resource_id: data.resource_id,
          resource_name: data.resource_name,
          details: data.details || null,
        },
      ] as never[]);

    if (error) {
      console.error("Failed to log activity:", error);
      throw error;
    }

    return { ok: true };
  });

export const fetchActivityLogs = createServerFn({ method: "GET" })
  .validator((data?: { limit?: number; offset?: number }) => data || {})
  .handler(async ({ data = {} }) => {
    const supabase = getServerSupabase();
    const limit = data.limit ?? 50;
    const offset = data.offset ?? 0;

    const { data: logs, error } = await supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Failed to fetch activity logs:", error);
      throw error;
    }

    return (logs || []) as ActivityLog[];
  });
