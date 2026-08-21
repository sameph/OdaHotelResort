import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect, type ChangeEvent, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import {
  Calendar,
  User,
  CreditCard,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Utensils,
  Car,
  Flower2,
  Cake,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import type { Room, RoomType, RoomView } from "@/data/rooms";
import { insertBooking, checkAvailability, fetchRooms } from "@/lib/supabase-service";
import { initializeChapaPayment, verifyChapaPayment } from "@/lib/chapa-service";
import { useQuery } from "@tanstack/react-query";
import type { BookingInsert, BookingRow } from "@/lib/supabase-types";

type BookSearch = { room?: string; ref?: string };
export const Route = createFileRoute("/book")({
  validateSearch: (search: Record<string, unknown>): BookSearch => ({
    room: typeof search.room === "string" ? search.room : undefined,
    ref: typeof search.ref === "string" ? search.ref : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Book Your Stay — ODA Resort Hotel" },
      {
        name: "description",
        content:
          "Reserve your stay at ODA Resort Hotel in Adama. Choose your dates, room, extras and complete secure payment in a few simple steps.",
      },
      { property: "og:title", content: "Book Your Stay — ODA Resort Hotel" },
      { property: "og:description", content: "Complete your reservation in a few simple steps." },
    ],
  }),
  component: BookPage,
});

type GuestInfo = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  requests: string;
};

type PaymentMethod = "chapa" | "card" | "transfer" | "onarrival";

type PaymentInfo = {
  name: string;
  card: string;
  exp: string;
  cvc: string;
  method: PaymentMethod;
};

type BookingConfirmationProps = {
  ref: string;
  guest: GuestInfo;
  room: Room;
  nights: number;
  total: number;
  checkIn: string;
  checkOut: string;
};

const steps = [
  { n: 1, label: "Dates & Room", icon: Calendar },
  { n: 2, label: "Guest Info", icon: User },
  { n: 3, label: "Extras", icon: Sparkles },
  { n: 4, label: "Payment", icon: CreditCard },
  { n: 5, label: "Confirmation", icon: Check },
] as const;

const extras = [
  {
    id: "breakfast",
    label: "Daily breakfast buffet",
    price: 650,
    icon: Utensils,
    desc: "Ethiopian & continental spread for two.",
  },
  {
    id: "airport",
    label: "Airport transfer",
    price: 1800,
    icon: Car,
    desc: "Private sedan from Addis Ababa Bole.",
  },
  {
    id: "spa",
    label: "Signature spa ritual",
    price: 2400,
    icon: Flower2,
    desc: "60-min couples massage with coffee scrub.",
  },
  {
    id: "celebration",
    label: "Celebration setup",
    price: 1200,
    icon: Cake,
    desc: "Cake, flowers & sparkling wine on arrival.",
  },
];

const currency = (n: number) => `Br ${n.toLocaleString()}`;

