export type AdminRole = "admin" | "receptionist";

export function getUserRole(
  user:
    | {
        user_metadata?: Record<string, unknown>;
        app_metadata?: Record<string, unknown>;
        email?: string | null;
      }
    | null
    | undefined,
): AdminRole | null {
  const rawRole =
    user?.user_metadata?.role ??
    user?.user_metadata?.admin_role ??
    user?.app_metadata?.role ??
    user?.app_metadata?.admin_role;

  if (typeof rawRole === "string") {
    const normalized = rawRole.toLowerCase().trim();
    if (normalized === "admin" || normalized === "receptionist") {
      return normalized;
    }
  }

  const email = user?.email?.toLowerCase() ?? "";
  if (email.includes("admin")) {
    return "admin";
  }

  return null;
}

export type AdminNavItem = {
  readonly to: string;
  readonly label: string;
  readonly exact?: boolean;
};

export const adminNavItems: readonly AdminNavItem[] = [
  { to: "/admin", label: "Dashboard", exact: true },
  { to: "/admin/bookings", label: "Bookings" },
  { to: "/admin/rooms", label: "Rooms" },
  { to: "/admin/guests", label: "Guests" },
  { to: "/admin/offers", label: "Offers" },
  { to: "/admin/menu", label: "Menu" },
  { to: "/admin/contacts", label: "Messages" },
  { to: "/admin/invite", label: "Invite" },
  { to: "/admin/analytics", label: "Analytics" },
  { to: "/admin/gallery", label: "Gallery" },
];

export const receptionistNavItems: readonly AdminNavItem[] = [
  { to: "/admin", label: "Dashboard", exact: true },
  { to: "/admin/bookings", label: "Bookings" },
  { to: "/admin/rooms", label: "Rooms" },
  { to: "/admin/guests", label: "Guests" },
];

export function canAccessAdminRoute(route: string, role: AdminRole | null): boolean {
  if (!role) return false;

  const allowed = role === "admin" ? adminNavItems : receptionistNavItems;
  const normalizedRoute = route === "/admin" ? "/admin" : route;

  return allowed.some((item) => {
    if (item.exact) return normalizedRoute === item.to;
    return normalizedRoute.startsWith(item.to);
  });
}
