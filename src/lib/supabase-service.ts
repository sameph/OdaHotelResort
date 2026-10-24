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
  MenuItemRow,
  MenuItemInsert,
} from "./supabase-types";

export async function uploadImage(file: File, bucket: string, folder: string): Promise<string> {
  const supabase = ensureSupabase();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    throw new Error(
      "Please sign in again as an authorized admin before uploading images. Storage uploads require an authenticated session.",
    );
  }

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

  // Reduce available quantity for this room category
  try {
    await decrementRoomAvailability(booking.roomSlug || booking.room, booking.roomType);
  } catch (err) {
    console.warn("Could not decrement room availability:", err);
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
  const supabase = ensureSupabase();

  const { data: galleryImage, error: fetchError } = await (supabase.from("gallery_images") as any)
    .select("src")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }

  if (galleryImage && (galleryImage as { src?: string }).src) {
    try {
      const storageTarget = getStorageObjectPathFromUrl(galleryImage.src);
      if (storageTarget) {
        const { error: storageError } = await supabase.storage
          .from(storageTarget.bucket)
          .remove([storageTarget.path]);

        if (storageError) {
          console.warn("Gallery image storage cleanup failed:", storageError.message);
        }
      }
    } catch (error) {
      console.warn("Unable to parse gallery image storage URL:", error);
    }
  }

  const { error } = await supabase.from("gallery_images").delete().eq("id", id);
  if (error) throw error;
}

function getStorageObjectPathFromUrl(url: string): { bucket: string; path: string } | null {
  try {
    const pathname = decodeURIComponent(new URL(url).pathname);
    const match = pathname.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);

    if (!match) return null;

    const bucket = match[1];
    const path = match[2];

    if (!bucket || !path) return null;

    return { bucket, path };
  } catch {
    return null;
  }
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
  const supabase = ensureSupabase();
  const payload = { ...room };
  if (payload.available_quantity !== undefined && payload.available_quantity !== null) {
    if (payload.available_quantity <= 0) {
      payload.status = "occupied";
    } else if (payload.status === "occupied") {
      payload.status = "available";
    }
  }

  try {
    const { data, error } = await supabase
      .from("rooms")
      .insert(payload as never)
      .select()
      .single();
    if (error) throw error;
    return data as RoomRow;
  } catch (err: any) {
    if (err?.message?.includes("quantity")) {
      const fallbackPayload = { ...payload };
      delete fallbackPayload.quantity;
      delete fallbackPayload.available_quantity;
      const { data, error } = await supabase
        .from("rooms")
        .insert(fallbackPayload as never)
        .select()
        .single();
      if (error) throw error;
      return data as RoomRow;
    }
    throw err;
  }
}

export async function updateRoom(id: number, room: Partial<RoomInsert>): Promise<RoomRow> {
  const supabase = ensureSupabase();
  const payload = { ...room };
  if (payload.available_quantity !== undefined && payload.available_quantity !== null) {
    if (payload.available_quantity <= 0) {
      payload.status = "occupied";
    } else if (payload.status === "occupied") {
      payload.status = "available";
    }
  }

  try {
    const { data, error } = await supabase
      .from("rooms")
      .update(payload as never)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as RoomRow;
  } catch (err: any) {
    if (err?.message?.includes("quantity")) {
      const fallbackPayload = { ...payload };
      delete fallbackPayload.quantity;
      delete fallbackPayload.available_quantity;
      const { data, error } = await supabase
        .from("rooms")
        .update(fallbackPayload as never)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as RoomRow;
    }
    throw err;
  }
}

export async function deleteRoom(id: number): Promise<void> {
  const supabase = ensureSupabase();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    throw new Error("Please sign in as an admin before deleting a room.");
  }

  const { error } = await supabase.from("rooms").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteRooms(ids: number[]): Promise<void> {
  if (!ids.length) return;

  const supabase = ensureSupabase();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    throw new Error("Please sign in as an admin before deleting rooms.");
  }

  const { error } = await supabase.from("rooms").delete().in("id", ids);
  if (error) throw error;
}

export async function deleteContact(id: number): Promise<void> {
  const supabase = ensureSupabase();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    throw new Error("Please sign in as an admin before deleting a message.");
  }

  const { error } = await supabase.from("contacts").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteContacts(ids: number[]): Promise<void> {
  if (!ids.length) return;

  const supabase = ensureSupabase();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    throw new Error("Please sign in as an admin before deleting messages.");
  }

  const { error } = await supabase.from("contacts").delete().in("id", ids);
  if (error) throw error;
}

export async function deleteBookingsByEmails(emails: string[]): Promise<void> {
  if (!emails.length) return;

  const supabase = ensureSupabase();
  const candidateFields = ["email", "guest_email"] as const;
  let lastError: Error | null = null;

  for (const field of candidateFields) {
    const { error } = await supabase.from("bookings").delete().in(field, emails);
    if (!error) return;
    lastError = new Error(error.message);
  }

  throw lastError ?? new Error("Unable to delete the selected guest records.");
}

