import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchGalleryImages } from "@/lib/supabase-service";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import { useLang } from "@/lib/i18n";
const heroImg = "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/hero-resort.jpg";
const hero2 = "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/hero-2.jpg";
const hero3 = "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/hero-3.jpg";
const hero4 = "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/hero-4.jpg";
const poolImg = "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/pool.jpg";
const diningImg = "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/dining.jpg";
const diningHall = "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/dining-hall.jpg";
const spaImg = "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/spa.jpg";
const spaHero = "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/spa-hero.jpg";
const eventsImg = "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/events.jpg";
const roomExecutive = "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/room-executive.jpg";
const roomPresidential = "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/room-presidential.jpg";
const roomGarden = "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/room-garden.jpg";
const roomDeluxe = "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/room-deluxe.jpg";
const roomFamily = "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/room-family.jpg";
const coffee = "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/coffee-ceremony.jpg";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery — ODA Resort Hotel" },
      { name: "description", content: "A visual tour of ODA Resort Hotel — suites, dining, spa, pools, and the Ethiopian landscape." },
      { property: "og:title", content: "Gallery — ODA Resort Hotel" },
      { property: "og:description", content: "Every corner of ODA Resort Hotel, in pictures." },
      { property: "og:url", content: "/gallery" },
    ],
    links: [{ rel: "canonical", href: "/gallery" }],
  }),
  component: GalleryPage,
});

function GalleryPage() {
  const { t } = useLang();
  const { data: images = [], isLoading } = useQuery({
    queryKey: ["gallery"],
    queryFn: fetchGalleryImages,
  });

  const [active, setActive] = useState<string>("All");
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(images.map((i) => i.tag)))],
    [images]
  );
  const filtered = active === "All" ? images : images.filter((i) => i.tag === active);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <PageHero
          eyebrow={t("page.gallery.eyebrow")}
          title={t("page.gallery.title")}
          subtitle={t("page.gallery.subtitle")}
          image={hero3}
        />

        <section className="py-16 md:py-24 bg-cream">
          <div className="container-luxury">
            <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-12">
              {categories.map((c) => {
                const isActive = c === active;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setActive(c)}
                    className={`px-5 md:px-6 py-2.5 text-[11px] md:text-xs uppercase tracking-[0.25em] border transition-all duration-300 ${
                      isActive
                        ? "bg-forest-deep text-white border-forest-deep shadow-luxury"
                        : "bg-background/60 text-forest-deep border-border hover:border-gold hover:text-gold"
                    }`}
                    aria-pressed={isActive}
                  >
                    {c}
                  </button>
                );
              })}
            </div>

            <div key={active} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 animate-fade-in">
              {filtered.map((im, i) => (
                <Reveal key={`${active}-${i}`} delay={(i % 8) * 60}>
                  <figure className="group relative overflow-hidden aspect-[3/4]">
                    <img src={im.src} alt={im.alt} loading="lazy" className="h-full w-full object-cover transition-transform duration-[2000ms] group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <figcaption className="absolute inset-x-0 bottom-0 p-4 text-white translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all">
                      <div className="text-[9px] uppercase tracking-[0.3em] text-gold">{im.tag}</div>
                      <div className="mt-1 text-sm font-serif">{im.alt}</div>
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
