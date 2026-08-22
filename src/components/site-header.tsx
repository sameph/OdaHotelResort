import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X, Phone } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useLang } from "@/lib/i18n";

const LOGO_URL =
  "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/logo.png";

export function SiteHeader({ transparent = true }: { transparent?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { location } = useRouterState();
  const { t } = useLang();
  const currentPath = location.pathname;

  const nav = [
    { key: "nav.home", to: "/" },
    { key: "nav.rooms", to: "/rooms" },
    { key: "nav.about", to: "/about" },
    { key: "nav.dining", to: "/dining" },
    { key: "nav.gallery", to: "/gallery" },
    { key: "nav.events", to: "/events" },
    { key: "nav.offers", to: "/offers" },
    { key: "nav.contact", to: "/contact" },
  ] as const;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const solid = !transparent || scrolled;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        solid
          ? "bg-background/90 backdrop-blur-md border-b border-border shadow-soft"
          : "bg-gradient-to-b from-forest-deep/70 via-forest-deep/30 to-transparent backdrop-blur-[2px] shadow-[0_10px_40px_-10px_rgba(15,42,32,0.75)]"
      }`}
    >
      <div className="container-luxury flex items-center justify-between gap-6 py-3 md:py-4">
        <Link
          to="/"
          className={`flex items-center gap-3 font-serif tracking-wide ${
            solid ? "text-forest-deep" : "text-white"
          }`}
          aria-label="ODA Resort Hotel — Home"
        >
          <img
            src={LOGO_URL}
            alt="ODA Resort Hotel"
            className={`h-11 w-11 md:h-12 md:w-12 object-contain rounded-full bg-white/95 p-1 ${
              solid ? "ring-1 ring-forest-deep/20" : "ring-1 ring-white/40"
            }`}
          />
          <span className="hidden sm:flex flex-col leading-none">
            <span className="text-lg md:text-xl font-semibold tracking-[0.15em]">ODA</span>
            <span
              className={`text-[9px] md:text-[10px] uppercase tracking-[0.35em] ${solid ? "text-forest/70" : "text-white/80"}`}
            >
              Resort Hotel
            </span>
          </span>
        </Link>

        <nav className="hidden xl:flex items-center gap-7" aria-label="Primary">
          {nav.map((n) => {
            const active = currentPath === n.to;
            return (
              <Link
                key={n.key}
                to={n.to}
                className={`relative text-sm tracking-wide transition-colors ${
                  active
                    ? "text-gold"
                    : solid
                      ? "text-foreground/85 hover:text-gold"
                      : "text-white/90 hover:text-gold"
                }`}
              >
                {t(n.key)}
                {active && (
                  <span className="absolute -bottom-1.5 left-0 right-0 mx-auto h-[2px] w-6 bg-gold" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <a
            href="tel:+2510222128088"
            className={`hidden lg:inline-flex items-center gap-2 text-sm ${
              solid ? "text-foreground/80" : "text-white/90"
            }`}
          >
            <Phone className="h-4 w-4" aria-hidden />
            <span>+251 022 212 8088</span>
          </a>
          <LanguageSwitcher variant={solid ? "light" : "dark"} />
          <Link
            to="/book"
            className="btn-shine inline-flex items-center bg-gold px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-gold-foreground hover:bg-forest-deep hover:text-white transition-colors"
          >
            {t("cta.book")}
          </Link>
        </div>

        <div className="flex items-center gap-3 xl:hidden">
          <div className="md:hidden">
            <LanguageSwitcher variant={solid ? "light" : "dark"} />
          </div>
          <button
            type="button"
            className={`p-2 -mr-2 ${solid ? "text-foreground" : "text-white"}`}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="xl:hidden bg-background border-t border-border animate-fade-down">
          <nav className="container-luxury py-6 flex flex-col gap-1" aria-label="Mobile">
            {nav.map((n) => (
              <Link
                key={n.key}
                to={n.to}
                className="text-foreground/85 hover:text-gold text-base py-2 border-b border-border/50 last:border-b-0"
                onClick={() => setOpen(false)}
              >
                {t(n.key)}
              </Link>
            ))}
            <Link
              to="/book"
              onClick={() => setOpen(false)}
              className="mt-4 inline-flex items-center justify-center bg-gold px-5 py-3 text-xs uppercase tracking-[0.2em] font-semibold text-gold-foreground"
            >
              {t("cta.book")}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
