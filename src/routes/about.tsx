import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHero } from "@/components/page-hero";
import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";
import { Award, HeartHandshake, Leaf, Sparkles } from "lucide-react";
const hero2 = "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/hero-2.jpg";
const poolImg = "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/pool.jpg";
const coffee = "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/coffee-ceremony.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — ODA Resort Hotel, Adama Ethiopia" },
      { name: "description", content: "The story, philosophy and Ethiopian hospitality behind ODA Resort Hotel in Adama." },
      { property: "og:title", content: "About — ODA Resort Hotel" },
      { property: "og:description", content: "Ethiopian hospitality reimagined for a modern traveller." },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: AboutPage,
});

const values = [
  { icon: HeartHandshake, title: "Warmth", desc: "Ethiopian hospitality is our compass — every guest is welcomed as family." },
  { icon: Sparkles, title: "Craft", desc: "From the plated course to the pressed linen, everything is considered." },
  { icon: Leaf, title: "Place", desc: "Rooted in the Rift Valley — our produce, textiles, and artisans are local." },
  { icon: Award, title: "Excellence", desc: "Five-star service standards, without ever losing our human touch." },
];

function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <PageHero
          eyebrow="Our Story"
          title={<>A sanctuary shaped by <em className="not-italic text-gold">Ethiopian soul</em></>}
          subtitle="Set against the rolling hills of Adama, ODA Resort Hotel weaves centuries-old hospitality into modern luxury."
          image={hero2}
        />

        <section className="py-24 md:py-32 bg-cream">
          <div className="container-luxury grid gap-14 lg:grid-cols-2 items-center">
            <Reveal>
              <img src={poolImg} alt="ODA Resort infinity pool at dusk" loading="lazy" className="w-full h-[520px] object-cover shadow-luxury" />
            </Reveal>
            <div>
              <SectionHeading eyebrow="Founded on hospitality" title="Where warmth becomes something you can hold" />
              <Reveal delay={220}>
                <div className="mt-8 space-y-5 text-foreground/75 text-base md:text-lg leading-relaxed">
                  <p>
                    ODA Resort Hotel opened its doors in 2019 with a single, quiet ambition: to
                    create a place where every guest — from the traveler arriving from abroad to
                    the local family gathering for a wedding — feels the deep, familial warmth
                    that is uniquely Ethiopian.
                  </p>
                  <p>
                    Everything from our architecture (inspired by the coffee-growing highlands)
                    to our menus (built around Rift Valley produce) is a love letter to the land
                    that made us.
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="py-24 md:py-32 bg-forest-deep text-white">
          <div className="container-luxury">
            <SectionHeading eyebrow="Values" title="What guides every decision" invert center />
            <div className="mt-14 grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
              {values.map((v, i) => (
                <Reveal key={v.title} delay={i * 100}>
                  <div className="bg-forest-deep p-10 h-full text-center">
                    <v.icon className="h-8 w-8 mx-auto text-gold" />
                    <h3 className="mt-5 font-serif text-2xl">{v.title}</h3>
                    <p className="mt-3 text-sm text-white/75 leading-relaxed">{v.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 md:py-32 bg-cream">
          <div className="container-luxury grid gap-14 lg:grid-cols-2 items-center">
            <div>
              <SectionHeading eyebrow="Culture" title="The Ethiopian coffee ceremony" />
              <Reveal delay={220}>
                <p className="mt-6 text-foreground/75 text-base md:text-lg leading-relaxed">
                  Coffee was born here. Every guest is invited to our daily ceremony — green
                  beans roasted over coals, ground by hand, and poured from the traditional
                  jebena. It is our slowest, most sincere welcome.
                </p>
              </Reveal>
            </div>
            <Reveal delay={100}>
              <img src={coffee} alt="Traditional Ethiopian coffee ceremony" loading="lazy" className="w-full h-[520px] object-cover shadow-luxury" />
            </Reveal>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
