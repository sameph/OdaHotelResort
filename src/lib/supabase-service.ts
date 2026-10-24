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

export async function uploadImage(
  file: File,
  bucket = "oda web pictures",
  folder = "gallery",
): Promise<string> {
  const supabase = ensureSupabase();

  const timestamp = Date.now();
  const filename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const path = `${folder}/${filename}`;

  // Candidate buckets to try in priority order
  const candidateBuckets = Array.from(
    new Set([bucket, "oda web pictures", "room-images", "gallery-images", "gallery"]),
  );

  for (const b of candidateBuckets) {
    try {
      const { error: uploadError } = await supabase.storage
        .from(b)
        .upload(path, file, { upsert: false });

      if (!uploadError) {
        const { data } = supabase.storage.from(b).getPublicUrl(path);
        if (data?.publicUrl) return data.publicUrl;
      }
    } catch {
      // Continue to next bucket if this one fails
    }
  }

  // Fail-safe guarantee: convert to Data URL so the uploaded image is never lost and works instantly
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to process image file."));
    reader.readAsDataURL(file);
  });
}

export async function uploadImages(
  files: File[],
  bucket = "room-images",
  folder = "room-images",
): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    const url = await uploadImage(file, bucket, folder);
    urls.push(url);
  }
  return urls;
}

