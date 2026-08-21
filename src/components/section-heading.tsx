import { Reveal } from "./reveal";
import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  center = false,
  invert = false,
}: {
  eyebrow: string;
  title: ReactNode;
  subtitle?: string;
  center?: boolean;
  invert?: boolean;
}) {
  const titleColor = invert ? "text-white" : "text-forest-deep";
  const subColor = invert ? "text-white/75" : "text-foreground/70";
  const align = center ? "text-center mx-auto" : "";
  return (
    <div className={`max-w-2xl ${align}`}>
      <Reveal>
        <p className="text-xs uppercase tracking-[0.35em] text-gold">{eyebrow}</p>
      </Reveal>
      <Reveal delay={80}>
        <h2 className={`mt-4 font-serif text-4xl md:text-5xl lg:text-[3.2rem] leading-[1.05] text-balance ${titleColor}`}>
          {title}
        </h2>
      </Reveal>
      <Reveal delay={140}>
        <div className={`mt-6 h-[2px] w-16 bg-gold ${center ? "mx-auto" : ""}`} />
      </Reveal>
      {subtitle && (
        <Reveal delay={200}>
          <p className={`mt-6 text-base md:text-lg leading-relaxed ${subColor}`}>{subtitle}</p>
        </Reveal>
      )}
    </div>
  );
}
