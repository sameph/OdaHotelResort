import { createFileRoute, Link } from "@tanstack/react-router";
import {
  useMemo,
  useState,
  useEffect,
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
} from "react";
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
  Building2,
  Clock,
  Zap,
  Lock,
  Smartphone,
  Wallet,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import type { Room, RoomType, RoomView } from "@/data/rooms";
import { insertBooking, checkAvailability, fetchRooms } from "@/lib/supabase-service";
import { initializeChapaPayment, verifyChapaPayment } from "@/lib/chapa-service.server";
import { useQuery } from "@tanstack/react-query";
import type { BookingInsert, BookingRow } from "@/lib/supabase-types";

type BookSearch = {
  room?: string;
  ref?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
};
export const Route = createFileRoute("/book")({
  validateSearch: (search: Record<string, unknown>): BookSearch => ({
    room: typeof search.room === "string" ? search.room : undefined,
    ref: typeof search.ref === "string" ? search.ref : undefined,
    checkIn: typeof search.checkIn === "string" ? search.checkIn : undefined,
    checkOut: typeof search.checkOut === "string" ? search.checkOut : undefined,
    guests:
      typeof search.guests === "number" && Number.isInteger(search.guests)
        ? search.guests
        : undefined,
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
  const { data: dbRooms = [], isLoading: isLoadingRooms } = useQuery({
    queryKey: ["rooms"],
    queryFn: fetchRooms,
  });

  const rooms = useMemo<Room[]>(
    () =>
      dbRooms.map((r) => ({
        name: r.name || `Room ${r.number}`,
        slug: r.slug || r.number,
        img:
          r.image_url ||
          "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/hero-resort.jpg",
        price: r.price,
        type: r.type as RoomType,
        view: r.view as RoomView,
        desc: r.description || "Elegant accommodation.",
        tags: r.amenities?.slice(0, 4) || [],
        beds: r.beds || "King size bed",
        size: r.size_sqm ? `${r.size_sqm} sqm` : "32 sqm",
        guests: r.capacity,
        popular: r.popular || false,
        amenities: r.amenities || [],
      })),
    [dbRooms],
  );

  const [step, setStep] = useState(payRef ? 5 : 1);

  useEffect(() => {
    if (payRef && step === 5) {
      verifyChapaPayment({ data: { tx_ref: payRef } }).catch(() => {});
    }
  }, [payRef, step]);

  const [checkIn, setCheckIn] = useState(search.checkIn || todayISO());
  const [checkOut, setCheckOut] = useState(search.checkOut || todayISO(1));
  const [guests, setGuests] = useState(search.guests || 2);
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

  useEffect(() => {
    if (rooms.length > 0 && !rooms.some((item) => item.slug === roomSlug)) {
      setRoomSlug(rooms[0].slug);
    }
  }, [rooms, roomSlug]);
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
  const tax = 0; // Included in price
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
              email: guest.email,
              first_name: guest.firstName,
              last_name: guest.lastName,
              phone_number: guest.phone,
              tx_ref: ref,
              return_url: `${window.location.origin}/book?ref=${ref}`,
              title: "ODA Resort",
              description: `${room?.name ?? "Room"} — ${nights} night${nights === 1 ? "" : "s"}`,
            },
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
      } else {
        fetch("/api/bookings/send-confirmation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: guest.email,
            guest: `${guest.firstName} ${guest.lastName}`,
            txRef: ref,
            amount: total,
            checkIn,
            checkOut,
            roomName: room?.name,
          }),
        }).catch((err) => console.error("Failed to trigger confirmation email", err));
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

  if (rooms.length === 0)
    return (
      <div className="min-h-screen bg-cream pt-40 text-center">No rooms available currently.</div>
    );

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
                <StepReceipt
                  ref={confirmed}
                  guest={guest}
                  room={room!}
                  nights={nights}
                  total={total}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  onClose={() => setStep(6)}
                />
              )}
              {step === 6 && confirmed && <StepCompletion guest={guest} />}

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
        {isAvailabilityLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-3 border border-border animate-pulse bg-white"
              >
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
          : rooms
              .filter(
                (r) => r.guests >= guests && (!availableSlugs || availableSlugs.includes(r.slug)),
              )
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
                        <span className="font-serif text-lg text-forest-deep">
                          {currency(r.price)}
                        </span>
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
              })}
        {!isAvailabilityLoading &&
          rooms.filter(
            (r) => r.guests >= guests && (!availableSlugs || availableSlugs.includes(r.slug)),
          ).length === 0 && (
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

  const formatCardNumber = (value: string) => {
    return value
      .replace(/\s+/g, "")
      .replace(/[^\d]/g, "")
      .replace(/(\d{4})/g, "$1 ")
      .trim()
      .slice(0, 19);
  };

  const paymentMethods = [
    {
      id: "chapa" as const,
      label: "Pay Online",
      description: "Chapa Secure Checkout",
      icon: Smartphone,
      badge: "Most Popular",
      benefits: ["Instant confirmation", "Multiple payment methods"],
      gradient: "from-blue-500 to-cyan-500",
      bgLight: "from-blue-50 to-cyan-50",
    },
    {
      id: "card" as const,
      label: "Credit/Debit Card",
      description: "Direct payment",
      icon: CreditCard,
      badge: "Standard",
      benefits: ["Secure storage", "Quick checkout"],
      gradient: "from-emerald-500 to-teal-500",
      bgLight: "from-emerald-50 to-teal-50",
    },
    {
      id: "transfer" as const,
      label: "Bank Transfer",
      description: "Direct to our account",
      icon: Building2,
      badge: "Enterprise",
      benefits: ["Maximum security", "24-hour hold"],
      gradient: "from-amber-500 to-orange-500",
      bgLight: "from-amber-50 to-orange-50",
    },
    {
      id: "onarrival" as const,
      label: "Pay on Arrival",
      description: "Bill at check-in",
      icon: Clock,
      badge: "Flexible",
      benefits: ["No prepayment", "Card guarantee"],
      gradient: "from-purple-500 to-pink-500",
      bgLight: "from-purple-50 to-pink-50",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="font-serif text-3xl text-forest-deep">Payment Method</h2>
        <p className="mt-2 text-sm text-foreground/60">
          Choose how you'd like to pay. Total amount due:{" "}
          <span className="text-lg font-semibold text-forest-deep">{currency(total)}</span>
        </p>
      </div>

      {/* Payment Method Cards Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {paymentMethods.map((method) => {
          const Icon = method.icon;
          const isSelected = pay.method === method.id;

          return (
            <button
              key={method.id}
              onClick={() => setPay({ ...pay, method: method.id })}
              className={`group relative h-full p-5 rounded-xl border-2 transition-all duration-300 overflow-hidden ${
                isSelected
                  ? `border-forest-deep bg-linear-to-br ${method.bgLight} shadow-lg ring-2 ring-forest-deep/20`
                  : "border-border/60 bg-white hover:border-forest-deep/40 hover:shadow-md hover:bg-linear-to-br hover:" +
                    method.bgLight
              }`}
            >
              {/* Decorative gradient background */}
              <div
                className={`absolute inset-0 opacity-0 ${
                  isSelected ? "opacity-10" : "group-hover:opacity-5"
                } bg-linear-to-br pointer-events-none transition-opacity ${method.gradient}`}
              />

              <div className="relative flex flex-col h-full">
                {/* Check mark indicator */}
                {isSelected && (
                  <div className="absolute -top-2 -right-2 bg-forest-deep rounded-full p-1.5 shadow-md">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}

                {/* Badge */}
                <div className="mb-3 flex items-center justify-between">
                  <span className="inline-block px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-forest-deep bg-white/80 rounded-full">
                    {method.badge}
                  </span>
                </div>

                {/* Icon */}
                <div
                  className={`mb-3 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-linear-to-br ${method.gradient} p-2 transition-transform ${
                    isSelected ? "scale-110 shadow-lg" : "group-hover:scale-105"
                  }`}
                >
                  <Icon className="h-6 w-6 text-white" />
                </div>

                {/* Labels */}
                <h3 className="font-semibold text-sm text-forest-deep text-left">{method.label}</h3>
                <p className="text-xs text-foreground/60 text-left mt-1 mb-4">{method.description}</p>

                {/* Benefits */}
                <div className="mt-auto space-y-1.5">
                  {method.benefits.map((benefit, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-forest-deep/60 shrink-0 mt-0.5" />
                      <span className="text-xs text-foreground/70">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4 pt-2">
        <div className="flex-1 h-px bg-border/60" />
        <span className="text-xs text-foreground/50 uppercase tracking-widest font-medium">
          Payment Details
        </span>
        <div className="flex-1 h-px bg-border/60" />
      </div>

      {/* Chapa Payment Info */}
      {pay.method === "chapa" && (
        <div className="group relative overflow-hidden rounded-xl border border-blue-200 bg-linear-to-br from-blue-50/80 to-cyan-50/80 backdrop-blur-sm">
          <div className="absolute inset-0 bg-linear-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Chapa Logo */}
              <div className="shrink-0">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-lg bg-white shadow-md border border-blue-100">
                  <img
                    src="https://chapa.link/asset/images/chapa_swirl.svg"
                    alt="Chapa Logo"
                    className="h-8 w-8 object-contain"
                  />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 space-y-3">
                <h3 className="text-lg font-serif text-forest-deep font-bold">
                  Secure Online Payment via Chapa
                </h3>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  You'll be redirected to Chapa's secure checkout where you can pay using multiple
                  methods: international credit/debit cards (Visa, Mastercard), Telebirr, CBE Birr,
                  or Awash Birr.
                </p>

                {/* Security Features */}
                <div className="flex flex-wrap gap-3 pt-2">
                  <div className="flex items-center gap-2 text-xs text-forest-deep font-medium">
                    <Lock className="h-4 w-4 text-green-600" />
                    <span>Encrypted & Secure</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-forest-deep font-medium">
                    <Zap className="h-4 w-4 text-blue-600" />
                    <span>Instant Confirmation</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-forest-deep font-medium">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>PCI Compliant</span>
                  </div>
                </div>
              </div>

              {/* Arrow indicator */}
              <div className="hidden sm:flex items-center gap-2 text-forest-deep/60 shrink-0">
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Card Payment Info */}
      {pay.method === "card" && (
        <div className="space-y-5 rounded-xl border border-emerald-200 bg-linear-to-br from-emerald-50/50 to-teal-50/50 p-6">
          {/* Card Preview */}
          <div className="relative h-32 rounded-lg bg-linear-to-br from-emerald-500 to-teal-600 shadow-lg overflow-hidden group">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_1px_1px,#fff_1px,transparent_1px)] bg-size-[20px_20px]" />
            <div className="relative p-5 h-full flex flex-col justify-between text-white">
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold opacity-80 uppercase tracking-widest">
                  Card Number
                </span>
                <span className="text-sm font-semibold">●●●●</span>
              </div>
              <div>
                <div className="text-lg font-mono font-bold tracking-widest mb-3">
                  {pay.card || "•••• •••• •••• ••••"}
                </div>
                <div className="flex justify-between text-xs">
                  <span>{pay.name || "CARD HOLDER NAME"}</span>
                  <span>{pay.exp || "MM/YY"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid gap-4">
            <FieldLabel label="Name on Card">
              <input
                className="input-field bg-white border-emerald-200/60 focus:border-emerald-400"
                placeholder="John Smith"
                value={pay.name}
                onChange={upd("name")}
              />
            </FieldLabel>

            <FieldLabel label="Card Number">
              <input
                className="input-field bg-white border-emerald-200/60 focus:border-emerald-400 font-mono"
                placeholder="1234 5678 9012 3456"
                maxLength={23}
                value={pay.card}
                onChange={(e) => setPay({ ...pay, card: formatCardNumber(e.target.value) })}
              />
            </FieldLabel>

            <div className="grid gap-4 grid-cols-2">
              <FieldLabel label="Expiry (MM/YY)">
                <input
                  className="input-field bg-white border-emerald-200/60 focus:border-emerald-400"
                  placeholder="12/25"
                  maxLength={5}
                  value={pay.exp}
                  onChange={upd("exp")}
                />
              </FieldLabel>
              <FieldLabel label="CVC">
                <input
                  className="input-field bg-white border-emerald-200/60 focus:border-emerald-400 font-mono"
                  placeholder="123"
                  maxLength={4}
                  value={pay.cvc}
                  onChange={upd("cvc")}
                />
              </FieldLabel>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-foreground/60 pt-2">
            <Lock className="h-4 w-4 text-emerald-600" />
            <span>Your card details are encrypted and secure</span>
          </div>
        </div>
      )}

      {/* Bank Transfer Info */}
      {pay.method === "transfer" && (
        <div className="group relative overflow-hidden rounded-xl border border-amber-200 bg-linear-to-br from-amber-50/80 to-orange-50/80 backdrop-blur-sm">
          <div className="absolute inset-0 bg-linear-to-br from-amber-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-lg bg-white shadow-md border border-amber-100 shrink-0">
                <Building2 className="h-7 w-7 text-amber-600" />
              </div>

              <div className="flex-1 space-y-4">
                <h3 className="text-lg font-serif text-forest-deep font-bold">Bank Transfer Details</h3>

                <div className="space-y-3">
                  <div className="bg-white/60 rounded-lg p-4 border border-amber-100">
                    <p className="text-xs text-foreground/60 uppercase tracking-widest font-semibold mb-1">
                      Bank Name
                    </p>
                    <p className="text-lg font-semibold text-forest-deep">Commercial Bank of Ethiopia</p>
                  </div>

                  <div className="bg-white/60 rounded-lg p-4 border border-amber-100">
                    <p className="text-xs text-foreground/60 uppercase tracking-widest font-semibold mb-1">
                      Account Holder
                    </p>
                    <p className="text-lg font-semibold text-forest-deep">ODA Resort Hotel</p>
                  </div>

                  <div className="bg-white/60 rounded-lg p-4 border border-amber-100">
                    <p className="text-xs text-foreground/60 uppercase tracking-widest font-semibold mb-1">
                      Account Number
                    </p>
                    <p className="text-lg font-mono font-bold text-forest-deep tracking-wider">
                      1000 234 567 890
                    </p>
                  </div>
                </div>

                <div className="pt-2 space-y-2 text-sm text-foreground/80">
                  <p className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>Send receipt to: <strong>contactmanager@odaresortandhotel.com</strong></span>
                  </p>
                  <p className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>Your booking is held for <strong>24 hours</strong> pending payment</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pay on Arrival Info */}
      {pay.method === "onarrival" && (
        <div className="group relative overflow-hidden rounded-xl border border-purple-200 bg-linear-to-br from-purple-50/80 to-pink-50/80 backdrop-blur-sm">
          <div className="absolute inset-0 bg-linear-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-lg bg-white shadow-md border border-purple-100 shrink-0">
                <Clock className="h-7 w-7 text-purple-600" />
              </div>

              <div className="flex-1 space-y-4">
                <h3 className="text-lg font-serif text-forest-deep font-bold">Pay Upon Arrival</h3>

                <div className="space-y-3 text-sm text-foreground/80">
                  <p className="flex items-start gap-3">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-purple-200 text-purple-700 font-semibold text-xs shrink-0">
                      1
                    </span>
                    <span>
                      A valid <strong>credit or debit card</strong> will be required at check-in as
                      a guarantee for your reservation.
                    </span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-purple-200 text-purple-700 font-semibold text-xs shrink-0">
                      2
                    </span>
                    <span>
                      You can settle your bill using cash, card, or bank transfer at the time of
                      check-out.
                    </span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-purple-200 text-purple-700 font-semibold text-xs shrink-0">
                      3
                    </span>
                    <span>
                      Standard <strong>cancellation and no-show policies</strong> apply to this
                      reservation.
                    </span>
                  </p>
                </div>

                <div className="bg-linear-to-r from-purple-100 to-pink-100 rounded-lg p-4 border border-purple-200/60">
                  <p className="text-xs text-purple-900 font-semibold">
                    💡 Tip: Paying now guarantees your rate and saves time at check-in.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StepReceipt({
  ref,
  guest,
  room,
  nights,
  total,
  checkIn,
  checkOut,
  onClose,
}: BookingConfirmationProps & { onClose: () => void }) {
  return (
    <div className="space-y-8">
      {/* Success Header */}
      <div className="text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 grid place-items-center text-emerald-600 shadow-md mb-6 animate-fade-in">
          <Check className="h-8 w-8" />
        </div>
        <h2 className="font-serif text-3xl md:text-4xl text-forest-deep">Payment Confirmed</h2>
        <p className="mt-3 text-foreground/70 max-w-2xl mx-auto">
          Your reservation has been confirmed! A confirmation email has been sent to{" "}
          <strong>{guest.email}</strong>.
        </p>
      </div>

      {/* Receipt Card */}
      <div className="max-w-2xl mx-auto">
        <div className="border border-emerald-200 bg-linear-to-br from-emerald-50/50 to-teal-50/50 rounded-xl p-6 md:p-8">
          {/* Header */}
          <div className="mb-6 pb-6 border-b border-emerald-200">
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-1">
              Reservation Reference
            </p>
            <p className="text-2xl font-bold text-forest-deep font-mono tracking-wider">
              {ref}
            </p>
          </div>

          {/* Booking Details Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Guest & Room Info */}
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1 font-semibold">
                  Guest Name
                </p>
                <p className="text-lg text-forest-deep font-semibold">
                  {guest.firstName} {guest.lastName}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1 font-semibold">
                  Room
                </p>
                <p className="text-lg text-forest-deep font-semibold">{room.name}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1 font-semibold">
                  Contact
                </p>
                <p className="text-sm text-forest-deep">{guest.email}</p>
                <p className="text-sm text-forest-deep">{guest.phone}</p>
              </div>
            </div>

            {/* Dates & Amount */}
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1 font-semibold">
                  Check-in
                </p>
                <p className="text-lg text-forest-deep font-semibold">{fmtDate(checkIn)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1 font-semibold">
                  Check-out
                </p>
                <p className="text-lg text-forest-deep font-semibold">{fmtDate(checkOut)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1 font-semibold">
                  Duration
                </p>
                <p className="text-lg text-forest-deep font-semibold">
                  {nights} night{nights !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="my-6 border-t border-emerald-200" />

          {/* Total Amount */}
          <div className="flex items-baseline justify-between mb-6">
            <span className="text-sm uppercase tracking-widest text-muted-foreground font-semibold">
              Total Amount Paid
            </span>
            <span className="font-serif text-3xl text-forest-deep font-bold">
              {currency(total)}
            </span>
          </div>

          {/* Info Box */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-2">
            <p className="flex items-start gap-2 text-sm text-forest-deep">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Booking Confirmed:</strong> Your reservation is secure and confirmed.
              </span>
            </p>
            <p className="flex items-start gap-2 text-sm text-forest-deep">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Confirmation Email:</strong> Check your inbox for booking details and
                cancellation policy.
              </span>
            </p>
            <p className="flex items-start gap-2 text-sm text-forest-deep">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Early Check-in:</strong> Contact us if you need early arrival arrangements.
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-2xl mx-auto w-full">
        <button
          onClick={onClose}
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-forest-deep text-white px-8 py-3 text-xs font-semibold uppercase tracking-[0.2em] hover:bg-gold hover:text-gold-foreground transition-colors rounded-md shadow-md hover:shadow-lg"
        >
          <Check className="h-4 w-4" />
          Proceed
        </button>
        <Link
          to="/"
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 border-2 border-forest-deep text-forest-deep px-8 py-3 text-xs font-semibold uppercase tracking-[0.2em] hover:bg-forest-deep hover:text-white transition-colors rounded-md"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}

function StepCompletion({ guest }: { guest: GuestInfo }) {
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
