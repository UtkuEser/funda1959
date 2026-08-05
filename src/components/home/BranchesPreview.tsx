import { Section } from "@/components/ui/Section";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { BranchCard } from "@/components/shared/BranchCard";
import { branches, branchesIntro } from "@/content/branches";

export function BranchesPreview() {
  return (
    <Section tone="cream-2">
      <Container>
        <SectionHeading
          eyebrow={branchesIntro.eyebrow}
          title={branchesIntro.title}
          description={branchesIntro.description}
        />

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {branches.map((branch, index) => (
            <Reveal key={branch.id} delay={index * 100} className="h-full">
              <BranchCard branch={branch} />
            </Reveal>
          ))}
        </div>

        <div className="mt-14 flex justify-center">
          <Button href="/subeler" variant="outline">
            Tüm Şubeler
          </Button>
        </div>
      </Container>
    </Section>
  );
}
