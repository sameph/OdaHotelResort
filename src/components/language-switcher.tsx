import { useEffect, useRef, useState } from "react";
import { Globe, Check } from "lucide-react";
import { LANGUAGES, useLang } from "@/lib/i18n";

export function LanguageSwitcher({ variant = "light" }: { variant?: "light" | "dark" }) {
  const { lang, setLang, t } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const isDark = variant === "dark";
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("lang.label")}
        className={`inline-flex items-center gap-1.5 text-xs tracking-wide uppercase transition-colors ${
          isDark ? "text-white/90 hover:text-gold" : "text-foreground/80 hover:text-gold"
        }`}
      >
        <Globe className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">{current.code.toUpperCase()}</span>
        <span aria-hidden>{current.flag}</span>
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute right-0 top-full mt-2 w-48 bg-background border border-border shadow-luxury py-1 z-50 animate-fade-down"
        >
          {LANGUAGES.map((l) => (
            <li key={l.code}>
              <button
                type="button"
                onClick={() => { setLang(l.code); setOpen(false); }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-cream transition-colors ${
                  l.code === lang ? "text-forest-deep font-medium" : "text-foreground/80"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span aria-hidden className="text-base">{l.flag}</span>
                  <span>{l.native}</span>
                </span>
                {l.code === lang && <Check className="h-3.5 w-3.5 text-gold" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
