import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminLogin } from "@/components/admin-login";
import { Bell, Search, Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { createContext, useContext, useState, type FormEvent } from "react";
import { inviteStaffMember } from "@/lib/staff-invite.server";
import { logActivity } from "@/lib/activity-logger.server";

const MAIN_ADMIN_EMAIL = "samuelephrem07@gmail.com";

export type StaffRole = "admin" | "receptionist";

export const AdminRoleContext = createContext<StaffRole>("receptionist");
export function useAdminRole() {
  return useContext(AdminRoleContext);
}

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Console — ODA Resort Hotel" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminLayout,
});

function InviteStaffPanel({ userEmail }: { userEmail?: string | null }) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "receptionist">("receptionist");
  const [inviteState, setInviteState] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [inviting, setInviting] = useState(false);

  if (userEmail?.toLowerCase() !== MAIN_ADMIN_EMAIL.toLowerCase()) {
    return null;
  }

  async function inviteStaff(event: FormEvent) {
    event.preventDefault();
    setInviting(true);
    setInviteState(null);

    try {
      const response = await inviteStaffMember({
        data: {
          email: inviteEmail,
          role: inviteRole,
          redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });

      // Log the invite
      try {
        await logActivity({
          data: {
            action: "invite",
            resource_type: "staff_member",
            resource_id: inviteEmail,
            resource_name: inviteEmail,
            details: { role: inviteRole },
          },
        });
      } catch (err) {
        console.warn("Failed to log invite activity:", err);
      }

      setInviteState({
        type: "success",
        text: `Invitation sent to ${response.email}. They will be able to set their password.`,
      });
      setInviteEmail("");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Unable to invite staff member.";
      setInviteState({ type: "error", text: message });
    } finally {
      setInviting(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-background p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold">Primary admin</p>
          <h2 className="mt-2 font-serif text-2xl text-forest-deep">Invite a receptionist</h2>
        </div>
      </div>

      <form onSubmit={inviteStaff} className="mt-5 grid gap-4 md:grid-cols-[1.5fr_180px_auto]">
        <label className="text-sm text-foreground">
          Email
          <input
            required
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="mt-2 w-full border border-border bg-background px-3 py-2.5 outline-none focus:border-gold"
            placeholder="receptionist@odaresort.com"
          />
        </label>

        <label className="text-sm text-foreground">
          Role
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as "admin" | "receptionist")}
            className="mt-2 w-full border border-border bg-background px-3 py-2.5 outline-none focus:border-gold"
          >
            <option value="receptionist">Receptionist</option>
            <option value="admin">Administrator</option>
          </select>
        </label>

        <button
          type="submit"
          disabled={inviting}
          className="bg-forest-deep px-5 py-3 text-xs uppercase tracking-[0.2em] text-white disabled:opacity-60"
        >
          {inviting ? "Sending…" : "Invite staff"}
        </button>
      </form>

      {inviteState && (
        <p
          className={`mt-4 text-sm ${
            inviteState.type === "success" ? "text-emerald-700" : "text-destructive"
          }`}
        >
          {inviteState.text}
        </p>
      )}
    </div>
  );
}

function AdminLayout() {
  return (
    <AdminLogin>
      {(user) => {
        const isMainAdmin = user.email?.toLowerCase() === MAIN_ADMIN_EMAIL.toLowerCase();
        const role =
          isMainAdmin
            ? "admin"
            : ((user.user_metadata?.role || user.app_metadata?.role) as StaffRole | undefined);

        if (role !== "admin" && role !== "receptionist") {
          return (
            <main className="min-h-screen grid place-items-center p-6 text-center">
              <div>
                <h1 className="font-serif text-3xl text-forest-deep">Staff access required</h1>
                <p className="mt-3 text-muted-foreground">
                  This account has no staff role. Ask an administrator to assign Admin or
                  Receptionist access.
                </p>
                <button
                  onClick={() =>
                    void import("@/lib/supabase").then(({ ensureSupabase }) =>
                      ensureSupabase().auth.signOut(),
                    )
                  }
                  className="mt-6 bg-forest-deep px-5 py-3 text-xs uppercase tracking-[0.2em] text-white"
                >
                  Sign out
                </button>
              </div>
            </main>
          );
        }
        return (
          <AdminRoleContext.Provider value={role}>
            <div className="min-h-screen flex bg-[oklch(0.98_0.005_85)]">
              <AdminSidebar role={role} />
              <div className="flex-1 flex flex-col min-w-0">
                <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-md border-b border-border">
                  <div className="flex items-center justify-between gap-4 px-6 md:px-10 py-4">
                    <div className="flex items-center gap-2 md:gap-3 flex-1 max-w-md">
                      <Sheet>
                        <SheetTrigger asChild>
                          <button
                            className="lg:hidden relative rounded-md p-2 -ml-2 hover:bg-muted transition-colors text-foreground"
                            aria-label="Menu"
                          >
                            <Menu className="h-5 w-5" aria-hidden />
                          </button>
                        </SheetTrigger>
                        <SheetContent
                          side="left"
                          className="p-0 w-64 border-r-0 bg-forest-deep text-white"
                        >
                          <SheetTitle className="sr-only">Admin Navigation</SheetTitle>
                          <SheetDescription className="sr-only">
                            Navigate through the admin console
                          </SheetDescription>
                          <AdminSidebar
                            className="flex flex-col w-64 shrink-0 h-full"
                            role={role}
                          />
                        </SheetContent>
                      </Sheet>
                      <Search
                        className="h-4 w-4 text-muted-foreground hidden sm:block"
                        aria-hidden
                      />
                      <input
                        type="search"
                        placeholder="Search bookings, guests, rooms…"
                        className="w-full bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <button
                        className="relative rounded-full p-2 hover:bg-muted transition-colors"
                        aria-label="Notifications"
                      >
                        <Bell className="h-4 w-4" aria-hidden />
                        <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-gold" />
                      </button>
                      <div className="flex items-center gap-3">
                        <div className="text-right leading-tight hidden sm:block">
                          <div className="text-sm font-medium text-foreground">
                            {user.user_metadata.full_name || user.email}
                          </div>
                          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                            {role === "admin" ? "Administrator" : "Receptionist"}
                          </div>
                        </div>
                        <div className="grid place-items-center h-9 w-9 rounded-full bg-forest-deep text-white font-serif">
                          {(user.user_metadata.full_name || user.email || "A")
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </div>
                </header>
                <main className="flex-1 p-6 md:p-10">
                  <div className="space-y-6">
                    <InviteStaffPanel userEmail={user.email} />
                    <Outlet />
                  </div>
                </main>
              </div>
            </div>
          </AdminRoleContext.Provider>
        );
      }}
    </AdminLogin>
  );
}
