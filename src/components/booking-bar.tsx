import { useState } from "react";
import { Calendar, Users, BedDouble, Search } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchRooms } from "@/lib/supabase-service";

export function BookingBar({ variant = "floating" }: { variant?: "floating" | "inline" }) {
  const [arrival, setArrival] = useState("");
  const [departure, setDeparture] = useState("");
  const [guests, setGuests] = useState(2);
  const [room, setRoom] = useState("");
  const navigate = useNavigate();
  const { data: rooms = [] } = useQuery({ queryKey: ["rooms"], queryFn: fetchRooms });

  const wrapper =
    variant === "floating"
      ? "relative z-20 -mt-14 md:-mt-20 mx-auto max-w-6xl"
      : "relative mx-auto max-w-6xl";

  return (
    <div id="booking" className={wrapper}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          navigate({
            to: "/book",
            search: {
              ...(arrival ? { checkIn: arrival } : {}),
              ...(departure ? { checkOut: departure } : {}),
              guests,
              ...(room ? { room } : {}),
            },
          });
        }}
        className="bg-background/95 backdrop-blur-md border border-border shadow-luxury px-4 md:px-6 py-4 md:py-5 grid grid-cols-1 md:grid-cols-5 gap-3 md:gap-2 items-end"
      >
        <Field label="Arrival" icon={Calendar}>
          <input
            type="date"
            value={arrival}
            onChange={(e) => setArrival(e.target.value)}
            aria-label="Arrival date"
            className="w-full bg-transparent text-sm text-foreground outline-none"
          />
        </Field>
        <Field label="Departure" icon={Calendar}>
          <input
            type="date"
            value={departure}
            onChange={(e) => setDeparture(e.target.value)}
            aria-label="Departure date"
            className="w-full bg-transparent text-sm text-foreground outline-none"
          />
        </Field>
        <Field label="Guests" icon={Users}>
          <select
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            aria-label="Number of guests"
            className="w-full bg-transparent text-sm text-foreground outline-none"
          >
            {[1, 2, 3, 4, 5].map((count) => (
              <option key={count} value={count}>{count} {count === 1 ? "Guest" : "Guests"}</option>
            ))}
          </select>
        </Field>
        <Field label="Room Type" icon={BedDouble}>
          <select
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            aria-label="Room type"
            className="w-full bg-transparent text-sm text-foreground outline-none"
          >
            <option value="">Any Room</option>
            {rooms.map((item) => (
              <option key={item.id} value={item.slug || item.number}>
                {item.name || `Room ${item.number}`}
              </option>
            ))}
          </select>
        </Field>
        <button
          type="submit"
          className="min-h-11 inline-flex items-center justify-center gap-2 bg-forest-deep text-white text-sm font-medium tracking-wide px-6 py-3.5 hover:bg-gold hover:text-gold-foreground transition-colors"
        >
          <Search className="h-4 w-4" aria-hidden />
          Check Availability
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  children: React.ReactNode;
}) {
  return (
    <label className="group flex flex-col gap-1 border-b border-border md:border-b-0 md:border-r md:last:border-r-0 pr-2 pb-2 md:pb-0">
      <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-gold" aria-hidden />
        {children}
      </span>
    </label>
  );
}
