import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHero } from "@/components/page-hero";
import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";
import { DiningExperience } from "@/components/dining-experience";
import { Utensils, Wine, Coffee, Sun } from "lucide-react";
const diningHero = "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/hero-4.jpg";
const diningImg = "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/dining.jpg";
const diningHall = "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/dining-hall.jpg";
const coffee = "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/coffee-ceremony.jpg";
const poolImg = "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/pool.jpg";

export const Route = createFileRoute("/dining")({
  head: () => ({
    meta: [
      { title: "Dining — ODA Resort Hotel" },
      { name: "description", content: "Signature restaurants, rooftop bar, coffee lounge and in-suite dining at ODA Resort Hotel in Adama, Ethiopia." },
      { property: "og:title", content: "Dining — ODA Resort Hotel" },
      { property: "og:description", content: "A journey through Ethiopian flavour." },
      { property: "og:url", content: "/dining" },
    ],
    links: [{ rel: "canonical", href: "/dining" }],
  }),
  component: DiningPage,
});

const outlets = [
  { icon: Utensils, name: "Enkutash", tag: "Signature restaurant", desc: "Modern Ethiopian tasting menus in a candlelit hall with hand-carved wood ceilings.", hours: "18:00 – 23:00", img: diningImg },
  { icon: Sun, name: "Sky Bar", tag: "Rooftop cocktails", desc: "Sunset cocktails and small plates with a full view of the Rift Valley skyline.", hours: "16:00 – 01:00", img: poolImg },
  { icon: Coffee, name: "The Coffee Lounge", tag: "Traditional ceremony", desc: "A daily coffee ceremony with single-origin Yirgacheffe and Sidamo beans.", hours: "07:00 – 22:00", img: coffee },
  { icon: Wine, name: "Grand Hall", tag: "Private dining", desc: "Bookable dining hall for weddings, tastings, and private events.", hours: "By reservation", img: diningHall },
];

function DiningPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <PageHero
          eyebrow="Culinary Experience"
          title={<>A journey through <em className="not-italic text-gold">Ethiopian flavour</em></>}
          subtitle="Four distinct venues, one deeply Ethiopian sensibility — from single-origin coffee to chef's table tastings."
          image={diningHero}
        />

        <div className="py-16 md:py-24 bg-cream">
          <DiningExperience />
        </div>


        <section className="py-24 md:py-32 bg-cream">
          <div className="container-luxury">
            <SectionHeading eyebrow="Our restaurants" title="Four venues, one philosophy" center />
            <div className="mt-16 grid gap-8 md:grid-cols-2">
              {outlets.map((o, i) => (
                <Reveal key={o.name} delay={i * 100}>
                  <article className="group bg-background overflow-hidden shadow-soft hover:shadow-luxury transition-all h-full">
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <img src={o.img} alt={o.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-[1600ms] group-hover:scale-110" />
                    </div>
                    <div className="p-8">
                      <div className="flex items-center gap-3">
                        <o.icon className="h-5 w-5 text-gold" />
                        <span className="text-[10px] uppercase tracking-[0.3em] text-gold">{o.tag}</span>
                      </div>
                      <h3 className="mt-4 font-serif text-3xl text-forest-deep">{o.name}</h3>
                      <p className="mt-3 text-foreground/70 leading-relaxed">{o.desc}</p>
                      <div className="mt-6 text-xs uppercase tracking-[0.2em] text-muted-foreground border-t border-border pt-4">
                        Hours · {o.hours}
                      </div>
                    </div>
                  </article>
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
