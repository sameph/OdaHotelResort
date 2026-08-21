import { ensureSupabase } from "./supabase";
import type {
  BookingInsert,
  BookingRow,
  GuestRow,
  RoomInsert,
  RoomRow,
  GalleryRow,
  GalleryInsert,
  OfferRow,
  OfferInsert,
  JournalRow,
  JournalInsert,
  ContactInsert,
  ContactRow,
} from "./supabase-types";

export async function uploadImage(file: File, bucket: string, folder: string): Promise<string> {
  const supabase = ensureSupabase();
  const timestamp = Date.now();
  const filename = `${timestamp}-${file.name}`;
  const path = `${folder}/${filename}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: false });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function insertBooking(booking: BookingInsert): Promise<BookingRow> {
  const supabase = ensureSupabase();
  const { data, error } = await supabase
    .from("bookings")
    .insert([booking] as never[])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as BookingRow;
}

export async function fetchBookings(): Promise<BookingRow[]> {
  const supabase = ensureSupabase();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    throw error;
  }
  return data ?? [];
}

export async function fetchGalleryImages(): Promise<GalleryRow[]> {
  const supabase = ensureSupabase();
  try {
    const { data, error } = await supabase
      .from("gallery_images")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      if (typeof error.message === "string" && error.message.includes("Could not find the table")) {
        console.warn(
          "fetchGalleryImages: gallery_images table missing in DB schema cache - returning empty list.",
          error.message,
        );
        return [];
      }
      throw error;
    }

    return data ?? [];
  } catch (e: any) {
    console.warn("fetchGalleryImages error, returning empty list:", e?.message ?? e);
    return [];
  }
}

export async function insertGalleryImage(image: GalleryInsert): Promise<GalleryRow> {
  const { data, error } = await ensureSupabase()
    .from("gallery_images")
    .insert(image as never)
    .select()
    .single();
  if (error) throw error;
  return data as GalleryRow;
}

export async function deleteGalleryImage(id: number): Promise<void> {
  const { error } = await ensureSupabase().from("gallery_images").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchGuests(): Promise<GuestRow[]> {
  // Guest profiles are derived from real reservations, so there is no second
  // manually maintained demo-data table to drift out of date.
  const bookings = await fetchBookings();
  const byEmail = new Map<string, GuestRow>();
  for (const booking of bookings) {
    const existing = byEmail.get(booking.email);
    const completed = booking.status !== "cancelled";
    const current: GuestRow = existing ?? {
      id: booking.id,
      name: booking.guest,
      email: booking.email,
      phone: booking.phone,
      country: booking.country ?? "—",
      visits: 0,
      totalSpend: 0,
      tier: "Bronze",
      lastStay: booking.checkOut,
    };
    current.visits += 1;
    if (completed) current.totalSpend += booking.total;
    if (booking.checkOut > current.lastStay) current.lastStay = booking.checkOut;
    byEmail.set(booking.email, current);
  }
  return [...byEmail.values()].map((guest) => ({
    ...guest,
    tier:
      guest.totalSpend >= 100000
        ? "Platinum"
        : guest.totalSpend >= 50000
          ? "Gold"
          : guest.totalSpend >= 20000
            ? "Silver"
            : "Bronze",
  }));
}

export async function fetchRooms(): Promise<RoomRow[]> {
  const supabase = ensureSupabase();
  const { data, error } = await supabase.from("rooms").select("*").order("number");
  if (error) {
    throw error;
  }
  return data ?? [];
}

export async function createRoom(room: RoomInsert): Promise<RoomRow> {
  const { data, error } = await ensureSupabase()
    .from("rooms")
    .insert(room as never)
    .select()
    .single();
  if (error) throw error;
  return data as RoomRow;
}

export async function updateRoom(id: number, room: Partial<RoomInsert>): Promise<RoomRow> {
  const { data, error } = await ensureSupabase()
    .from("rooms")
    .update(room as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as RoomRow;
}

export async function deleteRoom(id: number): Promise<void> {
  const { error } = await ensureSupabase().from("rooms").delete().eq("id", id);
  if (error) throw error;
}

export async function updateBookingStatus(id: number, status: string): Promise<BookingRow> {
  const { data, error } = await ensureSupabase()
    .from("bookings")
    .update({ status } as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as BookingRow;
}

export async function fetchAnalyticsData() {
  const bookings = await fetchBookings();
  const rooms = await fetchRooms();

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const revMap: Record<string, { revenue: number; nights: number }> = {};
  months.forEach((m) => (revMap[m] = { revenue: 0, nights: 0 }));
  const srcMap: Record<string, number> = {};
  const qtrMap: Record<string, any> = {
    Q1: { Direct: 0, "Booking.com": 0, Expedia: 0, Corporate: 0 },
    Q2: { Direct: 0, "Booking.com": 0, Expedia: 0, Corporate: 0 },
    Q3: { Direct: 0, "Booking.com": 0, Expedia: 0, Corporate: 0 },
    Q4: { Direct: 0, "Booking.com": 0, Expedia: 0, Corporate: 0 },
  };

  bookings.forEach((b) => {
    if (!b.checkIn) return;
    const date = new Date(b.checkIn);
    const m = date.getMonth();
    const month = months[m];

    revMap[month].revenue += b.total;
    revMap[month].nights += b.nights;
    srcMap[b.source] = (srcMap[b.source] || 0) + 1;

    const q = Math.floor(m / 3) + 1;
    const qLabel = `Q${q}`;
    if (qtrMap[qLabel] && qtrMap[qLabel][b.source] !== undefined) {
      qtrMap[qLabel][b.source] += b.total;
    } else if (qtrMap[qLabel]) {
      qtrMap[qLabel][b.source] = (qtrMap[qLabel][b.source] || 0) + b.total;
    }
  });

  const totalRoomDays = rooms.length * 30;

  const revenueByMonth = months.map((m) => ({
    month: m,
    revenue: revMap[m].revenue,
    occupancy:
      totalRoomDays > 0 ? Math.min(100, Math.round((revMap[m].nights / totalRoomDays) * 100)) : 0,
  }));

  const bookingSources = Object.entries(srcMap).map(([name, value]) => ({ name, value }));

  const channel = ["Q1", "Q2", "Q3", "Q4"].map((q) => ({
    month: q,
    ...qtrMap[q],
  }));

  return { revenueByMonth, bookingSources, channel };
}

export async function checkAvailability(checkIn: string, checkOut: string): Promise<string[]> {
  const rooms = await fetchRooms();
  const bookings = await fetchBookings();

  const ci = new Date(checkIn).getTime();
  const co = new Date(checkOut).getTime();

  const overlapping = bookings.filter((b) => {
    if (b.status === "cancelled" || b.status === "checked-out") return false;
    if (!b.checkIn || !b.checkOut) return false;
    const bCi = new Date(b.checkIn).getTime();
    const bCo = new Date(b.checkOut).getTime();
    return bCi < co && bCo > ci; // Overlap logic
  });

  const inventory: Record<string, number> = {};
  rooms.forEach((r) => {
    const id =
      r.slug ||
      r.name?.toLowerCase().replace(/\s+/g, "-") ||
      r.type?.toLowerCase().replace(/\s+/g, "-");
    if (id) {
      // Assuming 'maintenance' means it's not available to book.
      if (r.status !== "maintenance") {
        inventory[id] = (inventory[id] || 0) + 1;
      }
    }
  });

  overlapping.forEach((b) => {
    const id = b.roomSlug || b.roomType?.toLowerCase().replace(/\s+/g, "-");
    if (id && inventory[id] !== undefined) {
      inventory[id]--;
    }
  });

  return Object.keys(inventory).filter((id) => inventory[id] > 0);
}

// --- Offers ---

export async function fetchOffers(): Promise<OfferRow[]> {
  const supabase = ensureSupabase();
  try {
    const { data, error } = await supabase
      .from("offers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      // If the offers table is missing in the connected database, return an
      // empty array instead of throwing so the site can still render.
      if (typeof error.message === "string" && error.message.includes("Could not find the table")) {
        console.warn(
          "fetchOffers: offers table missing in DB schema cache - returning empty list.",
          error.message,
        );
        return [];
      }
      throw new Error(error.message);
    }

    return data || [];
  } catch (e: any) {
    // Defensive fallback - log and return empty array so loaders don't crash.
    console.warn("fetchOffers error, returning empty list:", e?.message ?? e);
    return [];
  }
}

export async function createOffer(payload: OfferInsert): Promise<OfferRow> {
  const { data, error } = await ensureSupabase()
    .from("offers")
    .insert(payload as never)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateOffer(id: number, payload: Partial<OfferInsert>): Promise<OfferRow> {
  const { data, error } = await ensureSupabase()
    .from("offers")
    .update(payload as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteOffer(id: number): Promise<void> {
  const { error } = await ensureSupabase().from("offers").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// --- Journal ---

export async function fetchJournalPosts(): Promise<JournalRow[]> {
  const supabase = ensureSupabase();
  const { data, error } = await supabase
    .from("journal_posts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function createJournalPost(payload: JournalInsert): Promise<JournalRow> {
  const { data, error } = await ensureSupabase()
    .from("journal_posts")
    .insert(payload as never)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateJournalPost(
  id: number,
  payload: Partial<JournalInsert>,
): Promise<JournalRow> {
  const { data, error } = await ensureSupabase()
    .from("journal_posts")
    .update(payload as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteJournalPost(id: number): Promise<void> {
  const { error } = await ensureSupabase().from("journal_posts").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// --- Contacts ---

export async function fetchContacts(): Promise<ContactRow[]> {
  const supabase = ensureSupabase();
  try {
    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      if (typeof error.message === "string" && error.message.includes("Could not find the table")) {
        return [];
      }
      throw error;
    }
    return data ?? [];
  } catch (e: any) {
    return [];
  }
}

export async function insertContact(payload: ContactInsert): Promise<ContactRow> {
  const { data, error } = await ensureSupabase()
    .from("contacts")
    .insert(payload as never)
    .select()
    .single();
  if (error) throw error;
  return data as ContactRow;
}

export async function updateContactStatus(id: number, status: string): Promise<ContactRow> {
  const { data, error } = await ensureSupabase()
    .from("contacts")
    .update({ status } as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as ContactRow;
}

