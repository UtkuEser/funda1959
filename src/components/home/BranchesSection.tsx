import { branches } from "@/lib/data";
import { BranchCard } from "@/components/shared/BranchCard";
import { Container } from "@/components/shared/Container";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { FadeIn } from "@/components/shared/FadeIn";

export function BranchesSection() {
  return (
    <section className="bg-cream py-16 md:py-24">
      <Container>
        <SectionHeader
          centered={false}
          title="Mağazalarımız"
          subtitle="Bir kahve molası ya da özel gün siparişiniz için Ankara'da üç adres."
          action={{ label: "Tüm mağazalar", href: "/subeler" }}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-7 md:gap-8">
          {branches.map((branch, index) => (
            <FadeIn key={branch.id} delay={([0, 100, 200] as const)[index]}>
              <BranchCard branch={branch} />
            </FadeIn>
          ))}
        </div>
      </Container>
    </section>
  );
}
