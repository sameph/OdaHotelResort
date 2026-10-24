import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
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
import { canAccessAdminRoute, type AdminRole } from "@/lib/admin-roles";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Console — ODA Resort Hotel" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const location = useLocation();

  return (
    <AdminLogin>
      {(user, role: AdminRole) => {
        if (!canAccessAdminRoute(location.pathname, role)) {
          return (
            <div className="min-h-screen grid place-items-center bg-[oklch(0.98_0.005_85)] p-6">
              <div className="max-w-md rounded-lg border border-border bg-background p-8 text-center shadow-luxury">
                <p className="text-[10px] uppercase tracking-[0.3em] text-gold">Access denied</p>
                <h1 className="mt-3 font-serif text-3xl text-forest-deep">
                  This area is not available for your role.
                </h1>
                <p className="mt-3 text-sm text-muted-foreground">
                  {role === "admin"
                    ? "You are signed in as an administrator and can access all admin pages."
                    : "Receptionists can manage bookings, rooms, and guest records only."}
                </p>
              </div>
            </div>
          );
        }

        return (
          <div className="h-screen overflow-hidden bg-[oklch(0.98_0.005_85)]">
            <AdminSidebar
              role={role}
              className="hidden lg:flex flex-col w-64 shrink-0 bg-forest-deep text-white fixed left-0 top-0 bottom-0"
            />
            <div className="flex h-screen flex-col lg:ml-64 min-w-0">
              <header className="sticky top-0 z-30 shrink-0 bg-background/85 backdrop-blur-md border-b border-border">
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
                        <AdminSidebar role={role} className="flex flex-col w-64 shrink-0 h-full" />
                      </SheetContent>
                    </Sheet>
                    <Search className="h-4 w-4 text-muted-foreground hidden sm:block" aria-hidden />
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
              <main className="flex-1 overflow-y-auto p-6 md:p-10">
                <Outlet />
              </main>
            </div>
          </div>
        );
      }}
    </AdminLogin>
  );
}
