import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Filter, Plus } from "lucide-react";
import { fetchBookings, updateBookingStatus } from "@/lib/supabase-service";
import type { BookingRow } from "@/lib/supabase-types";

type BookingStatus = "confirmed" | "checked-in" | "checked-out" | "pending" | "cancelled";

export const Route = createFileRoute("/admin/bookings")({
  component: BookingsPage,
});

const STATUSES: (BookingStatus | "all")[] = [
  "all",
  "confirmed",
  "checked-in",
  "checked-out",
  "pending",
  "cancelled",
];

function BookingsPage() {
  const [status, setStatus] = useState<BookingStatus | "all">("all");
  const [roomType, setRoomType] = useState<string>("all");
  const [q, setQ] = useState("");
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery<BookingRow[], Error>({
    queryKey: ["bookings"],
    queryFn: fetchBookings,
    placeholderData: [],
    retry: false,
  });
  const bookings = data ?? [];
  const updateStatus = useMutation({
    mutationFn: ({ id, nextStatus }: { id: number; nextStatus: string }) => updateBookingStatus(id, nextStatus),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ["bookings"] }); void queryClient.invalidateQueries({ queryKey: ["analytics"] }); },
  });
  const filtered = useMemo(
    () =>
      bookings.filter(
        (b) =>
          (status === "all" || b.status === status) &&
          (roomType === "all" || b.roomType === roomType) &&
          (q === "" ||
            b.guest.toLowerCase().includes(q.toLowerCase()) ||
            b.id.toString().toLowerCase().includes(q.toLowerCase())),
      ).sort((a,b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime()),
    [status, roomType, q, bookings]
  );
  
  const uniqueRoomTypes = useMemo(() => Array.from(new Set(bookings.map(b => b.roomType))), [bookings]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold">Front Office</p>
          <h1 className="mt-2 font-serif text-4xl text-forest-deep">Bookings</h1>
          <p className="mt-2 text-muted-foreground">
            {filtered.length} of {bookings.length} reservations
          </p>
        </div>
        <a href="/book" className="inline-flex items-center gap-2 bg-forest-deep text-white px-5 py-2.5 text-xs uppercase tracking-[0.2em] hover:bg-gold hover:text-gold-foreground transition">
          <Plus className="h-4 w-4" /> New reservation
        </a>
      </div>

      <div className="bg-background border border-border p-4 flex flex-wrap items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search guest or reference…"
          className="flex-1 min-w-[220px] bg-transparent px-3 py-2 text-sm border border-border focus:border-gold outline-none"
        />
        <div className="flex flex-wrap gap-1">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 text-[11px] uppercase tracking-[0.15em] border transition ${
                status === s
                  ? "bg-forest-deep text-white border-forest-deep"
                  : "border-border hover:border-gold"
              }`}
            >
              {s.replace("-", " ")}
            </button>
          ))}
        </div>
        <div className="flex-1 min-w-[150px] border-l border-border pl-3">
          <select 
            value={roomType} 
            onChange={e => setRoomType(e.target.value)}
            className="w-full bg-transparent px-2 text-[11px] uppercase tracking-[0.1em] text-muted-foreground outline-none"
          >
            <option value="all">ALL ROOM TYPES</option>
            {uniqueRoomTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <div className="border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive" role="alert">
          Could not load reservations: {error.message}
        </div>
      ) : isLoading ? (
        <div className="p-12 text-center text-muted-foreground animate-pulse">
          Loading reservations...
        </div>
      ) : (
        <div className="bg-background border border-border overflow-x-auto">
          <table className="w-full text-sm">
          <thead className="bg-muted/40 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <tr>
              <th className="text-left px-6 py-3">Ref</th>
              <th className="text-left px-6 py-3">Guest</th>
              <th className="text-left px-6 py-3">Room</th>
              <th className="text-left px-6 py-3">Check-in</th>
              <th className="text-left px-6 py-3">Check-out</th>
              <th className="text-center px-6 py-3">Guests</th>
              <th className="text-left px-6 py-3">Source</th>
              <th className="text-right px-6 py-3">Total</th>
              <th className="text-left px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => (
              <tr key={b.id} className="border-t border-border hover:bg-muted/30">
                <td className="px-6 py-3 font-mono text-xs">{b.id}</td>
                <td className="px-6 py-3">
                  <div className="font-medium">{b.guest}</div>
                  <div className="text-xs text-muted-foreground">{b.email}</div>
                </td>
                <td className="px-6 py-3">
                  {b.roomType} · #{b.room}
                </td>
                <td className="px-6 py-3">{b.checkIn}</td>
                <td className="px-6 py-3">{b.checkOut}</td>
                <td className="px-6 py-3 text-center">{b.guests}</td>
                <td className="px-6 py-3">{b.source}</td>
                <td className="px-6 py-3 text-right font-medium">${b.total.toLocaleString()}</td>
                <td className="px-6 py-3">
                  <select aria-label={`Status for booking ${b.ref || b.id}`} value={b.status} onChange={(e) => updateStatus.mutate({ id: b.id, nextStatus: e.target.value })} className={`${pill(b.status)} bg-transparent`}>
                    {STATUSES.slice(1).map((option) => <option key={option} value={option}>{option.replace("-", " ")}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="px-6 py-12 text-center text-muted-foreground">No reservations found.</td></tr>
            )}
          </tbody>
          </table>
          {updateStatus.error && <p className="p-4 text-sm text-destructive">{updateStatus.error.message}</p>}
      </div>
      )}
    </div>
  );
}

function pill(status: string) {
  const map: Record<string, string> = {
    confirmed: "bg-emerald-50 text-emerald-800 border-emerald-200",
    "checked-in": "bg-forest-deep text-white border-forest-deep",
    "checked-out": "bg-muted text-muted-foreground border-border",
    pending: "bg-amber-50 text-amber-800 border-amber-200",
    cancelled: "bg-red-50 text-red-800 border-red-200",
  };
  return `inline-flex items-center px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] border ${map[status] ?? "bg-muted"}`;
}
