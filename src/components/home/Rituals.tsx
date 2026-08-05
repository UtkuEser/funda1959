import { Section } from "@/components/ui/Section";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { Figure } from "@/components/ui/Figure";
import { Reveal } from "@/components/ui/Reveal";
import { journalEntries } from "@/content/journal";

/** Tatlı ritüeller — bir büyük içerik, iki küçük destek içeriği. */
export function Rituals() {
  const [lead, ...support] = journalEntries;
  const others = support.slice(0, 2);

  return (
    <Section tone="cream-2">
      <Container>
        <Heading
          label="Funda Defteri"
          title="Tatlı ritüeller üzerine notlar."
          lead="Pastane kültürü küçük alışkanlıklardan oluşur: kahvenin yanına ne konur, misafirliğe ne götürülür, bir kutu nasıl hazırlanır."
        />

        <div className="mt-16 grid gap-12 lg:mt-20 lg:grid-cols-12 lg:gap-16">
          {/* Büyük editorial içerik */}
          <Reveal className="lg:col-span-7">
            <article>
              <Figure
                asset={lead.image}
                ratio="3 / 2"
                sizes="(max-width: 1024px) 100vw, 58vw"
              />
              <p className="t-label mt-6 font-sans text-bordo/80">{lead.label}</p>
              <h3 className="mt-4 max-w-[20ch] font-serif text-[clamp(1.75rem,2.4vw,2.5rem)] leading-[1.15] text-ink">
                {lead.title}
              </h3>
              <p className="t-body measure mt-5 text-ink-soft">{lead.excerpt}</p>
            </article>
          </Reveal>

          {/* İki destek içeriği */}
          <div className="grid gap-10 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1 lg:gap-12">
            {others.map((entry, index) => (
              <Reveal key={entry.id} delay={80 + index * 80}>
                <article className="flex gap-7">
                  <div className="w-[42%] shrink-0">
                    <Figure
                      asset={entry.image}
                      ratio="4 / 5"
                      sizes="(max-width: 1024px) 40vw, 16vw"
                    />
                  </div>
                  <div>
                    <p className="t-label font-sans text-bordo/80">{entry.label}</p>
                    <h3 className="t-h3 mt-3 font-serif text-ink">{entry.title}</h3>
                    <p className="mt-3 font-sans text-[16px] leading-[1.6] text-ink-soft">
                      {entry.excerpt}
                    </p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