export async function decrementRoomAvailability(
  roomIdentifier?: string,
  roomType?: string,
  count = 1,
): Promise<void> {
  const supabase = ensureSupabase();
  const { data: rooms } = await supabase.from("rooms").select("*");
  if (!rooms || rooms.length === 0) return;

  const target = rooms.find((r: RoomRow) => {
    if (
      roomIdentifier &&
      (r.slug === roomIdentifier ||
        r.name?.toLowerCase() === roomIdentifier.toLowerCase() ||
        r.number === roomIdentifier)
    ) {
      return true;
    }
    if (roomType && r.type?.toLowerCase() === roomType.toLowerCase()) {
      return true;
    }
    return false;
  });

  if (!target) return;

  const currentTotal = target.quantity ?? 1;
  const currentAvail =
    target.available_quantity !== undefined && target.available_quantity !== null
      ? target.available_quantity
      : target.status === "occupied"
        ? 0
        : currentTotal;

  const nextAvail = Math.max(0, currentAvail - count);
  const nextStatus = nextAvail === 0 ? "occupied" : target.status;

  try {
    const { error } = await supabase
      .from("rooms")
      .update({
        available_quantity: nextAvail,
        status: nextStatus,
      } as never)
      .eq("id", target.id);

    if (error && error.message.includes("available_quantity")) {
      await supabase.from("rooms").update({ status: nextStatus } as never).eq("id", target.id);
    }
  } catch (err) {
    console.warn("Could not decrement room availability:", err);
  }
}

export async function incrementRoomAvailability(
  roomIdentifier?: string,
  roomType?: string,
  count = 1,
): Promise<void> {
  const supabase = ensureSupabase();
  const { data: rooms } = await supabase.from("rooms").select("*");
  if (!rooms || rooms.length === 0) return;

  const target = rooms.find((r: RoomRow) => {
    if (
      roomIdentifier &&
      (r.slug === roomIdentifier ||
        r.name?.toLowerCase() === roomIdentifier.toLowerCase() ||
        r.number === roomIdentifier)
    ) {
      return true;
    }
    if (roomType && r.type?.toLowerCase() === roomType.toLowerCase()) {
      return true;
    }
    return false;
  });

  if (!target) return;

  const currentTotal = target.quantity ?? 1;
  const currentAvail =
    target.available_quantity !== undefined && target.available_quantity !== null
      ? target.available_quantity
      : target.status === "occupied"
        ? 0
        : currentTotal;

  const nextAvail = Math.min(currentTotal, currentAvail + count);
  const nextStatus = nextAvail > 0 && target.status === "occupied" ? "available" : target.status;

  try {
    const { error } = await supabase
      .from("rooms")
      .update({
        available_quantity: nextAvail,
        status: nextStatus,
      } as never)
      .eq("id", target.id);

    if (error && error.message.includes("available_quantity")) {
      await supabase.from("rooms").update({ status: nextStatus } as never).eq("id", target.id);
    }
  } catch (err) {
    console.warn("Could not increment room availability:", err);
  }
}

export async function updateBookingStatus(id: number, status: string): Promise<BookingRow> {
  const supabase = ensureSupabase();
  const { data: currentBooking } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .single();

  const { data, error } = await supabase
    .from("bookings")
    .update({ status } as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;

  // When a reservation is cancelled, restore 1 unit back to room category availability
  if (status === "cancelled" && currentBooking?.status !== "cancelled") {
    try {
      await incrementRoomAvailability(
        currentBooking?.roomSlug || currentBooking?.room,
        currentBooking?.roomType,
      );
    } catch (err) {
      console.warn("Failed to restore room availability on cancellation:", err);
    }
  }

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
      const avail =
        r.available_quantity !== undefined && r.available_quantity !== null
          ? r.available_quantity
          : r.status === "occupied"
            ? 0
            : (r.quantity ?? 1);

      if (r.status !== "maintenance" && r.status !== "occupied" && avail > 0) {
        inventory[id] = avail;
      } else {
        inventory[id] = 0;
      }
    }
  });

  overlapping.forEach((b) => {
    const id = b.roomSlug || b.roomType?.toLowerCase().replace(/\s+/g, "-");
    if (id && inventory[id] !== undefined && inventory[id] > 0) {
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

export async function deleteOffers(ids: number[]): Promise<void> {
  if (!ids.length) return;
  const { error } = await ensureSupabase().from("offers").delete().in("id", ids);
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

// --- Menu Items ---

export async function fetchMenuItems(): Promise<MenuItemRow[]> {
  const supabase = ensureSupabase();
  try {
    const { data, error } = await supabase
      .from("food_menu")
      .select("*")
      .order("featured", { ascending: false })
      .order("category")
      .order("title");

    if (error) {
      if (typeof error.message === "string" && error.message.includes("Could not find the table")) {
        console.warn(
          "fetchMenuItems: food_menu table missing in DB schema cache - returning empty list.",
          error.message,
        );
        return [];
      }
      throw error;
    }

    return data ?? [];
  } catch (e: any) {
    console.warn("fetchMenuItems error, returning empty list:", e?.message ?? e);
    return [];
  }
}

export async function createMenuItem(payload: MenuItemInsert): Promise<MenuItemRow> {
  const { data, error } = await ensureSupabase()
    .from("food_menu")
    .insert(payload as never)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as MenuItemRow;
}

export async function updateMenuItem(
  id: number,
  payload: Partial<MenuItemInsert>,
): Promise<MenuItemRow> {
  const { data, error } = await ensureSupabase()
    .from("food_menu")
    .update(payload as never)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as MenuItemRow;
}

export async function deleteMenuItem(id: number): Promise<void> {
  const { error } = await ensureSupabase().from("food_menu").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteMenuItems(ids: number[]): Promise<void> {
  if (!ids.length) return;
  const { error } = await ensureSupabase().from("food_menu").delete().in("id", ids);
  if (error) throw new Error(error.message);
}
