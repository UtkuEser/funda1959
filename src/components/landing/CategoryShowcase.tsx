import Link from "next/link";
import { Container } from "@/components/shared/Container";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { LandingVisual } from "./LandingVisual";

export type ShowcaseItem = {
  index: string;
  title: string;
  description?: string;
  href: string;
  linkLabel?: string;
  gradient: string;
};

type CategoryShowcaseProps = {
  id?: string;
  eyebrow?: string;
  title: string;
  intro?: string;
  items: ShowcaseItem[];
  columns?: 2 | 3;
  background?: "cream" | "cream-light";
};

export function CategoryShowcase({
  id,
  eyebrow,
  title,
  intro,
  items,
  columns = 3,
  background = "cream",
}: CategoryShowcaseProps) {
  const grid =
    columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3";

  return (
    <section
      id={id}
      className={`scroll-mt-24 py-20 md:py-28 ${background === "cream" ? "bg-cream" : "bg-cream-light"}`}
    >
      <Container>
        <SectionHeader centered={false} eyebrow={eyebrow} title={title} subtitle={intro} />

        <div className={`grid gap-x-6 gap-y-10 ${grid}`}>
          {items.map((item) => (
            <Link key={item.title} href={item.href} className="group block">
              <LandingVisual gradient={item.gradient} ratio="aspect-[4/3]" />
              <div className="mt-3.5 flex items-baseline gap-2.5">
                <span className="font-serif text-[13px] font-semibold tabular-nums text-burgundy/55">
                  {item.index}
                </span>
                <h3 className="font-serif text-[19px] font-medium text-burgundy">{item.title}</h3>
              </div>
              {item.description && (
                <p className="mt-1 max-w-sm font-sans text-[13.5px] leading-relaxed text-warm-brown">
                  {item.description}
                </p>
              )}
              <span className="mt-2 inline-flex items-center gap-1 font-sans text-[13px] font-semibold text-burgundy">
                {item.linkLabel ?? "Keşfet"}
                <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
