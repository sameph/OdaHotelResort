import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, TrendingUp, TrendingDown, DollarSign, BedDouble, Users, CalendarCheck } from "lucide-react";
import {
  Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { fetchBookings, fetchAnalyticsData, fetchRooms } from "@/lib/supabase-service";
import type { BookingRow } from "@/lib/supabase-types";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

const PIE_COLORS = ["#0E4B3C", "#D4AF37", "#5a8a5c", "#a0c49d"];

function AdminDashboard() {
  const { data: bookings } = useQuery<BookingRow[], Error>({
    queryKey: ["bookings"],
    queryFn: fetchBookings,
    placeholderData: [],
    retry: false,
  });

  const { data: analytics } = useQuery({
    queryKey: ["analytics"],
    queryFn: fetchAnalyticsData,
    retry: false,
  });
  const { data: rooms } = useQuery({ queryKey: ["rooms"], queryFn: fetchRooms, retry: false });

  const today = new Date().toISOString().slice(0, 10);
  const activeBookings = (bookings ?? []).filter((b) => b.status !== "cancelled" && b.checkIn <= today && b.checkOut > today);
  const monthBookings = (bookings ?? []).filter((b) => b.created_at?.slice(0, 7) === today.slice(0, 7));
  const monthRevenue = (bookings ?? []).filter((b) => b.status !== "cancelled" && b.checkIn?.slice(0, 7) === today.slice(0, 7)).reduce((sum, b) => sum + b.total, 0);
  const kpis = [
    { label: "Revenue (MTD)", value: `Br ${monthRevenue.toLocaleString()}`, icon: DollarSign },
    { label: "Occupied rooms", value: `${activeBookings.length} / ${rooms?.length ?? 0}`, icon: BedDouble },
    { label: "New bookings", value: String(monthBookings.length), icon: CalendarCheck },
    { label: "Active guests", value: String(activeBookings.reduce((sum, b) => sum + b.guests, 0)), icon: Users },
  ];

  const revenueByMonth = analytics?.revenueByMonth ?? [];
  const bookingSources = analytics?.bookingSources ?? [];

  const recent = (bookings ?? []).slice(0, 6);

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold">Overview</p>
          <h1 className="mt-2 font-serif text-4xl md:text-5xl text-forest-deep">Hotel overview</h1>
          <p className="mt-2 text-muted-foreground">Live performance from your reservations and inventory.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 text-xs uppercase tracking-[0.2em] border border-border hover:bg-muted transition">Export</button>
          <Link to="/admin/bookings" className="px-4 py-2 text-xs uppercase tracking-[0.2em] bg-forest-deep text-white hover:bg-gold hover:text-gold-foreground transition">
            New booking
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="group bg-background border border-border p-6 hover:shadow-luxury transition-all">
            <div className="flex items-start justify-between">
              <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{k.label}</div>
              <k.icon className="h-4 w-4 text-gold" aria-hidden />
            </div>
            <div className="mt-4 font-serif text-3xl text-forest-deep">{k.value}</div>
            <div className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">Live data</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-background border border-border p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl text-forest-deep">Revenue & Occupancy</h2>
            <div className="flex gap-2 text-[11px]">
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-forest-deep" />Revenue</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-gold" />Occupancy %</span>
            </div>
          </div>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueByMonth}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0E4B3C" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#0E4B3C" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="occ" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                <XAxis dataKey="month" stroke="#8a8a8a" fontSize={11} />
                <YAxis yAxisId="l" stroke="#8a8a8a" fontSize={11} />
                <YAxis yAxisId="r" orientation="right" stroke="#8a8a8a" fontSize={11} />
                <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: 4 }} />
                <Area yAxisId="l" type="monotone" dataKey="revenue" stroke="#0E4B3C" strokeWidth={2} fill="url(#rev)" />
                <Area yAxisId="r" type="monotone" dataKey="occupancy" stroke="#D4AF37" strokeWidth={2} fill="url(#occ)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-background border border-border p-6">
          <h2 className="font-serif text-2xl text-forest-deep">Booking Sources</h2>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={bookingSources} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                  {bookingSources.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-background border border-border">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="font-serif text-2xl text-forest-deep">Recent Bookings</h2>
          <Link to="/admin/bookings" className="text-sm text-forest hover:text-gold inline-flex items-center gap-1">
            View all <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <tr>
                <th className="text-left px-6 py-3">Ref</th>
                <th className="text-left px-6 py-3">Guest</th>
                <th className="text-left px-6 py-3">Room</th>
                <th className="text-left px-6 py-3">Check-in</th>
                <th className="text-left px-6 py-3">Nights</th>
                <th className="text-right px-6 py-3">Total</th>
                <th className="text-left px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((b) => (
                <tr key={b.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-6 py-3 font-mono text-xs">{b.id}</td>
                  <td className="px-6 py-3">{b.guest}</td>
                  <td className="px-6 py-3">{b.roomType} · #{b.room}</td>
                  <td className="px-6 py-3">{b.checkIn}</td>
                  <td className="px-6 py-3">{b.nights}</td>
                  <td className="px-6 py-3 text-right font-medium">${b.total.toLocaleString()}</td>
                  <td className="px-6 py-3"><StatusPill status={b.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    confirmed: "bg-emerald-50 text-emerald-800 border-emerald-200",
    "checked-in": "bg-forest-deep text-white border-forest-deep",
    "checked-out": "bg-muted text-muted-foreground border-border",
    pending: "bg-amber-50 text-amber-800 border-amber-200",
    cancelled: "bg-red-50 text-red-800 border-red-200",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] border ${map[status] ?? "bg-muted"}`}>
      {status.replace("-", " ")}
    </span>
  );
}
