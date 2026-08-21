import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Mail, Phone } from "lucide-react";
import { fetchGuests } from "@/lib/supabase-service";
import type { GuestRow } from "@/lib/supabase-types";

export const Route = createFileRoute("/admin/guests")({
  component: GuestsPage,
});

const TIER_COLORS: Record<string, string> = {
  Bronze: "bg-amber-100 text-amber-900 border-amber-300",
  Silver: "bg-slate-100 text-slate-800 border-slate-300",
  Gold: "bg-gold/20 text-gold-foreground border-gold",
  Platinum: "bg-forest-deep text-white border-forest-deep",
};

function GuestsPage() {
  const [q, setQ] = useState("");
  const { data: guestData, isLoading } = useQuery<GuestRow[], Error>({
    queryKey: ["guests"],
    queryFn: fetchGuests,
    placeholderData: [],
    retry: false,
  });
  const guestList = guestData ?? [];
  const filtered = useMemo(
    () =>
      guestList.filter(
        (g) =>
          g.name.toLowerCase().includes(q.toLowerCase()) ||
          g.email.toLowerCase().includes(q.toLowerCase()),
      ),
    [q, guestList],
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-gold">Loyalty</p>
        <h1 className="mt-2 font-serif text-4xl text-forest-deep">Guests</h1>
        <p className="mt-2 text-muted-foreground">{guestList.length} guest profiles</p>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search guests…"
        className="w-full max-w-md bg-background border border-border px-4 py-2.5 text-sm focus:border-gold outline-none"
      />

      {isLoading ? (
        <div className="p-12 text-center text-muted-foreground animate-pulse">
          Loading guest profiles...
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((g) => (
          <div
            key={g.id}
            className="bg-background border border-border p-6 hover:shadow-luxury transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="grid place-items-center h-12 w-12 rounded-full bg-forest-deep text-white font-serif text-lg">
                  {g.name.charAt(0)}
                </div>
                <div>
                  <div className="font-medium text-forest-deep">{g.name}</div>
                  <div className="text-xs text-muted-foreground">{g.country}</div>
                </div>
              </div>
              <span
                className={`px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] border ${TIER_COLORS[g.tier]}`}
              >
                {g.tier}
              </span>
            </div>

            <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-3 w-3" /> {g.email}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3" /> {g.phone}
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-border grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="font-serif text-xl text-forest-deep">{g.visits}</div>
                <div className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground mt-0.5">
                  Visits
                </div>
              </div>
              <div>
                <div className="font-serif text-xl text-forest-deep">
                  ${(g.totalSpend / 1000).toFixed(1)}k
                </div>
                <div className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground mt-0.5">
                  Lifetime
                </div>
              </div>
              <div>
                <div className="font-serif text-xl text-forest-deep">{g.lastStay.slice(5)}</div>
                <div className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground mt-0.5">
                  Last stay
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
