import Link from "next/link";
import Image from "next/image";
import { homeCategories } from "@/lib/data";
import { Container } from "@/components/shared/Container";
import { FadeIn } from "@/components/shared/FadeIn";

/**
 * Category entry — tall photo cards. At rest: photo, a warm tone rising from
 * the bottom, the name and its option count. On hover / keyboard focus
 * (desktop): the card lifts, the tone covers the photo, the name turns gold
 * and the sub-options rise in. The name link stretches over the whole card;
 * the sub-option links sit above it, so no link is nested in another.
 */
export function CategoryGrid() {
  return (
    <section aria-labelledby="home-categories" className="bg-cream py-14 md:py-20">
      <Container>
        <FadeIn>
          <div className="mx-auto mb-9 max-w-2xl text-center md:mb-12">
            <p className="font-sans text-[12px] font-semibold uppercase tracking-[0.2em] text-burgundy/60">
              Kategorilerimiz
            </p>
            <h2
              id="home-categories"
              className="mt-3 font-serif text-[34px] font-semibold leading-[1.08] text-burgundy md:text-[46px] lg:text-[52px]"
            >
              Lezzetli Kategoriler
            </h2>
            <p className="mt-3 font-sans text-[15px] text-warm-brown md:text-[17px]">
              Her zevke uygun lezzetlerimizi keşfedin.
            </p>
          </div>
        </FadeIn>

        <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4 lg:gap-6">
          {homeCategories.map((category, index) => (
            <li key={category.href}>
              <FadeIn delay={([0, 100, 200, 300] as const)[index] ?? 0} className="h-full">
                <article className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-espresso shadow-[0_18px_40px_-28px_rgba(42,35,32,0.5)] transition-[translate,box-shadow] duration-500 ease-out hover:-translate-y-2 hover:shadow-[0_32px_56px_-26px_rgba(42,35,32,0.6)] focus-within:-translate-y-2 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold-light has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-cream motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:focus-within:translate-y-0 sm:rounded-3xl">
                  <Image
                    src={category.image}
                    alt={category.alt}
                    fill
                    sizes="(min-width: 1024px) 300px, 50vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none"
                  />
                  {/* resting tone: warm brown rising from the bottom */}
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-[#2A1A17]/85 via-[#2A1A17]/30 via-45% to-transparent"
                  />
                  {/* hover / focus tone: covers the photo so the sub-options read */}
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-[#3A2420]/70 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:transition-none"
                  />

                  <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-6 xl:p-8">
                    <h3 className="font-serif text-[23px] font-semibold leading-[1.05] text-cream-light transition-colors duration-500 group-hover:text-gold-light group-focus-within:text-gold-light sm:text-[30px] xl:text-[36px]">
                      <Link
                        href={category.href}
                        className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
                      >
                        {category.name}
                      </Link>
                    </h3>
                    <p className="mt-1.5 font-sans text-[12.5px] text-cream-light/85 sm:mt-2 sm:text-[15px]">
                      {category.links.length} farklı seçenek
                    </p>

                    {/* sub-options — desktop only; phones and tablets go straight to the listing */}
                    <ul
                      aria-label={`${category.name} seçenekleri`}
                      className="relative z-10 hidden max-h-0 translate-y-3 overflow-hidden opacity-0 transition-[max-height,opacity,transform] duration-500 ease-out group-hover:max-h-72 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:max-h-72 group-focus-within:translate-y-0 group-focus-within:opacity-100 motion-reduce:transition-none lg:block"
                    >
                      {category.links.map((link, i) => (
                        <li key={link.href} className={i === 0 ? "pt-4" : ""}>
                          <Link
                            href={link.href}
                            className="flex items-center gap-3 py-1.5 font-sans text-[15px] font-medium text-cream-light transition-colors hover:text-gold-light focus-visible:text-gold-light focus-visible:outline-none"
                          >
                            <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold-light" />
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              </FadeIn>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