function todayISO(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function BookPage() {
  const search = Route.useSearch();
  const roomParam = search.room;
  const payRef = search.ref;
  const { data: dbRooms = [], isLoading: isLoadingRooms } = useQuery({ queryKey: ["rooms"], queryFn: fetchRooms });
  
  const rooms = useMemo<Room[]>(() => dbRooms.map(r => ({
    name: r.name || `Room ${r.number}`,
    slug: r.slug || r.number,
    img: r.image_url || "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/hero-resort.jpg",
    price: r.price,
    type: r.type as RoomType,
    view: r.view as RoomView,
    desc: r.description || "Elegant accommodation.",
    tags: r.amenities?.slice(0, 4) || [],
    beds: r.beds || "King size bed",
    size: r.size_sqm ? `${r.size_sqm} sqm` : "32 sqm",
    guests: r.capacity,
    popular: r.popular || false,
    amenities: r.amenities || []
  })), [dbRooms]);

  const [step, setStep] = useState(payRef ? 5 : 1);

  useEffect(() => {
    if (payRef && step === 5) {
      verifyChapaPayment({ data: { tx_ref: payRef } }).catch(() => {});
    }
  }, [payRef, step]);

  const [checkIn, setCheckIn] = useState(todayISO());
  const [checkOut, setCheckOut] = useState(todayISO(1));
  const [guests, setGuests] = useState(2);
  const [roomSlug, setRoomSlug] = useState(roomParam || "");
  const [selectedExtras, setSelectedExtras] = useState<string[]>(["breakfast"]);
  const [guest, setGuest] = useState<GuestInfo>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "Ethiopia",
    requests: "",
  });
  const [pay, setPay] = useState<PaymentInfo>({
    name: "",
    card: "",
    exp: "",
    cvc: "",
    method: "chapa",
  });
  const [confirmed, setConfirmed] = useState<string | null>(payRef || null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const { data: availableSlugs, isLoading: isAvailabilityLoading } = useQuery({
    queryKey: ["availability", checkIn, checkOut],
    queryFn: () => checkAvailability(checkIn, checkOut),
  });

  const bookingMutation = useMutation<BookingRow, Error, BookingInsert>({
    mutationFn: insertBooking,
    onError: (error) => {
      const err = error as Error;
      const msg = err.message ?? "Unable to submit booking. Please try again.";
      setBookingError(msg);
      toast.error(msg);
    },
  });

  const room = rooms.find((r) => r.slug === roomSlug) ?? rooms[0];

  const totalExtrasCount = useMemo(() => {
    // hack to safely set initial room slug once loaded, preventing crash from undefined room loading initially.
    if (rooms.length > 0 && !roomSlug) setRoomSlug(rooms[0].slug);
    return selectedExtras.length;
  }, [rooms, roomSlug, selectedExtras.length]);
  const nights = useMemo(() => {
    const a = new Date(checkIn).getTime();
    const b = new Date(checkOut).getTime();
    return Math.max(1, Math.round((b - a) / 86_400_000));
  }, [checkIn, checkOut]);

  const roomTotal = (room?.price ?? 0) * nights;
  const extrasTotal = selectedExtras.reduce(
    (s, id) => s + (extras.find((e) => e.id === id)?.price ?? 0) * nights,
    0,
  );
  const subtotal = roomTotal + extrasTotal;
  const tax = Math.round(subtotal * 0.15);
  const total = subtotal + tax;

  const toggleExtra = (id: string) =>
    setSelectedExtras((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const canNext =
    step === 1
      ? !!checkIn && !!checkOut && nights > 0 && !!room
      : step === 2
        ? guest.firstName &&
          guest.lastName &&
          /.+@.+\..+/.test(guest.email) &&
          guest.phone.length >= 6
        : step === 3
          ? true
          : step === 4
            ? pay.method !== "card" ||
              (pay.name &&
                pay.card.replace(/\s/g, "").length >= 12 &&
                pay.exp &&
                pay.cvc.length >= 3)
            : true;

  const submit = async () => {
    const ref = "ODA-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    setBookingError(null);
    try {
      await bookingMutation.mutateAsync({
        ref,
        guest: `${guest.firstName} ${guest.lastName}`,
        email: guest.email,
        phone: guest.phone,
        country: guest.country,
        requests: guest.requests,
        room: room?.name ?? "Loading",
        roomSlug: room?.slug ?? "",
        roomType: room?.type ?? "Standard",
        checkIn,
        checkOut,
        guests,
        nights,
        extras: selectedExtras,
        subtotal,
        tax,
        total,
        paymentMethod: pay.method,
        status: pay.method === "onarrival" || pay.method === "chapa" ? "pending" : "confirmed",
        source: "Direct",
      });

      if (pay.method === "chapa") {
        try {
          const res = await initializeChapaPayment({
            data: {
              amount: total.toString(),
              email: guest.email,
              first_name: guest.firstName,
              last_name: guest.lastName,
              phone_number: guest.phone,
              tx_ref: ref,
              return_url: `${window.location.origin}/book?ref=${ref}`,
              title: "ODA Resort",
              description: `Booking - ${nights} nights`,
            }
          });
          
          if (res && res.checkoutUrl) {
            window.location.href = res.checkoutUrl;
            return;
          }
        } catch (error: any) {
          const msg = error?.message || "Failed to initialize payment. Please try again.";
          setBookingError(msg);
          toast.error(msg);
          return;
        }
      }

      setConfirmed(ref);
      setStep(5);
    } catch {
      // Error is already handled by useMutation onError.
    }
  };

  if (isLoadingRooms) {
    return (
      <div className="min-h-screen bg-cream">
        <SiteHeader transparent={false} />
        <main className="pt-28 pb-24">
          <div className="container-luxury max-w-6xl">
            <div className="animate-pulse space-y-12">
              <div className="text-center space-y-4">
                <div className="h-3 bg-muted/80 rounded w-24 mx-auto" />
                <div className="h-12 bg-muted/80 rounded-lg w-72 mx-auto" />
              </div>
              <div className="h-2 bg-muted/40 rounded-full max-w-4xl mx-auto" />
              <div className="grid gap-8 lg:grid-cols-[1fr_380px] max-w-6xl mx-auto">
                <div className="h-[500px] bg-muted/50 rounded-xl" />
                <div className="h-[500px] bg-muted/50 rounded-xl" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (rooms.length === 0) return <div className="min-h-screen bg-cream pt-40 text-center">No rooms available currently.</div>;

  return (
    <div className="min-h-screen bg-cream">
      <SiteHeader transparent={false} />
      <main className="pt-28 pb-24">
        <div className="container-luxury">
          {/* Heading */}
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-[11px] uppercase tracking-[0.35em] text-gold">Reservation</span>
            <h1 className="mt-3 font-serif text-4xl md:text-6xl text-forest-deep">
              Book Your Stay
            </h1>
            <div className="mx-auto mt-4 h-px w-16 bg-gold/60" />
            <p className="mt-5 text-foreground/70">
              Complete your reservation in a few simple steps.
            </p>
          </div>

          {/* Stepper */}
          <ol
            className="mt-12 flex items-center justify-between max-w-4xl mx-auto"
            aria-label="Booking steps"
          >
            {steps.map((s, i) => {
              const active = step === s.n;
              const done = step > s.n;
              return (
                <li key={s.n} className="flex-1 flex items-center last:flex-none">
                  <div className="flex flex-col items-center gap-2 min-w-0">
                    <div
                      className={`h-11 w-11 rounded-full grid place-items-center border-2 transition-all ${
                        active
                          ? "bg-forest-deep border-forest-deep text-white shadow-luxury scale-110"
                          : done
                            ? "bg-gold border-gold text-gold-foreground"
                            : "bg-background border-border text-muted-foreground"
                      }`}
                    >
                      {done ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <span className="text-sm font-medium">{s.n}</span>
                      )}
                    </div>
                    <span
                      className={`hidden sm:block text-xs tracking-wide ${
                        active ? "text-forest-deep font-medium" : "text-muted-foreground"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`flex-1 h-px mx-2 md:mx-4 ${done ? "bg-gold" : "bg-border"}`} />
                  )}
                </li>
              );
            })}
          </ol>

          {/* Layout */}
          <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_380px]">
            {/* Main panel */}
            <section className="bg-background border border-border shadow-soft rounded-sm p-6 md:p-10">
              {step === 1 && (
                <StepDatesRoom
                  checkIn={checkIn}
                  setCheckIn={setCheckIn}
                  checkOut={checkOut}
                  setCheckOut={setCheckOut}
                  guests={guests}
                  setGuests={setGuests}
                  roomSlug={roomSlug}
                  setRoomSlug={setRoomSlug}
                  rooms={rooms}
                  availableSlugs={availableSlugs}
                  isAvailabilityLoading={isAvailabilityLoading}
                />
              )}
              {step === 2 && <StepGuest guest={guest} setGuest={setGuest} />}
              {step === 3 && <StepExtras selected={selectedExtras} toggle={toggleExtra} />}
              {step === 4 && <StepPayment pay={pay} setPay={setPay} total={total} />}
              {step === 5 && confirmed && (
                <StepConfirmation
                  ref={confirmed}
                  guest={guest}
                  room={room}
                  nights={nights}
                  total={total}
                  checkIn={checkIn}
                  checkOut={checkOut}
                />
              )}

              {/* Navigation */}
              {step < 5 && (
                <div className="mt-10 flex items-center justify-between border-t border-border pt-6">
                  <button
                    type="button"
                    onClick={() => setStep((s) => Math.max(1, s - 1))}
                    disabled={step === 1}
                    className="inline-flex items-center gap-2 text-sm text-foreground/70 hover:text-forest-deep disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" /> Back
                  </button>
                  {step < 4 ? (
                    <button
                      type="button"
                      onClick={() => canNext && setStep((s) => s + 1)}
                      disabled={!canNext}
                      className="inline-flex items-center gap-2 bg-forest-deep text-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] hover:bg-gold hover:text-gold-foreground transition-colors disabled:opacity-40"
                    >
                      Continue <ChevronRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => canNext && submit()}
                      disabled={!canNext || bookingMutation.status === "pending"}
                      className="inline-flex items-center gap-2 bg-gold text-gold-foreground px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] hover:bg-forest-deep hover:text-white transition-colors disabled:opacity-40"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      {bookingMutation.status === "pending"
                        ? "Submitting…"
                        : `Confirm & Pay ${currency(total)}`}
                    </button>
                  )}
                </div>
              )}
              {bookingError ? (
                <p className="mt-4 text-sm text-destructive">{bookingError}</p>
              ) : null}
            </section>

            {/* Summary */}
            <aside className="lg:sticky lg:top-28 h-fit bg-background border border-border shadow-soft rounded-sm overflow-hidden">
              <div className="relative">
                <img src={room.img} alt={room.name} className="w-full h-56 object-cover" />
                <span className="absolute top-4 left-4 bg-background/95 text-forest-deep text-[10px] uppercase tracking-[0.25em] px-3 py-1.5">
                  {room.type}
                </span>
              </div>
              <div className="p-6">
                <h2 className="font-serif text-xl text-forest-deep">Booking Summary</h2>
                <p className="mt-1 text-sm text-foreground/70">{room.name}</p>

                <dl className="mt-5 space-y-2 text-sm border-t border-border pt-4">
                  <Row k="Check-in" v={fmtDate(checkIn)} />
                  <Row k="Check-out" v={fmtDate(checkOut)} />
                  <Row k="Guests" v={String(guests)} />
                  <Row k="Nights" v={String(nights)} />
                </dl>

                <dl className="mt-5 space-y-2 text-sm border-t border-border pt-4">
                  <Row k={`Room (${currency(room.price)} × ${nights})`} v={currency(roomTotal)} />
                  {selectedExtras.length > 0 && (
                    <Row k={`Extras × ${nights}`} v={currency(extrasTotal)} />
                  )}
                  <Row k="Tax (15%)" v={currency(tax)} />
                </dl>

                <div className="mt-5 flex items-baseline justify-between border-t border-border pt-4">
                  <span className="font-serif text-lg text-forest-deep">Total</span>
                  <span className="font-serif text-2xl text-forest-deep">{currency(total)}</span>
                </div>

                <p className="mt-4 flex items-start gap-2 text-[11px] text-muted-foreground leading-relaxed">
                  <ShieldCheck className="h-3.5 w-3.5 text-gold mt-0.5 shrink-0" />
                  Free cancellation up to 48 hours before arrival. Secure booking.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-foreground/70">{k}</dt>
      <dd className="text-foreground">{v}</dd>
    </div>
  );
}

function fmtDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/* ---------------- Steps ---------------- */

function StepDatesRoom({
  checkIn,
  setCheckIn,
  checkOut,
  setCheckOut,
  guests,
  setGuests,
  roomSlug,
  setRoomSlug,
  rooms,
  availableSlugs,
  isAvailabilityLoading,
}: {
  checkIn: string;
  setCheckIn: (v: string) => void;
  checkOut: string;
  setCheckOut: (v: string) => void;
  guests: number;
  setGuests: (v: number) => void;
  roomSlug: string;
  setRoomSlug: (v: string) => void;
  rooms: Room[];
  availableSlugs: string[] | undefined;
  isAvailabilityLoading: boolean;
}) {
  return (
    <div>
      <h2 className="font-serif text-2xl text-forest-deep">Select Dates & Room</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <FieldLabel label="Check-in" icon={Calendar}>
          <input
            type="date"
            value={checkIn}
            min={todayISO()}
            onChange={(e) => setCheckIn(e.target.value)}
            className="input-field"
          />
        </FieldLabel>
        <FieldLabel label="Check-out" icon={Calendar}>
          <input
            type="date"
            value={checkOut}
            min={checkIn || todayISO(1)}
            onChange={(e) => setCheckOut(e.target.value)}
            className="input-field"
          />
        </FieldLabel>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <FieldLabel label="Number of Guests" icon={User}>
          <select
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="input-field"
          >
            {[1, 2, 3, 4, 5, 6].map((g) => (
              <option key={g} value={g}>
                {g} Guest{g > 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </FieldLabel>
      </div>

      <h3 className="mt-8 text-sm uppercase tracking-[0.2em] text-forest-deep">Select Room</h3>
      <div className="mt-4 space-y-3">
        {isAvailabilityLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3 border border-border animate-pulse bg-white">
              <div className="h-20 w-24 bg-muted shrink-0 rounded" />
              <div className="flex-1 space-y-4">
                <div className="flex items-baseline justify-between">
                  <div className="h-5 bg-muted rounded-md w-1/3" />
                  <div className="h-5 bg-muted rounded-md w-1/4" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-4 bg-muted rounded w-1/6" />
                </div>
              </div>
            </div>
          ))
        ) : (
          rooms
            .filter((r) => r.guests >= guests && (!availableSlugs || availableSlugs.includes(r.slug)))
            .map((r) => {
            const active = r.slug === roomSlug;
            return (
              <button
                key={r.slug}
                type="button"
                onClick={() => setRoomSlug(r.slug)}
                className={`w-full text-left flex items-center gap-4 p-3 border transition-all ${
                  active
                    ? "border-forest-deep bg-forest-deep/5 ring-1 ring-forest-deep/30"
                    : "border-border hover:border-forest-deep/50"
                }`}
              >
                <img src={r.img} alt="" className="h-20 w-24 object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="font-serif text-lg text-forest-deep">{r.name}</span>
                    <span className="font-serif text-lg text-forest-deep">{currency(r.price)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground mt-1">
                    <span>
                      {r.beds} • {r.size} • {r.guests} guests
                    </span>
                    <span>/night</span>
                  </div>
                </div>
              </button>
            );
          })
        )}
        {(!isAvailabilityLoading && rooms.filter((r) => r.guests >= guests && (!availableSlugs || availableSlugs.includes(r.slug))).length === 0) && (
          <div className="py-8 text-center border border-border text-sm text-muted-foreground bg-white">
            No rooms available for the selected dates and guest count. Try adjusting your search.
          </div>
        )}
      </div>
    </div>
  );
}

function StepGuest({
  guest,
  setGuest,
}: {
  guest: GuestInfo;
  setGuest: Dispatch<SetStateAction<GuestInfo>>;
}) {
  const upd =
    (k: keyof GuestInfo) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setGuest({ ...guest, [k]: e.target.value });
  return (
    <div>
      <h2 className="font-serif text-2xl text-forest-deep">Guest Information</h2>
      <p className="mt-1 text-sm text-foreground/60">The primary guest for the reservation.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <FieldLabel label="First name">
          <input
            className="input-field"
            value={guest.firstName}
            onChange={upd("firstName")}
            required
          />
        </FieldLabel>
        <FieldLabel label="Last name">
          <input
            className="input-field"
            value={guest.lastName}
            onChange={upd("lastName")}
            required
          />
        </FieldLabel>
        <FieldLabel label="Email">
          <input
            type="email"
            className="input-field"
            value={guest.email}
            onChange={upd("email")}
            required
          />
        </FieldLabel>
        <FieldLabel label="Phone">
          <input
            type="tel"
            className="input-field"
            value={guest.phone}
            onChange={upd("phone")}
            required
          />
        </FieldLabel>
        <FieldLabel label="Country">
          <select className="input-field" value={guest.country} onChange={upd("country")}>
            {[
              "Ethiopia",
              "Kenya",
              "United States",
              "United Kingdom",
              "Germany",
              "France",
              "United Arab Emirates",
              "Other",
            ].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </FieldLabel>
      </div>
      <FieldLabel label="Special requests (optional)" className="mt-4 block">
        <textarea
          rows={4}
          className="input-field"
          value={guest.requests}
          onChange={upd("requests")}
          placeholder="Late arrival, dietary needs, celebration…"
        />
      </FieldLabel>
    </div>
  );
}

function StepExtras({ selected, toggle }: { selected: string[]; toggle: (id: string) => void }) {
  return (
    <div>
      <h2 className="font-serif text-2xl text-forest-deep">Enhance Your Stay</h2>
      <p className="mt-1 text-sm text-foreground/60">Add curated extras — charged per night.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {extras.map((e) => {
          const active = selected.includes(e.id);
          const Icon = e.icon;
          return (
            <button
              key={e.id}
              type="button"
              onClick={() => toggle(e.id)}
              className={`text-left p-5 border transition-all ${
                active
                  ? "border-gold bg-gold/5 ring-1 ring-gold/40"
                  : "border-border hover:border-forest-deep/40"
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`h-10 w-10 grid place-items-center rounded-full ${active ? "bg-gold text-gold-foreground" : "bg-forest-deep/5 text-forest-deep"}`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-serif text-lg text-forest-deep">{e.label}</span>
                    <span className="text-sm text-forest-deep font-medium">
                      +{currency(e.price)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{e.desc}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepPayment({
  pay,
  setPay,
  total,
}: {
  pay: PaymentInfo;
  setPay: Dispatch<SetStateAction<PaymentInfo>>;
  total: number;
}) {
  const upd = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setPay({ ...pay, [k]: e.target.value });
  return (
    <div>
      <h2 className="font-serif text-2xl text-forest-deep">Payment</h2>
      <p className="mt-1 text-sm text-foreground/60">
        Secure your reservation. Amount due:{" "}
        <strong className="text-forest-deep">{currency(total)}</strong>
      </p>

      <div className="mt-6 grid gap-4 grid-cols-1 sm:grid-cols-4">
        {[
          { id: "chapa" as const, label: "Pay Online \n(Chapa)", icon: CreditCard },
          { id: "card" as const, label: "Credit / Debit Card", icon: CreditCard },
          { id: "transfer" as const, label: "Bank Transfer", icon: Sparkles },
          { id: "onarrival" as const, label: "Pay on Arrival", icon: Calendar },
        ].map((m) => {
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setPay({ ...pay, method: m.id })}
              className={`p-5 flex flex-col items-center justify-center text-center gap-3 border transition-all rounded-sm ${
                pay.method === m.id
                  ? "border-forest-deep bg-forest-deep/5 ring-1 ring-forest-deep/30 text-forest-deep font-medium shadow-sm"
                  : "border-border text-foreground/70 hover:border-forest-deep/40 hover:bg-forest-deep/5"
              }`}
            >
              <Icon className="h-6 w-6 mb-1 opacity-80" />
              <span className="whitespace-pre-line text-sm">{m.label}</span>
            </button>
          );
        })}
      </div>

      {pay.method === "chapa" && (
        <div className="mt-8 p-6 border border-border bg-forest-deep/5 text-sm rounded-sm">
          <div className="flex items-start gap-4">
            <div className="bg-white p-2 rounded shadow-sm shrink-0 mt-1">
              <img src="https://chapa.link/asset/images/chapa_swirl.svg" alt="Chapa Logo" className="h-8 w-8 object-contain" />
            </div>
            <div className="text-foreground/80 leading-relaxed">
              <p className="mb-2 text-forest-deep text-lg font-serif">Secure online payment by Chapa</p>
              <p>When you click "Confirm & Pay", you will be redirected to Chapa's secure checkout. You can complete your payment using international Credit/Debit cards, Telebirr, CBE Birr, or Awash Birr.</p>
            </div>
          </div>
        </div>
      )}

      {pay.method === "card" && (
        <div className="mt-6 grid gap-4">
          <FieldLabel label="Name on card">
            <input className="input-field" value={pay.name} onChange={upd("name")} />
          </FieldLabel>
          <FieldLabel label="Card number">
            <input
              className="input-field"
              placeholder="1234 5678 9012 3456"
              value={pay.card}
              onChange={upd("card")}
            />
          </FieldLabel>
          <div className="grid gap-4 grid-cols-2">
            <FieldLabel label="Expiry">
              <input
                className="input-field"
                placeholder="MM/YY"
                value={pay.exp}
                onChange={upd("exp")}
              />
            </FieldLabel>
            <FieldLabel label="CVC">
              <input
                className="input-field"
                placeholder="123"
                value={pay.cvc}
                onChange={upd("cvc")}
              />
            </FieldLabel>
          </div>
        </div>
      )}
      {pay.method === "transfer" && (
        <div className="mt-6 p-5 border border-border bg-cream/60 text-sm text-foreground/80 leading-relaxed">
          Transfer to <strong>ODA Resort Hotel</strong> · Commercial Bank of Ethiopia · Acc{" "}
          <strong>1000 234 567 890</strong>. Send receipt to contactmanager@odaresortandhotel.com —
          your booking is held for 24 hours pending payment.
        </div>
      )}
      {pay.method === "onarrival" && (
        <div className="mt-6 p-5 border border-border bg-cream/60 text-sm text-foreground/80 leading-relaxed">
          A valid credit card will be required at check-in as a guarantee. Cancellation policy
          applies.
        </div>
      )}
    </div>
  );
}

function StepConfirmation({
  ref,
  guest,
  room,
  nights,
  total,
  checkIn,
  checkOut,
}: BookingConfirmationProps) {
  return (
    <div className="text-center py-6">
      <div className="mx-auto h-16 w-16 rounded-full bg-forest-deep grid place-items-center text-white shadow-luxury animate-fade-down">
        <Check className="h-8 w-8" />
      </div>
      <h2 className="mt-6 font-serif text-3xl text-forest-deep">Reservation Confirmed</h2>
      <p className="mt-2 text-foreground/70">
        Thank you{guest.firstName ? `, ${guest.firstName}` : ""}. A confirmation has been sent to{" "}
        {guest.email || "your email"}.
      </p>

      <div className="mt-8 max-w-md mx-auto text-left border border-border p-6 bg-cream/50">
        <div className="flex items-baseline justify-between">
          <span className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
            Confirmation
          </span>
          <span className="font-mono text-forest-deep">{ref}</span>
        </div>
        <div className="mt-4 space-y-2 text-sm">
          <Row k="Room" v={room.name} />
          <Row k="Check-in" v={fmtDate(checkIn)} />
          <Row k="Check-out" v={fmtDate(checkOut)} />
          <Row k="Nights" v={String(nights)} />
          <Row k="Total paid" v={currency(total)} />
        </div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center bg-forest-deep text-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] hover:bg-gold hover:text-gold-foreground transition-colors"
        >
          Return home
        </Link>
        <Link
          to="/rooms"
          className="inline-flex items-center border border-forest-deep text-forest-deep px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] hover:bg-forest-deep hover:text-white transition-colors"
        >
          Explore more rooms
        </Link>
      </div>
    </div>
  );
}

function FieldLabel({
  label,
  icon: Icon,
  children,
  className = "",
}: {
  label: string;
  icon?: any;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-foreground/70 mb-2">
        {Icon && <Icon className="h-3.5 w-3.5 text-gold" />}
        {label}
      </span>
      {children}
    </label>
  );
}
