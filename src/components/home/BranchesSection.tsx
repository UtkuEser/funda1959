import Link from "next/link";
import { branches } from "@/lib/data";
import { BranchCard } from "@/components/shared/BranchCard";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { FadeIn } from "@/components/shared/FadeIn";

export function BranchesSection() {
  return (
    <section className="py-20 md:py-28 bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Şubelerimiz"
          title="Size en yakın Funda"
          subtitle="Ankara'nın üç farklı noktasında hizmetinizdeyiz. Lezzetli bir mola ya da özel gün siparişiniz için bizi ziyaret edin."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7">
          {branches.map((branch, index) => (
            <FadeIn
              key={branch.id}
              delay={([0, 100, 200] as const)[index]}
            >
              <BranchCard branch={branch} />
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={300}>
          <div className="mt-12 text-center">
            <Link
              href="/subeler"
              className="inline-flex items-center gap-2 font-sans text-sm font-semibold text-chocolate border-b-2 border-gold pb-0.5 hover:text-gold transition-colors group"
            >
              Tüm Şubeleri Gör
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
