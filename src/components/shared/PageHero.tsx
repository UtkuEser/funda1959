import { Container } from "@/components/ui/Container";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description?: string;
};

/** Alt sayfaların üst bloğu — sabit header yüksekliğini de karşılar. */
export function PageHero({ eyebrow, title, description }: PageHeroProps) {
  return (
    <section className="bg-cream-2 pb-16 pt-36 md:pb-24 md:pt-44">
      <Container>
        <p className="t-label font-sans text-bordo/80">{eyebrow}</p>
        <h1 className="t-h2 mt-6 max-w-[16ch] font-serif text-ink">{title}</h1>
        {description ? (
          <p className="t-body measure mt-7 text-ink-soft">{description}</p>
        ) : null}
      </Container>
    </section>
  );
}
