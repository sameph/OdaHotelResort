import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, BedDouble, Maximize, Users, SlidersHorizontal, X } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import { useQuery } from "@tanstack/react-query";
import { fetchRooms } from "@/lib/supabase-service";
import type { Room, RoomType, RoomView, RoomAmenity } from "@/data/rooms";
import { useLang } from "@/lib/i18n";
const heroImg = "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/hero-resort.jpg";

export const Route = createFileRoute("/rooms")({
  head: () => ({
    meta: [
      { title: "Rooms & Suites — ODA Resort Hotel" },
      { name: "description", content: "Discover elegantly appointed rooms, suites and villas at ODA Resort Hotel in Adama, Ethiopia. Filter by type, view, capacity and amenities." },
      { property: "og:title", content: "Rooms & Suites — ODA Resort Hotel" },
      { property: "og:description", content: "Six distinct rooms and suites, each inspired by Ethiopian hospitality." },
      { property: "og:url", content: "/rooms" },
    ],
    links: [{ rel: "canonical", href: "/rooms" }],
  }),
  component: RoomsPage,
});

const ROOM_TYPES: RoomType[] = ["Suite", "Deluxe", "Villa"];
const ROOM_VIEWS: RoomView[] = ["Rift Valley View", "Garden View", "Pool View"];
const AMENITIES: RoomAmenity[] = [
  "King-size bed", "Queen-size bed", "Twin beds", "Private balcony",
  "Soaking tub", "Mini bar", "Free WiFi", "Butler service",
];
const CAPACITIES = [1, 2, 3, 5] as const;

const PRICE_MIN = 5000;
const PRICE_MAX = 20000;

function formatBirr(n: number) {
  return "Br " + n.toLocaleString("en-US");
}

