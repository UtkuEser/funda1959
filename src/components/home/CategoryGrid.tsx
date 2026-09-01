import Link from "next/link";
import Image from "next/image";
import { homeCategories } from "@/lib/data";
import { Container } from "@/components/shared/Container";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { FadeIn } from "@/components/shared/FadeIn";

export function CategoryGrid() {
  return (
    <section className="bg-cream-light py-16 md:py-24">
      <Container>
        <SectionHeader
          centered={false}
          title="Bugün ne ikram edelim?"
          subtitle="Pastalardan böreklere, günün her saatine bir lezzet."
          action={{ label: "Tüm kategoriler", href: "/lezzetlerimiz" }}
        />

        <div className="grid grid-cols-2 gap-3 md:gap-3.5 lg:grid-cols-4 lg:auto-rows-[190px]">
          {homeCategories.map((category, index) => (
            <FadeIn
              key={category.name}
              className={`h-full ${
                category.feature ? "col-span-2 lg:row-span-2" : ""
              }`}
              delay={index < 4 ? ([0, 100, 200, 300][index] as 0 | 100 | 200 | 300) : 0}
            >
              <Link
                href={category.href}
                className={`group relative block h-full w-full overflow-hidden rounded-lg bg-gradient-to-br ${category.gradient} ${
                  category.feature ? "min-h-[240px] lg:min-h-0" : "min-h-[150px]"
                }`}
              >
                {category.image && (
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    sizes={category.feature ? "(max-width: 1024px) 100vw, 640px" : "(max-width: 1024px) 50vw, 320px"}
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-espresso/55 via-espresso/10 to-espresso/0" />
                <h3
                  className={`absolute left-4 bottom-3.5 font-serif font-medium text-cream-light ${
                    category.feature ? "text-[26px] md:text-[32px]" : "text-[18px]"
                  }`}
                >
                  {category.name}
                </h3>
              </Link>
            </FadeIn>
          ))}
        </div>
      </Container>
    </section>
  );
}
