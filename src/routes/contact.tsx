import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHero } from "@/components/page-hero";
import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";
import { Mail, MapPin, Phone, Send } from "lucide-react";
const hero2 =
  "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/hero-2.jpg";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — ODA Resort Hotel, Adama Ethiopia" },
      {
        name: "description",
        content: "Reach ODA Resort Hotel in Adama, Ethiopia — reservations, events, and concierge.",
      },
      { property: "og:title", content: "Contact — ODA Resort Hotel" },
      { property: "og:description", content: "We'd love to hear from you." },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [sent, setSent] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <PageHero
          eyebrow="Contact"
          title={
            <>
              We would love to <em className="not-italic text-gold">hear from you</em>
            </>
          }
          subtitle="Our concierge is available 24/7 for reservations, event enquiries, and special requests."
          image={hero2}
        />

        <section className="py-24 md:py-32 bg-cream">
          <div className="container-luxury grid gap-14 lg:grid-cols-[1fr_1.2fr]">
            <div>
              <SectionHeading eyebrow="Reach us" title="Three ways to connect" />
              <Reveal delay={200}>
                <ul className="mt-10 space-y-8">
                  <li className="flex gap-4">
                    <MapPin className="h-5 w-5 text-gold mt-1 shrink-0" />
                    <div>
                      <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                        Address
                      </div>
                      <div className="mt-1 text-forest-deep">Adama, Oromia, Ethiopia</div>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <Phone className="h-5 w-5 text-gold mt-1 shrink-0" />
                    <div>
                      <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                        Phone
                      </div>
                      <div className="mt-1 block text-forest-deep">
                        <a href="tel:+2510222128088" className="hover:text-gold block">
                          +251 022 212 8088
                        </a>
                        <a href="tel:+2510222126061" className="hover:text-gold block">
                          +251 022 212 6061
                        </a>
                        <a href="tel:+2510940333338" className="hover:text-gold block">
                          +251 0940 333338
                        </a>
                      </div>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <Mail className="h-5 w-5 text-gold mt-1 shrink-0" />
                    <div>
                      <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                        Email
                      </div>
                      <a
                        href="mailto:contactmanager@odaresortandhotel.com"
                        className="mt-1 block text-forest-deep hover:text-gold"
                      >
                        contactmanager@odaresortandhotel.com
                      </a>
                    </div>
                  </li>
                </ul>
              </Reveal>
              <Reveal delay={320}>
                <div className="mt-10 aspect-[4/3] overflow-hidden shadow-luxury border border-border">
                  <iframe
                    title="ODA Resort Hotel location"
                    src="https://www.google.com/maps?q=Adama,%20Ethiopia&output=embed"
                    className="h-full w-full"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </Reveal>
            </div>

            <Reveal delay={100}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSent(true);
                }}
                className="bg-background border border-border p-8 md:p-10 shadow-soft"
              >
                <h3 className="font-serif text-2xl text-forest-deep">Send us a message</h3>
                <p className="mt-2 text-sm text-foreground/70">
                  We'll respond within one business day.
                </p>
                <div className="mt-8 grid gap-5 sm:grid-cols-2">
                  <Field label="First name" required />
                  <Field label="Last name" required />
                  <Field label="Email" type="email" required />
                  <Field label="Phone" type="tel" />
                  <div className="sm:col-span-2">
                    <label className="block text-xs uppercase tracking-[0.25em] text-muted-foreground">
                      Enquiry type
                    </label>
                    <select className="mt-2 w-full border border-input bg-background px-3 py-3 text-sm focus:outline-none focus:border-gold">
                      {["Reservation", "Event enquiry", "Spa booking", "Press", "Other"].map(
                        (o) => (
                          <option key={o}>{o}</option>
                        ),
                      )}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs uppercase tracking-[0.25em] text-muted-foreground">
                      Message
                    </label>
                    <textarea
                      rows={5}
                      required
                      className="mt-2 w-full border border-input bg-background px-3 py-3 text-sm focus:outline-none focus:border-gold resize-none"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="btn-shine mt-8 inline-flex items-center gap-2 bg-forest-deep text-white px-8 py-3.5 text-xs uppercase tracking-[0.25em] font-semibold hover:bg-gold hover:text-gold-foreground transition-colors"
                >
                  {sent ? (
                    "Message sent"
                  ) : (
                    <>
                      Send message <Send className="h-4 w-4" />
                    </>
                  )}
                </button>
                {sent && (
                  <p className="mt-4 text-sm text-forest">
                    Thank you — we will be in touch shortly.
                  </p>
                )}
              </form>
            </Reveal>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function Field({
  label,
  type = "text",
  required = false,
}: {
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-[0.25em] text-muted-foreground">
        {label}
        {required && <span className="text-gold ml-1">*</span>}
      </span>
      <input
        type={type}
        required={required}
        className="mt-2 w-full border border-input bg-background px-3 py-3 text-sm focus:outline-none focus:border-gold"
      />
    </label>
  );
}
