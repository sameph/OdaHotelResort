import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  CalendarCheck,
  BedDouble,
  Users,
  BarChart3,
  Home,
  LogOut,
  Image as ImageIcon,
  Tag,
  MessageSquare,
  UtensilsCrossed,
} from "lucide-react";
import { ensureSupabase } from "@/lib/supabase";
import { adminNavItems, receptionistNavItems, type AdminRole } from "@/lib/admin-roles";

const itemIcons = {
  "/admin": LayoutDashboard,
  "/admin/bookings": CalendarCheck,
  "/admin/rooms": BedDouble,
  "/admin/guests": Users,
  "/admin/offers": Tag,
  "/admin/invite": Users,
  "/admin/menu": UtensilsCrossed,
  "/admin/contacts": MessageSquare,
  "/admin/analytics": BarChart3,
  "/admin/gallery": ImageIcon,
} as const;

export function AdminSidebar({ role, className }: { role: AdminRole; className?: string }) {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const items = role === "admin" ? adminNavItems : receptionistNavItems;

  return (
    <aside
      className={
        className ||
        "hidden lg:flex flex-col w-64 shrink-0 bg-forest-deep text-white fixed left-0 top-0 bottom-0"
      }
    >
      <div className="px-6 py-6 border-b border-white/10">
        <Link to="/" className="flex items-center gap-3 font-serif">
          <span className="grid place-items-center h-10 w-10 rounded-full border-2 border-gold text-gold italic text-lg">
            O
          </span>
          <div className="leading-none">
            <div className="text-lg tracking-[0.15em]">ODA</div>
            <div className="text-[9px] uppercase tracking-[0.3em] text-white/60 mt-1">
              Admin Console
            </div>
          </div>
        </Link>
      </div>

      <div className="px-3 pt-3">
        <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-[10px] uppercase tracking-[0.25em] text-gold">
          {role === "admin" ? "Administrator" : "Receptionist"}
        </div>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto" aria-label="Admin">
        {items.map((it) => {
          const active = it.exact ? path === it.to : path.startsWith(it.to);
          const Icon = itemIcons[it.to as keyof typeof itemIcons] ?? LayoutDashboard;
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
        <Link
          to="/"
          className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-white/75 hover:bg-white/5 hover:text-white"
        >
          <Home className="h-4 w-4" aria-hidden />
          View site
        </Link>
        <button
          onClick={() => void ensureSupabase().auth.signOut()}
          className="w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-white/75 hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          Sign out
        </button>
      </div>
    </aside>
  );
}