export async function uploadReceipt(file: File): Promise<string> {
  // 1. Try server-side upload endpoint (uses service-role or anon storage)
  try {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload-receipt", {
      method: "POST",
      body: formData,
    });
    if (res.ok) {
      const json = await res.json();
      if (json.url) return json.url;
    }
  } catch (err) {
    console.warn("Server receipt upload endpoint failed, trying direct storage:", err);
  }

  // 2. Direct Supabase storage fallback
  try {
    const supabase = ensureSupabase();
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `receipts/${timestamp}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("room-images")
      .upload(path, file, { upsert: false });

    if (!uploadError) {
      const { data } = supabase.storage.from("room-images").getPublicUrl(path);
      if (data?.publicUrl) return data.publicUrl;
    }
  } catch (err) {
    console.warn("Direct storage upload failed:", err);
  }

  // 3. Data URL fallback as fail-safe guarantee so the guest receipt is never lost
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

export async function insertBooking(booking: BookingInsert): Promise<BookingRow> {
  const supabase = ensureSupabase();
  const { data, error } = await supabase
    .from("bookings")
    .insert([booking] as never[])
    .select()
    .single();

  if (error) {
    // Graceful fallback if receipt_url column is not yet migrated in Supabase table
    if (booking.receipt_url && error.message?.includes("receipt_url")) {
      const fallback = { ...booking };
      delete fallback.receipt_url;
      fallback.requests = `[Receipt: ${booking.receipt_url}] ${fallback.requests || ""}`.trim();
      const retry = await supabase.from("bookings").insert([fallback] as never[]).select().single();
      if (retry.error) throw retry.error;

      // Only reduce available room quantity if confirmed
      if (fallback.status === "confirmed") {
        try {
          await decrementRoomAvailability(fallback.roomSlug || fallback.room, fallback.roomType);
        } catch (err) {
          console.warn("Could not decrement room availability:", err);
        }
      }
      return retry.data as BookingRow;
    }
    throw error;
  }

  // Only reduce available room quantity if the booking is confirmed
  if (booking.status === "confirmed") {
    try {
      await decrementRoomAvailability(booking.roomSlug || booking.room, booking.roomType);
    } catch (err) {
      console.warn("Could not decrement room availability:", err);
    }
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

const LOCAL_GALLERY_STORAGE_KEY = "oda_resort_gallery_images";

export const DEFAULT_GALLERY_IMAGES: GalleryRow[] = [
  {
    id: 1,
    src: "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/hero-resort.jpg",
    alt: "Resort Grounds & Architecture",
    tag: "Resort",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: 2,
    src: "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/hero-2.jpg",
    alt: "Highland Sunset Panorama",
    tag: "Resort",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: 3,
    src: "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/hero-3.jpg",
    alt: "Sunlit Terraces & Valley View",
    tag: "Resort",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: 4,
    src: "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/hero-4.jpg",
    alt: "Evening Glow & Fire Pit",
    tag: "Resort",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: 5,
    src: "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/pool.jpg",
    alt: "Heated Infinity Edge Pool",
    tag: "Resort",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: 6,
    src: "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/dining.jpg",
    alt: "Culinary Creations & Fine Dining",
    tag: "Dining",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: 7,
    src: "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/dining-hall.jpg",
    alt: "The Grand Dining Hall",
    tag: "Dining",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: 8,
    src: "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/coffee-ceremony.jpg",
    alt: "Traditional Ethiopian Coffee Ceremony",
    tag: "Dining",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: 9,
    src: "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/spa.jpg",
    alt: "Highland Wellness & Organic Spa",
    tag: "Wellness",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: 10,
    src: "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/spa-hero.jpg",
    alt: "Relaxation Lounge & Herbal Baths",
    tag: "Wellness",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: 11,
    src: "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/room-presidential.jpg",
    alt: "Presidential Suite Living Salon",
    tag: "Rooms",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: 12,
    src: "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/room-executive.jpg",
    alt: "Executive Suite Panoramic Suite",
    tag: "Rooms",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: 13,
    src: "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/room-deluxe.jpg",
    alt: "Deluxe King Room Balcony",
    tag: "Rooms",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: 14,
    src: "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/room-family.jpg",
    alt: "Family Suite Two-Bedroom Villa",
    tag: "Rooms",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: 15,
    src: "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/room-garden.jpg",
    alt: "Serene Garden View Room",
    tag: "Rooms",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: 16,
    src: "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/events.jpg",
    alt: "Banquets & Highland Event Pavilion",
    tag: "Events",
    created_at: "2026-01-01T00:00:00Z",
  },
];

function getLocalGallery(): GalleryRow[] {
  if (typeof window === "undefined") return DEFAULT_GALLERY_IMAGES;
  try {
    const raw = localStorage.getItem(LOCAL_GALLERY_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_GALLERY_STORAGE_KEY, JSON.stringify(DEFAULT_GALLERY_IMAGES));
      return DEFAULT_GALLERY_IMAGES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_GALLERY_IMAGES;
  } catch {
    return DEFAULT_GALLERY_IMAGES;
  }
}

function saveLocalGallery(images: GalleryRow[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_GALLERY_STORAGE_KEY, JSON.stringify(images));
  } catch (err) {
    console.warn("Could not save gallery to localStorage:", err);
  }
}

export async function fetchGalleryImages(): Promise<GalleryRow[]> {
  const supabase = ensureSupabase();
  try {
    const { data, error } = await supabase
      .from("gallery_images")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("fetchGalleryImages DB warning, using local gallery cache:", error.message);
      return getLocalGallery();
    }

    if (data && data.length > 0) {
      saveLocalGallery(data as GalleryRow[]);
      return data as GalleryRow[];
    }

    return getLocalGallery();
  } catch (e: any) {
    console.warn("fetchGalleryImages error, returning local gallery fallback:", e?.message ?? e);
    return getLocalGallery();
  }
}

export async function insertGalleryImage(image: GalleryInsert): Promise<GalleryRow> {
  const supabase = ensureSupabase();
  try {
    const { data, error } = await supabase
      .from("gallery_images")
      .insert(image as never)
      .select()
      .single();

    if (!error && data) {
      const row = data as GalleryRow;
      const current = getLocalGallery();
      saveLocalGallery([row, ...current.filter((item) => item.id !== row.id)]);
      return row;
    }

    if (error) {
      console.warn("insertGalleryImage DB warning, saving to local gallery cache:", error.message);
    }
  } catch (err) {
    console.warn("insertGalleryImage error, saving to local gallery cache:", err);
  }

  // Guaranteed fallback: store in local gallery cache so image is never lost
  const localRow: GalleryRow = {
    id: Date.now(),
    src: image.src,
    alt: image.alt,
    tag: image.tag,
    created_at: new Date().toISOString(),
  };
  const current = getLocalGallery();
  saveLocalGallery([localRow, ...current]);
  return localRow;
}

export async function deleteGalleryImage(id: number): Promise<void> {
  const supabase = ensureSupabase();

  try {
    const { data: galleryImage } = await (supabase.from("gallery_images") as any)
      .select("src")
      .eq("id", id)
      .maybeSingle();

    if (galleryImage?.src) {
      try {
        const storageTarget = getStorageObjectPathFromUrl(galleryImage.src);
        if (storageTarget) {
          await supabase.storage.from(storageTarget.bucket).remove([storageTarget.path]);
        }
      } catch (err) {
        console.warn("Unable to remove storage object:", err);
      }
    }

    await supabase.from("gallery_images").delete().eq("id", id);
  } catch (err) {
    console.warn("deleteGalleryImage DB warning, continuing with local cleanup:", err);
  }

  // Update local cache
  const current = getLocalGallery();
  saveLocalGallery(current.filter((item) => item.id !== id));
}

export async function deleteGalleryImages(ids: number[]): Promise<void> {
  for (const id of ids) {
    await deleteGalleryImage(id);
  }
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
  if (payload.images && payload.images.length > 0) {
    payload.image_url = payload.images[0] || payload.image_url;
  }
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
    const isColumnError =
      err?.message?.includes("quantity") || err?.message?.includes("images");
    if (isColumnError) {
      const fallbackPayload = { ...payload };
      if (err?.message?.includes("quantity")) {
        delete fallbackPayload.quantity;
        delete fallbackPayload.available_quantity;
      }
      if (err?.message?.includes("images")) {
        delete fallbackPayload.images;
      }
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
  if (payload.images && payload.images.length > 0) {
    payload.image_url = payload.images[0] || payload.image_url;
  }
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
    const isColumnError =
      err?.message?.includes("quantity") || err?.message?.includes("images");
    if (isColumnError) {
      const fallbackPayload = { ...payload };
      if (err?.message?.includes("quantity")) {
        delete fallbackPayload.quantity;
        delete fallbackPayload.available_quantity;
      }
      if (err?.message?.includes("images")) {
        delete fallbackPayload.images;
      }
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

  // When a reservation transitions from not confirmed to confirmed, decrement room availability
  if (status === "confirmed" && currentBooking?.status !== "confirmed") {
    try {
      await decrementRoomAvailability(
        currentBooking?.roomSlug || currentBooking?.room,
        currentBooking?.roomType,
      );
    } catch (err) {
      console.warn("Failed to decrement room availability on confirmation:", err);
    }
  }

  // When a confirmed reservation is cancelled, restore 1 unit back to room category availability
  if (status === "cancelled" && currentBooking?.status === "confirmed") {
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
