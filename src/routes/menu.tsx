import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHero } from "@/components/page-hero";
import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";
import { fetchMenuItems } from "@/lib/supabase-service";
import type { MenuItemRow } from "@/lib/supabase-types";
import { AlertCircle } from "lucide-react";

const menuHero =
  "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/dining.jpg";

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Menu — ODA Resort Hotel" },
      {
        name: "description",
        content:
          "Explore our curated selection of authentic Ethiopian and international cuisine at ODA Resort Hotel.",
      },
      { property: "og:title", content: "Menu — ODA Resort Hotel" },
      {
        property: "og:description",
        content: "Discover our signature dishes and culinary offerings.",
      },
      { property: "og:url", content: "/menu" },
    ],
    links: [{ rel: "canonical", href: "/menu" }],
  }),
  component: MenuPage,
});

function MenuPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const {
    data: items = [],
    isLoading,
    error,
  } = useQuery<MenuItemRow[], Error>({
    queryKey: ["food-menu"],
    queryFn: fetchMenuItems,
  });

  const categories = useMemo(() => {
    const cats = new Set(items.map((item) => item.category));
    return Array.from(cats).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    if (!selectedCategory) return items;
    return items.filter((item) => item.category === selectedCategory);
  }, [items, selectedCategory]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <PageHero
        eyebrow="Our Menu"
        title="Our Menu"
        subtitle="A journey through flavour"
        image={menuHero}
      />

      <main className="flex-1">
        <section className="py-16 md:py-24">
          <div className="container-luxury">
            <Reveal>
              <div className="mb-12 text-center">
                <SectionHeading
                  eyebrow="Menu"
                  title="Culinary Offerings"
                  subtitle="Carefully crafted dishes featuring authentic Ethiopian flavors and international cuisine"
                  center
                />
              </div>
            </Reveal>

            {error && (
              <Reveal>
                <div className="mb-8 p-4 border border-red-200 bg-red-50 rounded-lg flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="text-red-800 text-sm">
                    Unable to load menu items. Please try again later.
                  </div>
                </div>
              </Reveal>
            )}

            {isLoading && (
              <Reveal>
                <div className="text-center py-12">
                  <div className="inline-block">
                    <div className="animate-spin h-8 w-8 border-2 border-gold border-t-transparent rounded-full" />
                  </div>
                  <p className="text-foreground/60 mt-4">Loading menu...</p>
                </div>
              </Reveal>
            )}

            {!isLoading && items.length === 0 && (
              <Reveal>
                <div className="text-center py-12">
                  <p className="text-foreground/60">Menu items coming soon. Check back later!</p>
                </div>
              </Reveal>
            )}

            {!isLoading && items.length > 0 && (
              <>
                <Reveal>
                  <div className="mb-8 flex flex-wrap gap-3 justify-center">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`px-4 py-2 rounded-lg border-2 transition-all ${
                        selectedCategory === null
                          ? "border-gold bg-gold/10 text-gold font-medium"
                          : "border-border text-foreground/70 hover:border-gold/50"
                      }`}
                    >
                      All Items
                    </button>
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-4 py-2 rounded-lg border-2 transition-all ${
                          selectedCategory === category
                            ? "border-gold bg-gold/10 text-gold font-medium"
                            : "border-border text-foreground/70 hover:border-gold/50"
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </Reveal>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {filteredItems.map((item, index) => (
                    <Reveal key={item.id} delay={index * 0.05}>
                      <div className="group relative border border-border rounded-lg overflow-hidden hover:border-gold/50 transition-all duration-300 hover:shadow-lg">
                        {item.image_url && (
                          <div className="relative h-48 sm:h-56 overflow-hidden bg-foreground/5">
                            <img
                              src={item.image_url}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </div>
                        )}

                        <div className="p-5 sm:p-6">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <h3 className="text-lg sm:text-xl font-serif font-semibold text-foreground line-clamp-2">
                              {item.title}
                            </h3>
                            {item.price && (
                              <div className="text-gold font-semibold text-lg shrink-0">
                                ETB {Number(item.price)}
                              </div>
                            )}
                          </div>

                          <p className="text-sm text-foreground/70 mb-4 line-clamp-2">
                            {item.description}
                          </p>

                          {item.allergens && item.allergens.length > 0 && (
                            <div className="mb-3 flex flex-wrap gap-2">
                              {item.allergens.map((allergen, idx) => (
                                <span
                                  key={idx}
                                  className="inline-block px-2 py-1 text-xs bg-red-100/50 text-red-700 rounded"
                                >
                                  {allergen}
                                </span>
                              ))}
                            </div>
                          )}

                          {item.featured && (
                            <div className="pt-3 border-t border-border/30">
                              <span className="inline-block px-2 py-1 text-xs font-semibold bg-gold/10 text-gold rounded">
                                ⭐ Featured
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        {!isLoading && items.length > 0 && (
          <section className="py-12 md:py-16 bg-forest-deep/5 border-t border-border">
            <div className="container-luxury">
              <Reveal>
                <div className="text-center">
                  <h2 className="text-2xl md:text-3xl font-serif font-semibold text-foreground mb-3">
                    Ready to Dine?
                  </h2>
                  <p className="text-foreground/70 mb-6">
                    Reserve your table or inquire about our special dining experiences.
                  </p>
                  <a
                    href="/contact"
                    className="inline-flex items-center justify-center px-8 py-3 bg-gold text-white font-semibold rounded-lg hover:bg-gold/90 transition-all"
                  >
                    Contact Us
                  </a>
                </div>
              </Reveal>
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
