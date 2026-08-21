import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminLogin } from "@/components/admin-login";
import { Bell, Search } from "lucide-react";

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
  return (
    <AdminLogin>{(user) => <div className="min-h-screen flex bg-[oklch(0.98_0.005_85)]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-md border-b border-border">
          <div className="flex items-center justify-between gap-4 px-6 md:px-10 py-4">
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <Search className="h-4 w-4 text-muted-foreground" aria-hidden />
              <input
                type="search"
                placeholder="Search bookings, guests, rooms…"
                className="w-full bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-4">
              <button className="relative rounded-full p-2 hover:bg-muted transition-colors" aria-label="Notifications">
                <Bell className="h-4 w-4" aria-hidden />
                <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-gold" />
              </button>
              <div className="flex items-center gap-3">
                <div className="text-right leading-tight hidden sm:block">
                  <div className="text-sm font-medium text-foreground">{user.user_metadata.full_name || user.email}</div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Administrator</div>
                </div>
                <div className="grid place-items-center h-9 w-9 rounded-full bg-forest-deep text-white font-serif">{(user.user_metadata.full_name || user.email || "A").charAt(0).toUpperCase()}</div>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 md:p-10">
          <Outlet />
        </main>
      </div>
    </div>}</AdminLogin>
  );
}
