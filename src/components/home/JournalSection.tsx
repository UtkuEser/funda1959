import { Section } from "@/components/ui/Section";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { JournalCard } from "@/components/shared/JournalCard";
import { journalEntries, journalIntro } from "@/content/journal";

export function JournalSection() {
  return (
    <Section tone="cream-2">
      <Container>
        <SectionHeading
          eyebrow={journalIntro.eyebrow}
          title="Tatlı ritüeller üzerine notlar."
          description={journalIntro.description}
        />

        <div className="mt-16 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4">
          {journalEntries.map((entry, index) => (
            <Reveal key={entry.id} delay={index * 90} className="h-full">
              <JournalCard entry={entry} />
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}
