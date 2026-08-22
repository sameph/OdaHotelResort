import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, CalendarCheck, BedDouble, Users, BarChart3, Home, LogOut, Image as ImageIcon, Tag, MessageSquare } from "lucide-react";
import { ensureSupabase } from "@/lib/supabase";

const items: { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/bookings", label: "Bookings", icon: CalendarCheck },
  { to: "/admin/rooms", label: "Rooms", icon: BedDouble },
  { to: "/admin/guests", label: "Guests", icon: Users },
  { to: "/admin/offers", label: "Offers", icon: Tag },
  { to: "/admin/contacts", label: "Messages", icon: MessageSquare },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/gallery", label: "Gallery", icon: ImageIcon },
];

export function AdminSidebar({ className }: { className?: string }) {
  const path = useRouterState({ select: (r) => r.location.pathname });
  return (
    <aside className={className || "hidden lg:flex flex-col w-64 shrink-0 bg-forest-deep text-white sticky top-0 h-screen"}>
      <div className="px-6 py-6 border-b border-white/10">
        <Link to="/" className="flex items-center gap-3 font-serif">
          <span className="grid place-items-center h-10 w-10 rounded-full border-2 border-gold text-gold italic text-lg">O</span>
          <div className="leading-none">
            <div className="text-lg tracking-[0.15em]">ODA</div>
            <div className="text-[9px] uppercase tracking-[0.3em] text-white/60 mt-1">Admin Console</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1" aria-label="Admin">
        {items.map((it) => {
          const active = it.exact ? path === it.to : path.startsWith(it.to);
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to as "/admin"}
              className={`group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-all ${
                active
                  ? "bg-gold text-gold-foreground font-medium"
                  : "text-white/75 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden />
              <span className="tracking-wide">{it.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10 space-y-1">
        <Link to="/" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-white/75 hover:bg-white/5 hover:text-white">
          <Home className="h-4 w-4" aria-hidden />
          View site
        </Link>
        <button onClick={() => void ensureSupabase().auth.signOut()} className="w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-white/75 hover:bg-white/5 hover:text-white">
          <LogOut className="h-4 w-4" aria-hidden />
          Sign out
        </button>
      </div>
    </aside>
  );
}
