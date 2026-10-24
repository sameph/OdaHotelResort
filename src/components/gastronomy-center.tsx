import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";
import {
  GraduationCap,
  ChefHat,
  Sprout,
  Globe,
  ArrowRight,
} from "lucide-react";

const mandates = [
  {
    icon: ChefHat,
    title: "Culinary Heritage",
    desc: "Safeguard, document, and digitize indigenous Oromo culinary practices, recipes, and food preservation techniques.",
  },
  {
    icon: GraduationCap,
    title: "TVET Training",
    desc: "Deliver accredited Technical and Vocational Education and Training (TVET) under NTQF Levels I–IV in culinary arts and hospitality management.",
  },
  {
    icon: Sprout,
    title: "Agribusiness",
    desc: "Promote regional agribusiness by establishing direct procurement networks with smallholder farmer cooperatives.",
  },
  {
    icon: Globe,
    title: "Agro-Tourism",
    desc: "Advance regional agro-tourism and position Adama City as a primary culinary destination along the Addis–Adama corridor.",
  },
];

const culinaryImg =
  "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/dining.jpg";

export function GastronomyCenter() {
  return (
    <section className="relative py-24 md:py-32 bg-forest-deep text-white overflow-hidden">
      {/* subtle background image with overlay */}
      <img
        src={culinaryImg}
        alt=""
        aria-hidden
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover opacity-15"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-forest-deep via-forest-deep/95 to-forest-deep" />

      <div className="relative container-luxury">
        <div className="grid gap-16 lg:grid-cols-2 items-start">
          {/* ── Left: Text content ────────────────────────────── */}
          <div>
            <SectionHeading
              eyebrow="Center of Excellence"
              title={
                <>
                  ODA Gastronomy &{" "}
                  <em className="not-italic text-gold">Culinary Center</em>
                </>
              }
              invert
            />

            <Reveal delay={200}>
              <p className="mt-6 text-white/80 text-base md:text-lg leading-relaxed max-w-xl">
                A self-capacity building center contributing to the Tourism and
                Hospitality sector at the regional level — gradually expanding to
                the national level.
              </p>
            </Reveal>

            {/* Mission */}
            <Reveal delay={280}>
              <div className="mt-10 border-l-2 border-gold pl-6">
                <h3 className="font-serif text-xl md:text-2xl text-gold">
                  Our Mission
                </h3>
                <p className="mt-3 text-white/75 text-sm md:text-base leading-relaxed">
                  To build and operate a world-class center of excellence in
                  Adama that safeguards Oromo food heritage, delivers
                  market-driven Hospitality TVET training, fosters agribusiness
                  enterprise, and drives sustainable economic growth.
                </p>
              </div>
            </Reveal>

            {/* Training Focus */}
            <Reveal delay={360}>
              <div className="mt-8 border-l-2 border-gold/50 pl-6">
                <h3 className="font-serif text-xl md:text-2xl text-white">
                  Training Focus
                </h3>
                <p className="mt-3 text-white/70 text-sm md:text-base leading-relaxed">
                  Hotel Operation with 6 areas of competence, Culinary Art,
                  Domestic Work, and short-term on-the-job training programs.
                </p>
              </div>
            </Reveal>

            <Reveal delay={440}>
              <a
                href="/contact"
                className="btn-shine mt-10 inline-flex items-center gap-2 bg-gold text-gold-foreground px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] hover:bg-white transition-colors"
              >
                Learn More <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
            </Reveal>
          </div>

          {/* ── Right: Mandate cards ─────────────────────────── */}
          <div className="grid gap-5 sm:grid-cols-2">
            {mandates.map((m, i) => (
              <Reveal key={m.title} delay={200 + i * 100}>
                <div className="group relative bg-white/5 backdrop-blur-sm border border-white/10 p-6 md:p-7 hover:border-gold/40 hover:bg-white/10 transition-all duration-500">
                  <m.icon className="h-8 w-8 text-gold mb-4 group-hover:scale-110 transition-transform duration-500" />
                  <h4 className="font-serif text-lg text-white group-hover:text-gold transition-colors">
                    {m.title}
                  </h4>
                  <p className="mt-2 text-white/60 text-sm leading-relaxed">
                    {m.desc}
                  </p>
                  {/* Gold accent line */}
                  <div className="mt-4 h-[2px] w-8 bg-gold/40 group-hover:w-12 group-hover:bg-gold transition-all duration-500" />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
