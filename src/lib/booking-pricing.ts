import type { BookingRow } from "./supabase-types";
import { getServerSupabase } from "./server-supabase";

// These are hotel-controlled add-ons. Prices must live on the server too, so
// changing browser data can never reduce the amount sent to Chapa.
const EXTRA_PRICES: Record<string, number> = {
  breakfast: 650,
  airport: 1800,
  spa: 2400,
  celebration: 1200,
};

export type BookingQuote = {
  roomName: string;
  roomRate: number;
  extrasTotal: number;
  subtotal: number;
  tax: number;
  total: number;
};

function selectedExtras(value: BookingRow["extras"]): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (typeof value === "string") {
    try {
      return selectedExtras(JSON.parse(value));
    } catch {
      return [];
    }
  }
  return [];
}

/** Recalculate a reservation from the current room rate before payment. */
export async function quoteBooking(booking: BookingRow): Promise<BookingQuote> {
  const supabase = getServerSupabase();
  const { data: room, error } = await supabase
    .from("rooms")
    .select("name, number, slug, price")
    .or(`slug.eq.${booking.roomSlug},number.eq.${booking.roomSlug}`)
    .maybeSingle();

  if (error || !room) throw new Error("The selected room is no longer available. Please choose a room again.");

  const checkIn = new Date(booking.checkIn).getTime();
  const checkOut = new Date(booking.checkOut).getTime();
  const nights = Math.max(1, Math.round((checkOut - checkIn) / 86_400_000));
  const roomRate = Number(room.price);
  if (!Number.isFinite(roomRate) || roomRate < 0) throw new Error("The selected room has an invalid price.");

  const extrasTotal = selectedExtras(booking.extras).reduce(
    (total, id) => total + (EXTRA_PRICES[id] ?? 0) * nights,
    0,
  );
  const subtotal = roomRate * nights + extrasTotal;
  return {
    roomName: room.name || `Room ${room.number}`,
    roomRate,
    extrasTotal,
    subtotal,
    tax: 0,
    total: subtotal,
  };
}
