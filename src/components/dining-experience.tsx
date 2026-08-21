import { ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
const diningHall = "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/dining-hall.jpg";
import { Reveal } from "./reveal";

/** The "Dining Experience" split section modelled on the user's reference. */
export function DiningExperience() {
  const outlets = [
    ["Signature Restaurant", "Chef's Table"],
    ["Rooftop Bar", "Coffee Lounge"],
    ["Poolside Bar", "In-Suite Dining"],
  ];
  return (
    <section className="bg-background">
      <div className="grid lg:grid-cols-2 items-stretch min-h-[560px]">
        {/* Image */}
        <div className="relative overflow-hidden group h-[380px] md:h-[540px] lg:h-auto">
          <img
            src={diningHall}
            alt="ODA Resort signature restaurant with candlelit tables and chandeliers"
            width={1600}
            height={1200}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-[2500ms] ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
        </div>

        {/* Green panel */}
        <div className="bg-forest-deep text-white px-8 md:px-16 lg:px-20 py-16 md:py-24 flex flex-col justify-center">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.4em] text-gold">Dining Experience</p>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="mt-6 font-serif text-4xl md:text-5xl lg:text-6xl leading-[1.05] text-balance">
              A journey through <br />
              <em className="not-italic text-gold">Ethiopian flavour.</em>
            </h2>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-8 text-white/80 leading-relaxed max-w-xl">
              Our chefs — trained across three continents, rooted in Ethiopian tradition — craft
              menus that honour the produce of the Rift Valley. From the traditional Kitfo bar to
              our chef's tasting counter, every plate tells a story.
            </p>
          </Reveal>

          <Reveal delay={220}>
            <ul className="mt-10 grid grid-cols-2 gap-x-8 gap-y-4">
              {outlets.flat().map((o) => (
                <li key={o} className="flex items-center gap-3 text-sm md:text-base">
                  <span className="h-px w-6 bg-gold shrink-0" aria-hidden />
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={280}>
            <Link
              to="/dining"
              className="btn-shine mt-12 inline-flex items-center gap-3 bg-gold text-gold-foreground px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.25em] hover:bg-white transition-colors w-fit"
            >
              Explore Dining <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
