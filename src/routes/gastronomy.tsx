import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHero } from "@/components/page-hero";
import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";
import {
  GraduationCap,
  ChefHat,
  Sprout,
  Globe,
  ArrowRight,
  BookOpen,
  Users,
  Award,
  Utensils,
  Building,
  Briefcase,
} from "lucide-react";

const heroImg =
  "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/coffee-ceremony.jpg";
const coffeeImg =
  "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/dining.jpg";

export const Route = createFileRoute("/gastronomy")({
  head: () => ({
    meta: [
      {
        title: "ODA Gastronomy and Culinary Center — Adama",
      },
      {
        name: "description",
        content:
          "A self-capacity building center that contributes to regional tourism and hospitality development, safeguards Oromo food heritage, and delivers market-driven culinary training and agribusiness growth.",
      },
      {
        property: "og:title",
        content: "ODA Gastronomy and Culinary Center",
      },
      {
        property: "og:description",
        content:
          "A self-capacity building center advancing culinary heritage, TVET training, and agribusiness development.",
      },
      { property: "og:url", content: "/gastronomy" },
    ],
    links: [{ rel: "canonical", href: "/gastronomy" }],
  }),
  component: GastronomyPage,
});

/* ---------- DATA ---------- */

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

const competences = [
  {
    icon: Utensils,
    title: "Culinary Art",
    desc: "Develop practical and creative culinary skills rooted in Oromo tradition and shaped by modern food standards.",
  },
  {
    icon: Building,
    title: "Hotel Operation",
    desc: "Build competence across the core areas of hotel operations, service flow, and operational excellence.",
  },
  {
    icon: Briefcase,
    title: "Domestic Work",
    desc: "Train in hospitality support services, organization, and professional care for guest-facing environments.",
  },
  {
    icon: Users,
    title: "On-the-Job Training",
    desc: "Provide short-term practical training that links classroom learning with industry experience.",
  },
  {
    icon: BookOpen,
    title: "NTQF Levels I–IV",
    desc: "Support coherent advancement through accredited national skills pathways in food and hospitality development.",
  },
  {
    icon: Award,
    title: "Industry Readiness",
    desc: "Prepare trainees to enter the market with practical competence, professional discipline, and cultural awareness.",
  },
];

/* ---------- PAGE ---------- */

function GastronomyPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        {/* ── Hero ──────────────────────────────────────────── */}
        <PageHero
          eyebrow="Center of Excellence"
          title={
            <>
              ODA Gastronomy and <em className="not-italic text-gold">Culinary Center</em>
            </>
          }
          subtitle="A self-capacity building center that contributes to the Tourism and Hospitality sector at the regional level, gradually expanding to the national level."
          image={heroImg}
        />

        {/* ── Mission ───────────────────────────────────────── */}
        <section className="py-24 md:py-32 bg-cream">
          <div className="container-luxury grid gap-14 lg:grid-cols-2 items-center">
            <Reveal>
              <img
                src={coffeeImg}
                alt="Oromo culinary heritage and food culture"
                loading="lazy"
                className="w-full h-[520px] object-cover shadow-luxury"
              />
            </Reveal>
            <div>
              <SectionHeading
                eyebrow="Our Mission"
                title="Preserving culture through culinary excellence"
              />
              <Reveal delay={220}>
                <div className="mt-8 space-y-5 text-foreground/75 text-base md:text-lg leading-relaxed">
                  <p>
                    To build and operate a world-class center of excellence in Adama that safeguards
                    Oromo food heritage, delivers market-driven Hospitality TVET training, fosters
                    agribusiness enterprise, and drives sustainable economic growth.
                  </p>
                  <p>
                    The center is designed to preserve culinary identity while creating practical
                    opportunities for learning, enterprise, and regional development.
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── Our Mandate ───────────────────────────────────── */}
        <section className="py-24 md:py-32 bg-forest-deep text-white">
          <div className="container-luxury">
            <SectionHeading
              eyebrow="Our Mandate"
              title={
                <>
                  Four pillars of <em className="not-italic text-gold">impact</em>
                </>
              }
              subtitle="Our work is anchored in heritage preservation, practical training, agribusiness development, and sustainable regional growth."
              center
              invert
            />
            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {mandates.map((m, i) => (
                <Reveal key={m.title} delay={200 + i * 100}>
                  <div className="group relative bg-white/5 backdrop-blur-sm border border-white/10 p-7 md:p-8 hover:border-gold/40 hover:bg-white/10 transition-all duration-500 h-full">
                    <m.icon className="h-10 w-10 text-gold mb-5 group-hover:scale-110 transition-transform duration-500" />
                    <h3 className="font-serif text-xl text-white group-hover:text-gold transition-colors">
                      {m.title}
                    </h3>
                    <p className="mt-3 text-white/60 text-sm leading-relaxed">{m.desc}</p>
                    <div className="mt-5 h-[2px] w-8 bg-gold/40 group-hover:w-14 group-hover:bg-gold transition-all duration-500" />
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Training Programs ──────────────────────────────── */}
        <section className="py-24 md:py-32 bg-background">
          <div className="container-luxury">
            <SectionHeading
              eyebrow="Training Programs"
              title={
                <>
                  Building skills for a{" "}
                  <em className="not-italic text-gold">stronger culinary future</em>
                </>
              }
              subtitle="Our training focuses on hotel operation, culinary art, domestic work, and short-term on-the-job learning in a practical, market-oriented environment."
              center
            />
            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {competences.map((c, i) => (
                <Reveal key={c.title} delay={150 + i * 80}>
                  <div className="group border border-border p-7 hover:border-gold/50 hover:shadow-soft transition-all duration-500 h-full bg-background">
                    <c.icon className="h-9 w-9 text-forest-deep mb-4 group-hover:text-gold transition-colors duration-500" />
                    <h3 className="font-serif text-xl text-forest-deep">{c.title}</h3>
                    <p className="mt-3 text-foreground/65 text-sm leading-relaxed">{c.desc}</p>
                    <div className="mt-4 h-[2px] w-8 bg-forest-deep/20 group-hover:w-12 group-hover:bg-gold transition-all duration-500" />
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ────────────────────────────────────────────── */}
        <section className="relative py-28 md:py-36 overflow-hidden">
          <img
            src={heroImg}
            alt=""
            aria-hidden
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover animate-ken-burns"
          />
          <div className="absolute inset-0 bg-forest-deep/85" />
          <div className="relative container-luxury text-center text-white max-w-2xl mx-auto">
            <Reveal>
              <p className="text-xs uppercase tracking-[0.3em] text-gold">Join Us</p>
            </Reveal>
            <Reveal delay={100}>
              <h2 className="mt-4 font-serif text-4xl md:text-6xl text-balance">
                Shape the future of{" "}
                <em className="not-italic text-gold">food culture and talent</em>
              </h2>
            </Reveal>
            <Reveal delay={200}>
              <p className="mt-6 text-white/80 text-lg leading-relaxed">
                We nurture practical skills, preserve culinary heritage, and connect learning with
                enterprise and regional development.
              </p>
            </Reveal>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
