import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

type CtaAction = {
  href: string;
  label: string;
  /** tel: / mailto: gibi bağlantılar için. */
  plain?: boolean;
};

type CtaBandProps = {
  title: string;
  description?: string;
  primary?: CtaAction;
  secondary?: CtaAction;
};

/** Sayfa sonu kapanışı — düz bordo zemin, en fazla iki CTA. */
export function CtaBand({ title, description, primary, secondary }: CtaBandProps) {
  return (
    <section className="bg-bordo py-20 text-cream md:py-24">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h2 className="t-h2 max-w-[18ch] font-serif">{title}</h2>
            {description ? (
              <p className="t-body measure mt-6 text-cream/85">{description}</p>
            ) : null}
          </div>

          {primary || secondary ? (
            <div className="flex flex-wrap gap-4 lg:col-span-5 lg:justify-end">
              {primary ? (
                <Button href={primary.href} variant="lightSolid" external={primary.plain}>
                  {primary.label}
                </Button>
              ) : null}
              {secondary ? (
                <Button href={secondary.href} variant="light" external={secondary.plain}>
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
