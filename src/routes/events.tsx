import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHero } from "@/components/page-hero";
import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";
import { Heart, Briefcase, Presentation, PartyPopper, ArrowRight } from "lucide-react";
import { useLang } from "@/lib/i18n";
const eventsImg = "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/events.jpg";
const diningHall = "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/dining-hall.jpg";
const hero2 = "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/hero-2.jpg";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Events & Weddings — ODA Resort Hotel" },
      { name: "description", content: "Weddings, corporate meetings, conferences and celebrations at ODA Resort Hotel in Adama." },
      { property: "og:title", content: "Events & Weddings — ODA Resort Hotel" },
      { property: "og:description", content: "Moments made memorable — from garden weddings to 1,000-seat conferences." },
      { property: "og:url", content: "/events" },
    ],
    links: [{ rel: "canonical", href: "/events" }],
  }),
  component: EventsPage,
});

const types = [
  { icon: Heart, title: "Weddings", desc: "Ceremonies under the stars in our garden pavilion, dinners in the Grand Hall." },
  { icon: Briefcase, title: "Corporate", desc: "Boardrooms with cinema-grade AV, full-day meeting packages, and a business lounge." },
  { icon: Presentation, title: "Conferences", desc: "A 1,000-seat conference hall with streaming, translation booths and green rooms." },
  { icon: PartyPopper, title: "Celebrations", desc: "Milestone birthdays, anniversaries, and family gatherings with tailored menus." },
];

const venues = [
  { name: "Grand Ballroom", capacity: "1,000 guests", desc: "Column-free, cinema-grade AV, natural daylight, and adjoining pre-function foyer.", img: diningHall },
  { name: "Garden Pavilion", capacity: "300 guests", desc: "Open-air with a retractable canopy — the resort's most requested wedding venue.", img: eventsImg },
  { name: "Rift Terrace", capacity: "120 guests", desc: "Panoramic sunset views over the Rift Valley — ideal for cocktail receptions.", img: hero2 },
];

function EventsPage() {
  const { t } = useLang();
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <PageHero
          eyebrow={t("page.events.eyebrow")}
          title={t("page.events.title")}
          subtitle={t("page.events.subtitle")}
          image={eventsImg}
        />

        <section className="py-24 md:py-32 bg-cream">
          <div className="container-luxury">
            <SectionHeading eyebrow="Event types" title="Every occasion, considered" center />
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {types.map((t, i) => (
                <Reveal key={t.title} delay={i * 100}>
                  <div className="bg-background border border-border p-8 text-center h-full hover:border-gold transition-colors">
                    <t.icon className="h-8 w-8 mx-auto text-gold" />
                    <h3 className="mt-5 font-serif text-2xl text-forest-deep">{t.title}</h3>
                    <p className="mt-3 text-sm text-foreground/70">{t.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 md:py-32 bg-background">
          <div className="container-luxury">
            <SectionHeading eyebrow="Venues" title="Three distinct spaces" center />
            <div className="mt-14 grid gap-10 lg:grid-cols-3">
              {venues.map((v, i) => (
                <Reveal key={v.name} delay={i * 120}>
                  <article className="group h-full">
                    <div className="aspect-[4/5] overflow-hidden">
                      <img src={v.img} alt={v.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-[1800ms] group-hover:scale-110" />
                    </div>
                    <div className="pt-6">
                      <div className="text-[10px] uppercase tracking-[0.3em] text-gold">{v.capacity}</div>
                      <h3 className="mt-2 font-serif text-2xl text-forest-deep">{v.name}</h3>
                      <p className="mt-3 text-sm text-foreground/70 leading-relaxed">{v.desc}</p>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
            <Reveal delay={300}>
              <div className="mt-16 text-center">
                <Link
                  to="/contact"
                  className="btn-shine inline-flex items-center gap-3 bg-forest-deep text-white px-8 py-3.5 text-xs uppercase tracking-[0.25em] font-semibold hover:bg-gold hover:text-gold-foreground transition-colors"
                >
                  Enquire about your event <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
