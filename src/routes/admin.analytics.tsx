import { createFileRoute } from "@tanstack/react-router";
import {
  BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
  LineChart, Line, Legend,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { fetchAnalyticsData } from "@/lib/supabase-service";
import { useAdminRole } from "./admin";

export const Route = createFileRoute("/admin/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const role = useAdminRole();
  if (role === "receptionist") {
    return <div className="p-16 text-center text-muted-foreground">Unauthorized access. Only administrators can view Analytics.</div>;
  }

  const { data: analytics } = useQuery({
    queryKey: ["analytics"],
    queryFn: fetchAnalyticsData,
    retry: false,
  });

  const revenueByMonth = analytics?.revenueByMonth ?? [];
  const channel = analytics?.channel ?? [];
  const adr = revenueByMonth.map((m) => ({ 
    month: m.month, 
    adr: m.occupancy > 0 ? Math.round(m.revenue / (m.occupancy * 3.5)) : 0 
  }));

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-gold">Reports</p>
        <h1 className="mt-2 font-serif text-4xl text-forest-deep">Analytics</h1>
        <p className="mt-2 text-muted-foreground">Performance across the past 12 months</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Average Daily Rate">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={adr}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
              <XAxis dataKey="month" stroke="#8a8a8a" fontSize={11} />
              <YAxis stroke="#8a8a8a" fontSize={11} />
              <Tooltip />
              <Line type="monotone" dataKey="adr" stroke="#D4AF37" strokeWidth={2.5} dot={{ fill: "#0E4B3C", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Occupancy Trend">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
              <XAxis dataKey="month" stroke="#8a8a8a" fontSize={11} />
              <YAxis stroke="#8a8a8a" fontSize={11} unit="%" />
              <Tooltip />
              <Bar dataKey="occupancy" fill="#0E4B3C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card title="Revenue by Channel">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={channel}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
            <XAxis dataKey="month" stroke="#8a8a8a" fontSize={11} />
            <YAxis stroke="#8a8a8a" fontSize={11} />
            <Tooltip />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="Direct" stackId="a" fill="#0E4B3C" />
            <Bar dataKey="Booking.com" stackId="a" fill="#D4AF37" />
            <Bar dataKey="Expedia" stackId="a" fill="#5a8a5c" />
            <Bar dataKey="Corporate" stackId="a" fill="#a0c49d" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-background border border-border p-6">
      <h2 className="font-serif text-2xl text-forest-deep">{title}</h2>
      <div className="mt-6">{children}</div>
    </div>
  );
}
