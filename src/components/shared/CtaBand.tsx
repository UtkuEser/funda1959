import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Crest, Divider } from "@/components/ui/Ornament";

type CtaAction = {
  href: string;
  label: string;
  /** Telefon / e-posta gibi site dışı bağlantılar için. */
  plain?: boolean;
};

type CtaBandProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  primary?: CtaAction;
  secondary?: CtaAction;
};

/** Sayfa sonlarında tekrar eden geniş bordo kapanış bloğu. */
export function CtaBand({
  eyebrow,
  title,
  description,
  primary,
  secondary,
}: CtaBandProps) {
  return (
    <section className="relative overflow-hidden bg-bordo py-20 text-cream md:py-28">
      {/* İnce dekoratif çerçeve */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-5 border border-cream/15 sm:inset-8"
      />

      <Container className="relative">
        <div className="mx-auto max-w-2xl text-center">
          <Crest className="mx-auto h-12 w-12 text-gold-soft" />

          {eyebrow ? (
            <p className="mt-6 font-sans text-[12px] uppercase tracking-[0.32em] text-gold-soft">
              {eyebrow}
            </p>
          ) : null}

          <h2 className="mt-4 font-serif text-[2.2rem] leading-[1.14] sm:text-[2.8rem]">
            {title}
          </h2>

          <Divider tone="cream" className="mt-7" />

          {description ? (
            <p className="mt-7 font-sans text-[17px] leading-[1.75] text-cream/85">
              {description}
            </p>
          ) : null}

          {primary || secondary ? (
            <div className="mt-11 flex flex-wrap items-center justify-center gap-5">
              {primary ? (
                <Button href={primary.href} variant="solid-light" external={primary.plain}>
                  {primary.label}
                </Button>
              ) : null}
              {secondary ? (
                <Button
                  href={secondary.href}
                  variant="light"
                  external={secondary.plain}
                >
                  {secondary.label}
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