function RoomsPage() {
  const { t } = useLang();
  const [priceMax, setPriceMax] = useState<number>(PRICE_MAX);
  const [types, setTypes] = useState<Set<RoomType>>(new Set());
  const [views, setViews] = useState<Set<RoomView>>(new Set());
  const [capacity, setCapacity] = useState<number>(1);
  const [amenities, setAmenities] = useState<Set<RoomAmenity>>(new Set());
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: dbRooms = [] } = useQuery({ queryKey: ["rooms"], queryFn: fetchRooms });

  const rooms = useMemo<Room[]>(() => dbRooms.map(r => ({
    name: r.name || `Room ${r.number}`,
    slug: r.slug || r.number,
    img: r.image_url || heroImg,
    price: r.price,
    type: r.type as RoomType,
    view: r.view as RoomView,
    desc: r.description || "Elegant and spacious accommodation.",
    tags: r.amenities?.slice(0, 4) || [],
    beds: r.beds || "King size bed",
    size: r.size_sqm ? `${r.size_sqm} sqm` : "32 sqm",
    guests: r.capacity,
    popular: r.popular || false,
    amenities: r.amenities || []
  })), [dbRooms]);

  const filtered = useMemo<Room[]>(() => {
    return rooms.filter((r) => {
      if (r.price > priceMax) return false;
      if (types.size && !types.has(r.type)) return false;
      if (views.size && !views.has(r.view)) return false;
      if (r.guests < capacity) return false;
      if (amenities.size) {
        for (const a of amenities) if (!r.amenities.includes(a)) return false;
      }
      return true;
    });
  }, [priceMax, types, views, capacity, amenities, rooms]);

  const toggle = <T,>(set: Set<T>, val: T, upd: (s: Set<T>) => void) => {
    const next = new Set(set);
    if (next.has(val)) next.delete(val);
    else next.add(val);
    upd(next);
  };

  const clearAll = () => {
    setPriceMax(PRICE_MAX);
    setTypes(new Set());
    setViews(new Set());
    setCapacity(1);
    setAmenities(new Set());
  };

  const Filters = (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-forest-deep">
          <SlidersHorizontal className="h-4 w-4 text-gold" /> Filters
        </h3>
        <button onClick={clearAll} className="text-xs text-gold hover:underline">
          Clear all
        </button>
      </div>

      <div>
        <label className="text-sm font-medium text-forest-deep">Price Range (per night)</label>
        <input
          type="range"
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={500}
          value={priceMax}
          onChange={(e) => setPriceMax(Number(e.target.value))}
          className="mt-3 w-full accent-forest-deep"
          aria-label="Maximum price per night"
        />
        <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
          <span>{formatBirr(PRICE_MIN)}</span>
          <span>{formatBirr(priceMax)}</span>
        </div>
      </div>

      <FilterGroup label="Room Type">
        {ROOM_TYPES.map((t) => (
          <Checkbox
            key={t}
            label={t}
            checked={types.has(t)}
            onChange={() => toggle(types, t, setTypes)}
          />
        ))}
      </FilterGroup>

      <FilterGroup label="View">
        {ROOM_VIEWS.map((v) => (
          <Checkbox
            key={v}
            label={v}
            checked={views.has(v)}
            onChange={() => toggle(views, v, setViews)}
          />
        ))}
      </FilterGroup>

      <div>
        <div className="text-sm font-medium text-forest-deep">Min. Capacity</div>
        <div className="mt-3 flex gap-2">
          {CAPACITIES.map((n) => {
            const active = capacity === n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => setCapacity(n)}
                className={`h-9 min-w-11 px-3 text-sm border transition-colors ${
                  active
                    ? "bg-forest-deep text-white border-forest-deep"
                    : "bg-background text-foreground border-border hover:border-forest"
                }`}
              >
                {n}+
              </button>
            );
          })}
        </div>
      </div>

      <FilterGroup label="Amenities">
        {AMENITIES.map((a) => (
          <Checkbox
            key={a}
            label={a}
            checked={amenities.has(a)}
            onChange={() => toggle(amenities, a, setAmenities)}
          />
        ))}
      </FilterGroup>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main id="main">
        <PageHero
          eyebrow={t("page.rooms.eyebrow")}
          title={t("page.rooms.title")}
          subtitle={t("page.rooms.subtitle")}
          image={heroImg}
        />

        <section className="py-16 md:py-24 bg-cream">
          <div className="container-luxury">
            <div className="flex items-center justify-between mb-8 lg:hidden">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="inline-flex items-center gap-2 bg-forest-deep text-white px-5 py-2.5 text-sm"
              >
                <SlidersHorizontal className="h-4 w-4" /> Filters
              </button>
              <span className="text-sm text-muted-foreground">
                Showing <strong>{filtered.length}</strong> of {rooms.length}
              </span>
            </div>

            <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
              <aside className="hidden lg:block bg-background border border-border p-6 self-start sticky top-24">
                {Filters}
              </aside>

              <div>
                <div className="hidden lg:flex items-center justify-between mb-6">
                  <p className="text-sm text-muted-foreground">
                    Showing <strong className="text-forest-deep">{filtered.length}</strong> of{" "}
                    {rooms.length} rooms
                  </p>
                </div>

                {filtered.length === 0 ? (
                  <div className="py-24 text-center text-muted-foreground">
                    No rooms match those filters yet.{" "}
                    <button onClick={clearAll} className="text-gold underline">Clear filters</button>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2">
                    {filtered.map((r, i) => (
                      <Reveal key={r.slug} delay={i * 80}>
                        <RoomCard room={r} />
                      </Reveal>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Mobile filter drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
            <div className="absolute inset-y-0 left-0 w-[85%] max-w-sm bg-background p-6 overflow-y-auto animate-slide-in-left">
              <div className="flex items-center justify-between mb-6">
                <span className="font-serif text-xl text-forest-deep">Filters</span>
                <button
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close filters"
                  className="h-9 w-9 grid place-items-center border border-border"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {Filters}
              <button
                onClick={() => setMobileOpen(false)}
                className="mt-8 w-full bg-forest-deep text-white py-3 text-sm"
              >
                Show {filtered.length} rooms
              </button>
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-sm font-medium text-forest-deep">{label}</div>
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-2.5 text-sm text-foreground/80 cursor-pointer hover:text-forest-deep">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 accent-forest-deep"
      />
      {label}
    </label>
  );
}

function RoomCard({ room }: { room: Room }) {
  return (
    <article className="group bg-background border border-border overflow-hidden hover:shadow-luxury transition-all duration-500 h-full flex flex-col">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={room.img}
          alt={`${room.name} at ODA Resort Hotel`}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-[1600ms] group-hover:scale-110"
        />
        {room.popular && (
          <span className="absolute top-4 left-4 bg-gold text-gold-foreground text-[10px] px-3 py-1 uppercase tracking-[0.2em]">
            Popular
          </span>
        )}
        <div className="absolute bottom-4 right-4 bg-background/95 backdrop-blur-sm px-4 py-2 text-sm">
          <span className="font-semibold text-forest-deep">{formatBirr(room.price)}</span>
          <span className="text-xs text-muted-foreground">/night</span>
        </div>
      </div>
      <div className="p-6 flex-1 flex flex-col">
        <p className="text-[10px] uppercase tracking-[0.25em] text-gold">{room.type}</p>
        <h3 className="mt-2 font-serif text-2xl text-forest-deep">{room.name}</h3>
        <p className="mt-3 text-sm text-foreground/70 leading-relaxed">{room.desc}</p>

        <div className="mt-5 flex flex-wrap gap-2">
          {room.tags.slice(0, 4).map((t) => (
            <span key={t} className="text-[11px] bg-cream px-2.5 py-1 text-forest">
              {t}
            </span>
          ))}
        </div>

        <div className="mt-auto pt-5 flex items-center justify-between gap-3 border-t border-border">
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><BedDouble className="h-3.5 w-3.5 text-gold" />{room.beds.split(" ").slice(0, 3).join(" ")}</span>
            <span className="flex items-center gap-1"><Maximize className="h-3.5 w-3.5 text-gold" />{room.size}</span>
            <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5 text-gold" />{room.guests}</span>
          </div>
          <Link
            to="/book"
            search={{ room: room.slug }}
            className="inline-flex items-center gap-1 bg-forest-deep text-white px-4 py-2 text-[11px] uppercase tracking-[0.2em] hover:bg-gold hover:text-gold-foreground transition-colors"
          >
            Book <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
