import { useEffect, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

const heroImg = "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/hero-resort.jpg";
const hero2 = "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/hero-2.jpg";
const hero3 = "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/hero-3.jpg";
const hero4 = "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/hero-4.jpg";

type Slide = {
  img: string;
  eyebrow: string;
  title: React.ReactNode;
  subtitle: string;
  zoom: "in" | "out";
};

const slides: Slide[] = [
  {
    img: heroImg,
    eyebrow: "Adama · Ethiopia",
    title: (
      <>
        Experience Luxury &<br />
        <em className="not-italic text-gold">Comfort</em> in the Heart of Adama
      </>
    ),
    subtitle:
      "Five-star suites, restorative spa rituals, and fine dining framed by the quiet drama of Ethiopia's rift valley.",
    zoom: "in",
  },
  {
    img: hero2,
    eyebrow: "Timeless architecture",
    title: (
      <>
        Where warm sandstone meets <em className="not-italic text-gold">Ethiopian sky</em>
      </>
    ),
    subtitle:
      "Palm-lined courtyards, reflecting pools, and light that turns everything to gold at day's end.",
    zoom: "out",
  },
  {
    img: hero3,
    eyebrow: "Infinity above the valley",
    title: (
      <>
        A stillness you can <em className="not-italic text-gold">taste</em> — <br />
        the valley below, the sky above
      </>
    ),
    subtitle:
      "Our signature infinity pool spills onto the horizon at sunset, lanterns lit, city lights blooming.",
    zoom: "in",
  },
  {
    img: hero4,
    eyebrow: "Signature dining",
    title: (
      <>
        A tasting menu written by <em className="not-italic text-gold">Ethiopia</em>
      </>
    ),
    subtitle:
      "Candlelight, hand-carved wood, and heritage grains reimagined — every plate tells a story.",
    zoom: "out",
  },
];

export function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 6500);
    return () => window.clearInterval(id);
  }, [paused]);

  const go = (dir: -1 | 1) => setIndex((i) => (i + dir + slides.length) % slides.length);

  return (
    <section
      className="relative h-[100svh] min-h-[640px] w-full overflow-hidden bg-forest-deep"
      aria-roledescription="carousel"
      aria-label="ODA Resort Hotel highlights"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Image stack */}
      {slides.map((s, i) => {
        const active = i === index;
        return (
          <div
            key={s.img}
            className={`absolute inset-0 transition-opacity duration-[1400ms] ease-out ${
              active ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden={!active}
          >
            <img
              src={s.img}
              alt={typeof s.title === "string" ? s.title : "ODA Resort Hotel"}
              width={1920}
              height={1280}
              fetchPriority={i === 0 ? "high" : "auto"}
              loading={i === 0 ? "eager" : "lazy"}
              className={`h-full w-full object-cover ${
                active
                  ? s.zoom === "in"
                    ? "animate-zoom-in"
                    : "animate-zoom-out"
                  : ""
              }`}
              style={{ animationDuration: "8s", animationFillMode: "forwards" }}
            />
          </div>
        );
      })}

      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/30 to-black/75" />

      {/* Content */}
      <div className="relative z-10 h-full container-luxury flex flex-col justify-center text-white">
        {slides.map((s, i) => {
          const active = i === index;
          return (
            <div
              key={i}
              className={`transition-all duration-700 ${active ? "opacity-100" : "opacity-0 pointer-events-none absolute"}`}
              aria-hidden={!active}
            >
              {active && (
                <>
                  <p className="animate-fade-up text-xs md:text-sm uppercase tracking-[0.4em] text-gold">
                    {s.eyebrow}
                  </p>
                  <h1
                    key={`t-${i}`}
                    className="animate-fade-up mt-6 max-w-4xl font-serif text-5xl md:text-7xl lg:text-8xl leading-[1.02] text-balance"
                    style={{ animationDelay: "0.15s" }}
                  >
                    {s.title}
                  </h1>
                  <p
                    className="animate-fade-up mt-8 max-w-xl text-base md:text-lg text-white/85 leading-relaxed"
                    style={{ animationDelay: "0.3s" }}
                  >
                    {s.subtitle}
                  </p>
                  <div
                    className="animate-fade-up mt-10 flex flex-wrap gap-4"
                    style={{ animationDelay: "0.45s" }}
                  >
                    <Link
                      to="/rooms"
                      className="btn-shine inline-flex min-h-11 items-center gap-2 bg-gold px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] text-gold-foreground hover:bg-white transition-colors"
                    >
                      Book Your Stay
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                    <Link
                      to="/rooms"
                      className="inline-flex min-h-11 items-center border border-white/50 px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:border-gold hover:text-gold transition-colors"
                    >
                      Explore Rooms
                    </Link>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <button
        type="button"
        onClick={() => go(-1)}
        aria-label="Previous slide"
        className="hidden md:grid absolute left-6 top-1/2 -translate-y-1/2 z-20 place-items-center h-12 w-12 border border-white/30 text-white hover:border-gold hover:text-gold transition-colors backdrop-blur-sm"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => go(1)}
        aria-label="Next slide"
        className="hidden md:grid absolute right-6 top-1/2 -translate-y-1/2 z-20 place-items-center h-12 w-12 border border-white/30 text-white hover:border-gold hover:text-gold transition-colors backdrop-blur-sm"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dots + counter */}
      <div className="absolute bottom-28 md:bottom-32 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4">
        <div className="flex items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-[3px] transition-all duration-500 ${
                i === index ? "w-10 bg-gold" : "w-6 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
        <span className="text-[11px] tracking-[0.3em] text-white/70">
          {String(index + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
        </span>
      </div>
    </section>
  );
}
