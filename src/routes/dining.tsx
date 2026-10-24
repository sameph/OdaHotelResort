import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHero } from "@/components/page-hero";
import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";
import { DiningExperience } from "@/components/dining-experience";
import { fetchMenuItems } from "@/lib/supabase-service";
import type { MenuItemRow } from "@/lib/supabase-types";
import { Utensils, Wine, Coffee, Sun } from "lucide-react";
const diningHero =
  "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/hero-4.jpg";
const diningImg =
  "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/dining.jpg";
const diningHall =
  "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/dining-hall.jpg";
const coffee =
  "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/coffee-ceremony.jpg";
const poolImg =
  "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/pool.jpg";

export const Route = createFileRoute("/dining")({
  head: () => ({
    meta: [
      { title: "Dining — ODA Resort Hotel" },
      {
        name: "description",
        content:
          "Signature restaurants, rooftop bar, coffee lounge and in-suite dining at ODA Resort Hotel in Adama, Ethiopia.",
      },
      { property: "og:title", content: "Dining — ODA Resort Hotel" },
      { property: "og:description", content: "A journey through Ethiopian flavour." },
      { property: "og:url", content: "/dining" },
    ],
    links: [{ rel: "canonical", href: "/dining" }],
  }),
  component: DiningPage,
});

const outlets = [
  {
    icon: Utensils,
    name: "Enkutash",
    tag: "Signature restaurant",
    desc: "Modern Ethiopian tasting menus in a candlelit hall with hand-carved wood ceilings.",
    hours: "18:00 – 23:00",
    img: diningImg,
  },
  {
    icon: Sun,
    name: "Sky Bar",
    tag: "Rooftop cocktails",
    desc: "Sunset cocktails and small plates with a full view of the Rift Valley skyline.",
    hours: "16:00 – 01:00",
    img: poolImg,
  },
  {
    icon: Coffee,
    name: "The Coffee Lounge",
    tag: "Traditional ceremony",
    desc: "A daily coffee ceremony with single-origin Yirgacheffe and Sidamo beans.",
    hours: "07:00 – 22:00",
    img: coffee,
  },
  {
    icon: Wine,
    name: "Grand Hall",
    tag: "Private dining",
    desc: "Bookable dining hall for weddings, tastings, and private events.",
    hours: "By reservation",
    img: diningHall,
  },
];

const defaultMenu: Record<
  string,
  Array<{
    title: string;
    description: string;
    price: string;
    featured?: boolean;
    allergens?: string[];
  }>
> = {
  Starters: [
    {
      title: "Berbere Lentil Soup",
      description:
        "Slow-simmered lentils finished with ginger, roasted garlic, lemon, and a whisper of smoky berbere.",
      price: "ETB 1,200",
      featured: true,
      allergens: ["Sesame", "Gluten"],
    },
    {
      title: "Chilli Citrus Chicken Skewers",
      description: "Chargrilled chicken with herb salad, injera crisps, and a citrus-chilli glaze.",
      price: "ETB 2,400",
      allergens: ["Dairy", "Sesame"],
    },
  ],
  "Signature Mains": [
    {
      title: "Rift Valley Lamb Roast",
      description:
        "Rosemary and berbere roasted lamb with roasted roots, mountain greens, and a red wine jus.",
      price: "ETB 4,800",
      featured: true,
      allergens: ["Gluten"],
    },
    {
      title: "Coconut Fish Stew",
      description:
        "Fragrant turmeric and tomato fish stew with greens and a delicate chilli finish.",
      price: "ETB 3,700",
      allergens: ["Fish", "Shellfish"],
    },
  ],
  Vegetarian: [
    {
      title: "Teff & Vegetable Platter",
      description:
        "A vibrant spread of lentils, roasted vegetables, chickpeas, greens, and fresh injera.",
      price: "ETB 2,900",
      allergens: ["Gluten"],
    },
  ],
  Desserts: [
    {
      title: "Cocoa-Cardamom Torte",
      description: "Dark cocoa sponge layered with cardamom cream and candied citrus.",
      price: "ETB 1,800",
      featured: true,
      allergens: ["Dairy", "Gluten"],
    },
    {
      title: "Honey Date Tart",
      description: "Date caramel, whipped mascarpone, toasted pistachio, and a crisp pastry shell.",
      price: "ETB 1,600",
      allergens: ["Dairy", "Nuts"],
    },
  ],
  Drinks: [
    {
      title: "Single-Origin Ethiopian Coffee",
      description:
        "A fragrant coffee with floral aromatics and cocoa notes from Yirgacheffe or Sidamo.",
      price: "ETB 650",
      allergens: ["None"],
    },
  ],
};

