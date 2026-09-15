import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchActivityLogs, type ActivityLog } from "@/lib/activity-logger.server";
import { useAdminRole } from "./admin";

export const Route = createFileRoute("/admin/logs")({
  component: AdminLogs,
});

function AdminLogs() {
  const role = useAdminRole();

  const { data: logsData = [], isLoading } = useQuery({
    queryKey: ["activity-logs"],
    queryFn: () => fetchActivityLogs(),
  });

  const logs = logsData as ActivityLog[];

  if (role === "receptionist") {
    return (
      <div className="p-16 text-center text-muted-foreground">
        Unauthorized access. Only administrators can view activity logs.
      </div>
    );
  }

  const actionColorMap: Record<string, string> = {
    create: "bg-emerald-50 text-emerald-800 border-emerald-200",
    update: "bg-blue-50 text-blue-800 border-blue-200",
    delete: "bg-red-50 text-red-800 border-red-200",
    upload: "bg-purple-50 text-purple-800 border-purple-200",
    invite: "bg-amber-50 text-amber-800 border-amber-200",
  };

  const getActionColor = (action: string) => {
    for (const [key, color] of Object.entries(actionColorMap)) {
      if (action.toLowerCase().includes(key)) return color;
    }
    return "bg-gray-50 text-gray-800 border-gray-200";
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-gold">Audit Trail</p>
        <h1 className="mt-2 font-serif text-3xl md:text-5xl text-forest-deep">Activity Logs</h1>
        <p className="mt-2 text-muted-foreground">Track all changes made by staff members.</p>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Loading logs...</div>
      ) : logs.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">No activity yet.</div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3">Time</th>
                  <th className="text-left px-4 py-3">User</th>
                  <th className="text-left px-4 py-3">Role</th>
                  <th className="text-left px-4 py-3">Action</th>
                  <th className="text-left px-4 py-3">Resource</th>
                  <th className="text-left px-4 py-3">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log: ActivityLog) => (
                  <tr key={log.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {formatTime(log.created_at)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">{log.user_email}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] border rounded bg-background">
                        {log.user_role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] border rounded ${getActionColor(log.action)}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <div className="font-medium">{log.resource_type}</div>
                        {log.resource_name && (
                          <div className="text-xs text-muted-foreground">{log.resource_name}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate">
                      {log.details ? JSON.stringify(log.details).slice(0, 50) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
