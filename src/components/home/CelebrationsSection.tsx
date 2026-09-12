import Link from "next/link";
import Image from "next/image";
import { celebrationCategories } from "@/lib/data";
import { Container } from "@/components/shared/Container";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { FadeIn } from "@/components/shared/FadeIn";

export function CelebrationsSection() {
  const [lead, ...rest] = celebrationCategories;

  return (
    <section className="bg-cream-light py-12 md:py-20">
      <Container>
        <SectionHeader
          centered={false}
          eyebrow="Kutlamalarınız İçin"
          title="Her kutlamaya yakışan bir pasta"
          subtitle="Doğum günlerinden düğünlere, her özel anınız için özenle hazırlanan pastalar."
          action={{ label: "Tüm Pastalar", href: "/lezzetlerimiz/yas-pastalar" }}
        />

        <div className="grid gap-6 lg:grid-cols-2 lg:gap-7">
          {/* Lead — one larger card */}
          <FadeIn>
            <Link href={lead.href} className="group block">
              <div
                className={`relative w-full aspect-[4/5] overflow-hidden rounded-lg bg-gradient-to-br lg:aspect-auto lg:h-[420px] ${lead.gradient}`}
              >
                {lead.image ? (
                  <Image
                    src={lead.image}
                    alt={lead.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 620px"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.1] group-hover:opacity-[0.16] transition-opacity duration-500">
                    <span className="font-serif text-8xl text-espresso select-none">
                      {lead.title.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <h3 className="mt-3 font-serif text-[22px] font-medium text-burgundy">
                {lead.title}
                <span className="inline-block ml-1.5 text-burgundy/70 transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </h3>
              <p className="mt-1 font-sans text-[14px] text-warm-brown leading-relaxed">
                {lead.description}
              </p>
            </Link>
          </FadeIn>

          {/* Two stacked cards */}
          <div className="flex flex-col gap-4 lg:gap-5">
            {rest.map((item, index) => (
              <FadeIn key={item.title} delay={([100, 200] as const)[index]}>
                <Link href={item.href} className="group block">
                  <div
                    className={`relative w-full aspect-[16/10] overflow-hidden rounded-lg bg-gradient-to-br lg:aspect-auto lg:h-[180px] ${item.gradient}`}
                  >
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="(max-width: 1024px) 100vw, 520px"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center opacity-[0.1] group-hover:opacity-[0.16] transition-opacity duration-500">
                        <span className="font-serif text-6xl text-espresso select-none">
                          {item.title.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <h3 className="mt-2.5 font-serif text-[19px] font-medium text-burgundy">
                    {item.title}
                    <span className="inline-block ml-1.5 text-burgundy/70 transition-transform group-hover:translate-x-0.5">
                      →
                    </span>
                  </h3>
                  <p className="mt-1 font-sans text-[14px] text-warm-brown leading-relaxed">
                    {item.description}
                  </p>
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
