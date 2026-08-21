import type { ReactNode } from "react";

export function PageHero({
  eyebrow,
  title,
  subtitle,
  image,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  subtitle?: string;
  image: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative h-[62svh] min-h-[440px] w-full overflow-hidden">
      <img
        src={image}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover animate-ken-burns"
        width={1920}
        height={1080}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/40 to-black/70" />
      <div className="relative z-10 h-full container-luxury flex flex-col justify-end pb-16 md:pb-24 text-white">
        <p className="animate-fade-up text-[11px] uppercase tracking-[0.4em] text-gold">
          {eyebrow}
        </p>
        <h1
          className="animate-fade-up mt-4 font-serif text-4xl md:text-6xl lg:text-7xl leading-[1.05] text-balance max-w-4xl"
          style={{ animationDelay: "0.1s" }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="animate-fade-up mt-5 max-w-2xl text-base md:text-lg text-white/85"
            style={{ animationDelay: "0.2s" }}
          >
            {subtitle}
          </p>
        )}
        {children && (
          <div className="animate-fade-up mt-8" style={{ animationDelay: "0.3s" }}>
            {children}
          </div>
        )}
      </div>
    </section>
  );
}
