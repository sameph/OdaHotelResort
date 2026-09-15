import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import { ArrowRight, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchOffers } from "@/lib/supabase-service";
import { useLang } from "@/lib/i18n";

const hero3 = "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/hero-3.jpg";

export const Route = createFileRoute("/offers")({
  head: () => ({
    meta: [
      { title: "Offers & Packages — ODA Resort Hotel" },
      { name: "description", content: "Weekend escapes, honeymoons, family packages and executive retreats at ODA Resort Hotel." },
      { property: "og:title", content: "Offers & Packages — ODA Resort Hotel" },
      { property: "og:description", content: "Curated packages, exceptional value." },
      { property: "og:url", content: "/offers" },
    ],
    links: [{ rel: "canonical", href: "/offers" }],
  }),
  component: OffersPage,
});

function OffersPage() {
  const { t } = useLang();
  const { data: offers = [] } = useQuery({
    queryKey: ["offers"],
    queryFn: fetchOffers,
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <PageHero
          eyebrow={t("page.offers.eyebrow")}
          title={t("page.offers.title")}
          subtitle={t("page.offers.subtitle")}
          image={hero3}
        />

        <section className="py-16 md:py-24 bg-cream">
          <div className="container-luxury">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {offers.map((o, i) => (
                <Reveal key={o.id} delay={i * 100}>
                  <article className="group bg-background overflow-hidden shadow-soft hover:shadow-luxury transition-all h-full flex flex-col">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      {o.image_url ? (
                        <img src={o.image_url} alt={o.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-[1800ms] group-hover:scale-110" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-muted/20 text-muted-foreground text-sm uppercase tracking-[0.2em]">No image</div>
                      )}
                      <span className="absolute top-4 left-4 bg-gold text-gold-foreground text-[10px] px-3 py-1 uppercase tracking-[0.25em]">
                        {o.tag}
                      </span>
                    </div>
                    <div className="p-7 flex-1 flex flex-col">
                      <h3 className="font-serif text-2xl text-forest-deep group-hover:text-gold transition-colors">{o.title}</h3>
                      <ul className="mt-5 space-y-2.5 text-sm text-foreground/80">
                        {o.perks.slice(0, 4).map((p, idx) => (
                          <li key={idx} className="flex gap-2.5">
                            <Check className="h-4 w-4 text-gold mt-0.5 shrink-0" />
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-auto pt-6 flex items-end justify-between border-t border-border">
                        <div>
                          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{o.from_label}</div>
                          <div className="font-serif text-2xl text-forest-deep">{o.price}</div>
                        </div>
                        <Link
                          to="/rooms"
                          className="inline-flex items-center gap-1 text-sm text-gold hover:text-forest-deep"
                        >
                          Book <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
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