function DiningPage() {
  const { data: menuItems = [] } = useQuery<MenuItemRow[], Error>({
    queryKey: ["food-menu"],
    queryFn: fetchMenuItems,
  });

  const groupedMenu = useMemo(() => {
    const source = menuItems.length > 0 ? menuItems : [];

    if (source.length > 0) {
      return source.reduce<Record<string, MenuItemRow[]>>((acc, item) => {
        const category = item.category || "Signature Dishes";
        if (!acc[category]) acc[category] = [];
        acc[category].push(item);
        return acc;
      }, {});
    }

    return defaultMenu;
  }, [menuItems]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <PageHero
          eyebrow="Culinary Experience"
          title={
            <>
              A journey through <em className="not-italic text-gold">Ethiopian flavour</em>
            </>
          }
          subtitle="Four distinct venues, one deeply Ethiopian sensibility — from single-origin coffee to chef's table tastings."
          image={diningHero}
        />

        <div className="py-16 md:py-24 bg-cream">
          <DiningExperience />
        </div>

        <section className="py-24 md:py-32 bg-background">
          <div className="container-luxury">
            <SectionHeading
              eyebrow="Chef's menu"
              title="Seasonal plates, warm hospitality, unforgettable flavours"
              center
            />
            <div className="mt-16 grid gap-8 lg:grid-cols-2">
              {Object.entries(groupedMenu).map(([category, items]: [string, any], sectionIndex) => (
                <Reveal key={category} delay={sectionIndex * 100}>
                  <div className="h-full rounded-[2rem] border border-border bg-cream p-6 shadow-soft md:p-8">
                    <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
                          {category}
                        </p>
                        <h3 className="mt-2 font-serif text-3xl text-forest-deep">{category}</h3>
                      </div>
                      <div className="rounded-full border border-border bg-background px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                        {items.length} items
                      </div>
                    </div>

                    <div className="space-y-5">
                      {items.map((item: any) => (
                        <div
                          key={`${category}-${item.title}`}
                          className="rounded-2xl border border-border bg-background/70 p-4"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-serif text-2xl text-forest-deep">
                                  {item.title}
                                </h4>
                                {item.featured && (
                                  <span className="rounded-full bg-gold/10 px-2 py-1 text-[9px] uppercase tracking-[0.2em] text-gold-foreground">
                                    Chef's pick
                                  </span>
                                )}
                              </div>
                              <p className="mt-2 text-sm leading-relaxed text-foreground/75">
                                {item.description}
                              </p>
                            </div>
                            <span className="shrink-0 font-semibold text-gold-foreground">
                              {item.price}
                            </span>
                          </div>
                          {(item.allergens ?? []).length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {(item.allergens ?? []).map((allergen: string) => (
                                <span
                                  key={`${item.title}-${allergen}`}
                                  className="rounded-full border border-border bg-muted/30 px-2 py-1 text-[9px] uppercase tracking-[0.15em] text-muted-foreground"
                                >
                                  {allergen}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 md:py-32 bg-cream">
          <div className="container-luxury">
            <SectionHeading eyebrow="Our restaurants" title="Four venues, one philosophy" center />
            <div className="mt-16 grid gap-8 md:grid-cols-2">
              {outlets.map((o, i) => (
                <Reveal key={o.name} delay={i * 100}>
                  <article className="group bg-background overflow-hidden shadow-soft hover:shadow-luxury transition-all h-full">
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <img
                        src={o.img}
                        alt={o.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-[1600ms] group-hover:scale-110"
                      />
                    </div>
                    <div className="p-8">
                      <div className="flex items-center gap-3">
                        <o.icon className="h-5 w-5 text-gold" />
                        <span className="text-[10px] uppercase tracking-[0.3em] text-gold">
                          {o.tag}
                        </span>
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
