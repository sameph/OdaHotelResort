import { Facebook, Instagram, Youtube, Mail, MapPin, Phone } from "lucide-react";
import { Link } from "@tanstack/react-router";

const explore = [
  { label: "Rooms & Suites", to: "/rooms" as const },
  { label: "Book a Stay", to: "/book" as const },
  { label: "Dining", to: "/dining" as const },
  { label: "Events & Weddings", to: "/events" as const },
  { label: "Special Offers", to: "/offers" as const },
  { label: "Gallery", to: "/gallery" as const },
];

const company = [
  { label: "About ODA", to: "/about" as const },
  { label: "Contact", to: "/contact" as const },
];

export function SiteFooter() {
  return (
    <footer className="bg-forest-deep text-white/85">
      <div className="container-luxury py-16 md:py-20 grid gap-12 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link to="/" className="inline-flex items-center gap-3 text-white">
            <span className="grid place-items-center h-11 w-11 rounded-full border-2 border-white font-serif italic text-xl leading-none">
              O
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-lg font-semibold tracking-[0.15em]">ODA</span>
              <span className="text-[10px] uppercase tracking-[0.35em] text-white/70">
                Resort Hotel
              </span>
            </span>
          </Link>
          <p className="mt-6 text-sm leading-relaxed text-white/70 max-w-xs">
            A five-star sanctuary in Adama, Ethiopia — where warm hospitality meets timeless design
            and the rhythm of the highlands.
          </p>
          <div className="mt-6 flex gap-3">
            {[Facebook, Instagram, Youtube].map((Icon, i) => (
              <a
                key={i}
                href="#"
                aria-label="Social link"
                className="grid place-items-center h-10 w-10 border border-white/20 hover:border-gold hover:text-gold hover:-translate-y-1 transition-all"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm uppercase tracking-[0.2em] text-gold gold-underline">Explore</h3>
          <ul className="mt-6 space-y-3 text-sm">
            {explore.map((l) => (
              <li key={l.label}>
                <Link to={l.to} className="hover:text-gold transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm uppercase tracking-[0.2em] text-gold gold-underline">Company</h3>
          <ul className="mt-6 space-y-3 text-sm">
            {company.map((l) => (
              <li key={l.label}>
                <Link to={l.to} className="hover:text-gold transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
            {["Careers", "Press", "Privacy Policy", "Terms of Service"].map((l) => (
              <li key={l}>
                <a href="#" className="hover:text-gold transition-colors">
                  {l}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm uppercase tracking-[0.2em] text-gold gold-underline">Contact</h3>
          <ul className="mt-6 space-y-4 text-sm">
            <li className="flex gap-3">
              <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-gold" aria-hidden />
              <span>Adama, Oromia, Ethiopia</span>
            </li>
            <li className="flex gap-3">
              <Phone className="h-4 w-4 mt-0.5 shrink-0 text-gold" aria-hidden />
              <div className="flex flex-col">
                <a href="tel:+2510222128088" className="hover:text-gold">
                  +251 022 212 8088
                </a>
                <a href="tel:+2510222126061" className="hover:text-gold">
                  +251 022 212 6061
                </a>
                <a href="tel:+2510940333338" className="hover:text-gold">
                  +251 0940 333338
                </a>
              </div>
            </li>
            <li className="flex gap-3">
              <Mail className="h-4 w-4 mt-0.5 shrink-0 text-gold" aria-hidden />
              <a href="mailto:contactmanager@odaresortandhotel.com" className="hover:text-gold">
                contactmanager@odaresortandhotel.com
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-luxury py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/55">
          <p>© {new Date().getFullYear()} ODA Resort Hotel. All rights reserved.</p>
          <p className="tracking-[0.2em] uppercase">Adama · Ethiopia</p>
        </div>
      </div>
    </footer>
  );
}
