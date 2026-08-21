import { createFileRoute, Link, useLoaderData } from "@tanstack/react-router";
import { useState } from "react";
import {
  Waves,
  Sparkles,
  Dumbbell,
  UtensilsCrossed,
  Presentation,
  Wifi,
  Plane,
  Car,
  Baby,
  Trees,
  Wine,
  Coffee,
  ArrowRight,
  Star,
  MapPin,
  Phone,
  Mail,
  ChevronDown,
  Users,
  BedDouble,
  Maximize,
} from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BookingBar } from "@/components/booking-bar";
import { HeroCarousel } from "@/components/hero-carousel";
import { DiningExperience } from "@/components/dining-experience";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { useLang } from "@/lib/i18n";
import {
  fetchRooms,
  fetchOffers,
  fetchGalleryImages,
  fetchJournalPosts,
} from "@/lib/supabase-service";

const heroImg =
  "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/hero-resort.jpg";
const poolImg =
  "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/pool.jpg";
const eventsImg =
  "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/events.jpg";
const diningImg =
  "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/dining.jpg";

export const Route = createFileRoute("/")({
  loader: async () => {
    try {
      const [rooms, offers, gallery, journal] = await Promise.all([
        fetchRooms(),
        fetchOffers(),
        fetchGalleryImages(),
        fetchJournalPosts().catch(() => []), // Catch if table missing
      ]);
      return { rooms, offers, gallery, journal };
    } catch (e) {
      console.error(e);
      return { rooms: [], offers: [], gallery: [], journal: [] };
    }
  },
  head: () => ({
    meta: [
      { title: "ODA Resort Hotel — Luxury Resort & Spa in Adama, Ethiopia" },
      {
        name: "description",
        content:
          "Five-star suites, spa, fine dining and event venues at ODA Resort Hotel in Adama, Ethiopia. Reserve your stay and experience Ethiopian luxury.",
      },
      {
        property: "og:title",
        content: "ODA Resort Hotel — Luxury Resort & Spa in Adama, Ethiopia",
      },
      {
        property: "og:description",
        content: "Warm Ethiopian hospitality, timeless design, and the rhythm of the highlands.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [
      { rel: "canonical", href: "/" },
      { rel: "preload", as: "image", href: heroImg, fetchPriority: "high" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Hotel",
          name: "ODA Resort Hotel",
          description:
            "A five-star luxury resort in Adama, Ethiopia with suites, spa, fine dining and event venues.",
          starRating: { "@type": "Rating", ratingValue: "5" },
          address: {
            "@type": "PostalAddress",
            addressLocality: "Adama",
            addressRegion: "Oromia",
            addressCountry: "ET",
          },
          telephone: "+251-22-000-0000",
          priceRange: "$$$",
          amenityFeature: [
            "Swimming Pool",
            "Spa",
            "Gym",
            "Restaurant",
            "Conference Hall",
            "Free WiFi",
            "Airport Pickup",
            "Parking",
          ].map((n) => ({ "@type": "LocationFeatureSpecification", name: n })),
        }),
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const data = Route.useLoaderData();
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main id="main">
        <HeroCarousel />
        <BookingBar />
        <About />
        <FeaturedRooms rooms={data.rooms} />
        <DiningExperience />
        <Dining />
        <Amenities />
        <Events />
        <Offers offers={data.offers} />
        <Testimonials />
        <Gallery images={data.gallery} />
        <News posts={data.journal} />
        <FAQ />
        <Location />
        <FinalCTA />
      </main>
      <SiteFooter />
    </div>
  );
}

/* ---------- ABOUT ---------- */
function About() {
  const { t } = useLang();
  return (
    <section id="about" className="py-24 md:py-32 bg-cream">
      <div className="container-luxury grid gap-14 lg:grid-cols-2 lg:gap-20 items-center">
        <div>
          <SectionHeading eyebrow={t("index.about.eyebrow")} title={t("index.about.title")} />
          <Reveal delay={220}>
            <div className="mt-8 space-y-5 text-foreground/75 text-base md:text-lg leading-relaxed">
              <p>{t("index.about.p1")}</p>
              <p>{t("index.about.p2")}</p>
            </div>
          </Reveal>
          <Reveal delay={320}>
            <div className="mt-10 grid grid-cols-3 gap-6 max-w-md">
              {[
                { k: "120+", v: "Suites & Villas" },
                { k: "5★", v: "Guest Rating" },
                { k: "24/7", v: "Concierge" },
              ].map((s) => (
                <div key={s.v}>
                  <div className="font-serif text-3xl md:text-4xl text-forest-deep">{s.k}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.15em] text-muted-foreground">
                    {t(`index.about.stat_${s.v}`) || s.v}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        <Reveal className="relative" delay={100}>
          <img
            src={poolImg}
            alt="Infinity pool at ODA Resort at dusk with warm lanterns"
            width={1600}
            height={1100}
            loading="lazy"
            className="w-full h-[440px] md:h-[560px] object-cover shadow-luxury"
          />
          <div className="hidden md:block absolute -bottom-6 -left-6 bg-forest-deep text-white p-6 max-w-[240px] shadow-luxury animate-float">
            <p className="font-serif text-xl leading-tight">{t("index.about.quote")}</p>
            <div className="mt-3 text-[10px] uppercase tracking-[0.25em] text-gold">
              — Condé Nast Traveler
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function FeaturedRooms({ rooms = [] }: { rooms?: import("@/lib/supabase-types").RoomRow[] }) {
  const { t } = useLang();
  const displayRooms = rooms.slice(0, 3);
  return (
    <section id="rooms" className="py-24 md:py-32 bg-background">
      <div className="container-luxury">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <SectionHeading eyebrow={t("index.rooms.eyebrow")} title={t("index.rooms.title")} />
          <Reveal delay={200}>
            <Link
              to="/rooms"
              className="inline-flex items-center gap-2 text-sm text-forest hover:text-gold transition-colors self-start md:self-auto"
            >
              {t("index.rooms.all")} <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {displayRooms.map((r, i) => (
            <Reveal key={r.id || r.name} delay={i * 120}>
              <article className="group bg-cream overflow-hidden shadow-soft hover:shadow-luxury transition-all duration-500 h-full flex flex-col">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={r.image_url || ""}
                    alt={`${r.name} at ODA Resort Hotel`}
                    width={1400}
                    height={1000}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-[1600ms] group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-forest-deep">
                    From ${r.price}/night
                  </div>
                </div>
                <div className="p-7 flex-1 flex flex-col">
                  <h3 className="font-serif text-2xl text-forest-deep group-hover:text-gold transition-colors">
                    {r.name}
                  </h3>
                  <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Maximize className="h-3.5 w-3.5 text-gold" aria-hidden /> {r.size_sqm} m²
                    </span>
                    <span className="flex items-center gap-1.5">
                      <BedDouble className="h-3.5 w-3.5 text-gold" aria-hidden /> {r.beds}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-gold" aria-hidden /> {r.capacity} Guests
                    </span>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {(r.amenities || []).slice(0, 3).map((t: string) => (
                      <span
                        key={t}
                        className="text-[11px] px-2.5 py-1 border border-border text-foreground/70"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="mt-auto pt-7 flex items-center justify-between border-t border-border">
                    <Link to="/rooms" className="text-sm text-forest hover:text-gold">
                      {t("btn.viewDetails")}
                    </Link>
                    <Link
                      to="/book"
                      className="inline-flex items-center gap-2 bg-forest-deep text-white px-5 py-2.5 text-sm hover:bg-gold hover:text-gold-foreground transition-colors"
                    >
                      {t("btn.bookNow")} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- AMENITIES ---------- */
const amenities = [
  { icon: Waves, name: "Infinity Pool" },
  { icon: Sparkles, name: "Spa & Wellness" },
  { icon: Dumbbell, name: "Fitness Studio" },
  { icon: UtensilsCrossed, name: "Fine Dining" },
  { icon: Presentation, name: "Conference Hall" },
  { icon: Wifi, name: "High-speed WiFi" },
  { icon: Plane, name: "Airport Transfer" },
  { icon: Car, name: "Valet Parking" },
  { icon: Baby, name: "Kids Club" },
  { icon: Trees, name: "Private Gardens" },
  { icon: Wine, name: "Rooftop Bar" },
  { icon: Coffee, name: "Coffee Lounge" },
];

function Amenities() {
  const { t } = useLang();
  return (
    <section className="py-24 md:py-32 bg-forest-deep text-white">
      <div className="container-luxury">
        <SectionHeading
          eyebrow={t("index.amenities.eyebrow")}
          title={t("index.amenities.title")}
          center
          invert
        />
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-white/10">
          {amenities.map((a, i) => (
            <Reveal key={a.name} delay={i * 40}>
              <div className="bg-forest-deep p-8 flex flex-col items-center text-center gap-4 hover:bg-forest transition-colors group h-full">
                <a.icon
                  className="h-8 w-8 text-gold transition-transform duration-500 group-hover:scale-125 group-hover:rotate-6"
                  aria-hidden
                />
                <span className="text-sm tracking-wide text-white/90">{a.name}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- DINING (culinary) ---------- */
function Dining() {
  const { t } = useLang();
  return (
    <section className="py-24 md:py-32 bg-cream">
      <div className="container-luxury grid gap-14 lg:grid-cols-2 items-center">
        <Reveal className="order-2 lg:order-1">
          <img
            src={diningImg}
            alt="Signature restaurant at ODA Resort Hotel"
            width={1600}
            height={1100}
            loading="lazy"
            className="w-full h-[420px] md:h-[560px] object-cover shadow-luxury"
          />
        </Reveal>
        <div className="order-1 lg:order-2">
          <SectionHeading eyebrow={t("index.dining.eyebrow")} title={t("index.dining.title")} />
          <Reveal delay={200}>
            <p className="mt-6 text-foreground/75 text-base md:text-lg leading-relaxed">
              {t("index.dining.p1")}
            </p>
          </Reveal>
          <Reveal delay={280}>
            <ul className="mt-8 space-y-4 text-foreground/80">
              {["index.dining.l1", "index.dining.l2", "index.dining.l3", "index.dining.l4"].map(
                (v) => (
                  <li key={v} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 bg-gold shrink-0" />
                    <span>{t(v)}</span>
                  </li>
                ),
              )}
            </ul>
          </Reveal>
          <Reveal delay={340}>
            <Link
              to="/dining"
              className="mt-10 inline-flex items-center gap-2 border-b border-gold pb-1 text-sm text-forest-deep hover:text-gold transition-colors"
            >
              {t("index.dining.cta")} <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------- EVENTS ---------- */
function Events() {
  const { t } = useLang();
  // Using static for now, as events map to fixed images
  const events = [
    { name: "Weddings", desc: "Ceremonies under the stars in our grand garden pavilion." },
    { name: "Corporate", desc: "Purpose-built boardrooms and full-day meeting packages." },
    { name: "Conferences", desc: "1,000-seat hall with cinema-grade AV and streaming." },
    { name: "Celebrations", desc: "Milestone birthdays, anniversaries, and family gatherings." },
  ];
  return (
    <section className="relative py-24 md:py-32 bg-background">
      <div className="container-luxury">
        <div className="grid gap-14 lg:grid-cols-2 items-center">
          <div>
            <SectionHeading eyebrow={t("index.events.eyebrow")} title={t("index.events.title")} />
            <Reveal delay={200}>
              <p className="mt-6 text-foreground/75 text-base md:text-lg leading-relaxed">
                {t("index.events.p1")}
              </p>
            </Reveal>
            <div className="mt-10 grid sm:grid-cols-2 gap-6">
              {events.map((e, i) => (
                <Reveal key={e.name} delay={200 + i * 80}>
                  <div className="border-l-2 border-gold pl-5 py-1 hover:border-l-4 transition-all">
                    <h3 className="font-serif text-xl text-forest-deep">{e.name}</h3>
                    <p className="mt-2 text-sm text-foreground/70 leading-relaxed">{e.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal delay={500}>
              <Link
                to="/events"
                className="btn-shine mt-10 inline-flex items-center gap-2 bg-forest-deep text-white px-7 py-3.5 text-sm hover:bg-gold hover:text-gold-foreground transition-colors"
              >
                {t("index.events.cta")} <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Reveal>
          </div>
          <Reveal delay={100}>
            <img
              src={eventsImg}
              alt="Elegant garden wedding reception at ODA Resort"
              width={1600}
              height={1100}
              loading="lazy"
              className="w-full h-[440px] md:h-[600px] object-cover shadow-luxury"
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------- OFFERS ---------- */
function Offers({ offers = [] }: { offers?: import("@/lib/supabase-types").OfferRow[] }) {
  const { t } = useLang();

  // Dynamic offers from DB
  const displayOffers = offers.slice(0, 4);

  return (
    <section className="py-24 md:py-32 bg-cream">
      <div className="container-luxury">
        <SectionHeading
          eyebrow={t("index.offers.eyebrow")}
          title={t("index.offers.title")}
          center
        />
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {displayOffers.map((o, i) => (
            <Reveal key={o.id || o.title} delay={i * 100}>
              <article className="group relative overflow-hidden shadow-soft hover:shadow-luxury transition-all h-full">
                <img
                  src={o.image_url || ""}
                  alt={o.title}
                  width={1400}
                  height={1000}
                  loading="lazy"
                  className="h-72 w-full object-cover transition-transform duration-[1600ms] group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                <div className="absolute top-4 left-4 bg-gold text-gold-foreground text-[10px] px-3 py-1 uppercase tracking-[0.2em]">
                  {o.tag}
                </div>
                <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                  <h3 className="font-serif text-xl">{o.title}</h3>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-gold tracking-wider">{o.price}</span>
                    <Link to="/offers" className="text-xs underline underline-offset-4">
                      {t("btn.view")}
                    </Link>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- TESTIMONIALS ---------- */
function Testimonials() {
  const { t } = useLang();
  const reviews = [
    {
      name: "Amina Bekele",
      role: "Addis Ababa, Ethiopia",
      text: "The most beautiful weekend we've spent in years. The staff remembered our names, our coffee order, everything. Genuinely five-star.",
    },
    {
      name: "James Okonkwo",
      role: "Lagos, Nigeria",
      text: "The Presidential Suite is world-class — comparable to Four Seasons in Marrakech. Ethiopian coffee ceremony at sunset was unforgettable.",
    },
    {
      name: "Sarah Whitfield",
      role: "London, UK",
      text: "I've stayed at Radisson and Hyatt across East Africa. ODA is a step ahead in warmth and design. We're already planning our return.",
    },
  ];
  return (
    <section className="py-24 md:py-32 bg-background">
      <div className="container-luxury">
        <SectionHeading
          eyebrow={t("index.testimonials.eyebrow")}
          title={t("index.testimonials.title")}
          center
        />
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {reviews.map((r, i) => (
            <Reveal key={r.name} delay={i * 120}>
              <blockquote className="bg-cream p-8 border-t-2 border-gold shadow-soft flex flex-col gap-5 h-full hover:-translate-y-1 transition-transform duration-500">
                <div className="flex gap-1 text-gold" aria-label="5 star rating">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-current" aria-hidden />
                  ))}
                </div>
                <p className="text-foreground/80 leading-relaxed italic font-serif text-lg">
                  “{r.text}”
                </p>
                <footer className="mt-auto">
                  <div className="font-medium text-forest-deep">{r.name}</div>
                  <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mt-1">
                    {r.role}
                  </div>
                </footer>
              </blockquote>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- GALLERY ---------- */
function Gallery({ images = [] }: { images?: import("@/lib/supabase-types").GalleryRow[] }) {
  const { t } = useLang();
  const displayImages = images.slice(0, 6);
  return (
    <section className="py-24 md:py-32 bg-cream">
      <div className="container-luxury">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <SectionHeading eyebrow={t("index.gallery.eyebrow")} title={t("index.gallery.title")} />
          <Reveal delay={200}>
            <Link
              to="/gallery"
              className="inline-flex items-center gap-2 text-sm text-forest hover:text-gold"
            >
              {t("index.gallery.cta")} <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Reveal>
        </div>
        <div className="mt-14 grid grid-cols-2 md:grid-cols-3 auto-rows-[220px] md:auto-rows-[260px] gap-3">
          {displayImages.map((im, i) => (
            <Reveal
              key={im.id || i}
              delay={i * 80}
              className={i === 0 ? "row-span-2" : i === 4 ? "col-span-2" : ""}
            >
              <div className="relative overflow-hidden group h-full">
                <img
                  src={im.src || ""}
                  alt={im.alt || ""}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-[1800ms] group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-forest-deep/0 group-hover:bg-forest-deep/25 transition-colors" />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- NEWS ---------- */
function News({ posts = [] }: { posts?: import("@/lib/supabase-types").JournalRow[] }) {
  const { t } = useLang();
  const displayPosts = posts.slice(0, 3);
  return (
    <section className="py-24 md:py-32 bg-background">
      <div className="container-luxury">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <SectionHeading eyebrow={t("index.journal.eyebrow")} title={t("index.journal.title")} />
          <Reveal delay={200}>
            <a
              href="#"
              className="inline-flex items-center gap-2 text-sm text-forest hover:text-gold"
            >
              {t("index.journal.cta")} <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
          </Reveal>
        </div>
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {displayPosts.map((p, i) => (
            <Reveal key={p.id || p.title} delay={i * 120}>
              <a href="#" className="group block">
                <div className="overflow-hidden">
                  <img
                    src={p.image_url || ""}
                    alt={p.title}
                    loading="lazy"
                    className="w-full h-64 object-cover transition-transform duration-[1600ms] group-hover:scale-110"
                  />
                </div>
                <div className="mt-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  <span className="text-gold">{p.category}</span>
                  <span>·</span>
                  <span>{p.date}</span>
                </div>
                <h3 className="mt-3 font-serif text-2xl text-forest-deep leading-snug group-hover:text-gold transition-colors">
                  {p.title}
                </h3>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- FAQ ---------- */
function FAQ() {
  const { t } = useLang();
  const faqs = [
    {
      q: "What time is check-in and check-out?",
      a: "Check-in from 14:00 and check-out by 12:00. Early arrival and late departure are offered subject to availability.",
    },
    {
      q: "Do you offer airport transfers?",
      a: "Yes — private transfers from Bole International Airport and Adama's regional terminal can be arranged with your reservation.",
    },
    {
      q: "Is the resort family-friendly?",
      a: "Absolutely. Our Kids Club welcomes children ages 3–12 daily and family villas connect for larger groups.",
    },
    {
      q: "What payment methods do you accept?",
      a: "We accept all major cards (Visa, Mastercard), Telebirr, CBE Birr, Chapa, PayPal and Stripe for online reservations.",
    },
    {
      q: "What is your cancellation policy?",
      a: "Most rates allow free cancellation up to 48 hours before arrival. Special-offer rates may have different terms shown at booking.",
    },
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="py-24 md:py-32 bg-cream">
      <div className="container-luxury grid gap-14 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <SectionHeading eyebrow={t("index.faq.eyebrow")} title={t("index.faq.title")} />
          <Reveal delay={220}>
            <p className="mt-6 text-foreground/70">{t("index.faq.p1")}</p>
          </Reveal>
        </div>
        <Reveal delay={140}>
          <div className="divide-y divide-border border-y border-border">
            {faqs.map((f, i) => {
              const isOpen = open === i;
              return (
                <div key={f.q}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="w-full flex items-center justify-between gap-6 py-6 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="font-serif text-lg md:text-xl text-forest-deep">{f.q}</span>
                    <ChevronDown
                      className={`h-5 w-5 text-gold shrink-0 transition-transform duration-500 ${isOpen ? "rotate-180" : ""}`}
                      aria-hidden
                    />
                  </button>
                  {isOpen && (
                    <div className="pb-6 text-foreground/75 leading-relaxed animate-fade-up">
                      {f.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- LOCATION ---------- */
function Location() {
  const { t } = useLang();
  return (
    <section className="py-24 md:py-32 bg-background">
      <div className="container-luxury grid gap-14 lg:grid-cols-2 items-center">
        <div>
          <SectionHeading eyebrow={t("index.location.eyebrow")} title={t("index.location.title")} />
          <Reveal delay={200}>
            <p className="mt-6 text-foreground/75 text-base md:text-lg leading-relaxed">
              {t("index.location.p1")}
            </p>
          </Reveal>
          <Reveal delay={280}>
            <ul className="mt-8 space-y-4">
              <li className="flex gap-3 text-foreground/85">
                <MapPin className="h-5 w-5 text-gold mt-0.5 shrink-0" aria-hidden />
                Adama, Oromia, Ethiopia
              </li>
              <li className="flex gap-3 text-foreground/85">
                <Phone className="h-5 w-5 text-gold mt-0.5 shrink-0" aria-hidden />
                <div className="flex flex-col">
                  <span>+251 022 212 8088</span>
                  <span>+251 022 212 6061</span>
                  <span>+251 0940 333338</span>
                </div>
              </li>
              <li className="flex gap-3 text-foreground/85">
                <Mail className="h-5 w-5 text-gold mt-0.5 shrink-0" aria-hidden />
                contactmanager@odaresortandhotel.com
              </li>
            </ul>
          </Reveal>
          <Reveal delay={340}>
            <div className="mt-10 grid grid-cols-3 gap-4 text-sm">
              {[
                { k: "99 km", v: "Addis Ababa" },
                { k: "12 km", v: "Lake Beseka" },
                { k: "45 km", v: "Awash Park" },
              ].map((s) => (
                <div key={s.v} className="border-t border-gold pt-4">
                  <div className="font-serif text-2xl text-forest-deep">{s.k}</div>
                  <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground mt-1">
                    {s.v}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
        <Reveal delay={100}>
          <div className="aspect-[4/3] w-full overflow-hidden shadow-luxury border border-border">
            <iframe
              title="ODA Resort Hotel location map"
              src="https://www.google.com/maps?q=Adama,%20Ethiopia&output=embed"
              className="h-full w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- FINAL CTA ---------- */
function FinalCTA() {
  const { t } = useLang();
  return (
    <section className="relative py-28 md:py-40 overflow-hidden">
      <img
        src={heroImg}
        alt=""
        aria-hidden
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover animate-ken-burns"
      />
      <div className="absolute inset-0 bg-forest-deep/85" />
      <div className="relative container-luxury text-center text-white max-w-2xl mx-auto">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.3em] text-gold">Reserve</p>
        </Reveal>
        <Reveal delay={100}>
          <h2 className="mt-4 font-serif text-4xl md:text-6xl text-balance">
            {t("index.cta.title")}
          </h2>
        </Reveal>
        <Reveal delay={200}>
          <p className="mt-6 text-white/80 text-lg leading-relaxed">{t("index.cta.p1")}</p>
        </Reveal>
        <Reveal delay={280}>
          <div className="mt-10 flex flex-wrap gap-4 justify-center">
            <Link
              to="/rooms"
              className="btn-shine inline-flex min-h-11 items-center gap-2 bg-gold px-8 py-3.5 text-sm font-medium text-gold-foreground hover:bg-white transition-colors"
            >
              {t("btn.bookNow")} <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <a
              href="tel:+2510222128088"
              className="inline-flex min-h-11 items-center gap-2 border border-white/50 px-8 py-3.5 text-sm font-medium text-white hover:border-gold hover:text-gold transition-colors"
            >
              <Phone className="h-4 w-4" aria-hidden /> +251 022 212 8088
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
