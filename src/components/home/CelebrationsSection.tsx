import Link from "next/link";
import Image from "next/image";
import { CELEBRATION_OCCASIONS } from "@/lib/recommendations";
import { Container } from "@/components/shared/Container";
import { FadeIn } from "@/components/shared/FadeIn";

/**
 * Short editorial entry to the /ozel-gun cake finder. Each celebration type
 * opens the finder with that first answer already given — the four
 * questions themselves live only on /ozel-gun.
 */
export function CelebrationsSection() {
  return (
    <section aria-labelledby="home-celebrations" className="bg-cream-light py-14 md:py-20">
      <Container>
        <div className="grid items-center gap-9 lg:grid-cols-2 lg:gap-16">
          <FadeIn direction="scale">
            <figure className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-cream-dark">
              <Image
                src="/home/hero/3.png"
                alt="Pembe güller ve altın detaylarla süslenmiş iki katlı kutlama pastası"
                fill
                sizes="(min-width: 1024px) 600px, 100vw"
                className="object-cover"
              />
            </figure>
          </FadeIn>

          <div>
            <FadeIn>
              <p className="font-sans text-[12px] font-semibold uppercase tracking-[0.18em] text-burgundy/60">
                Kutlamalar
              </p>
              <h2
                id="home-celebrations"
                className="mt-3 font-serif text-[30px] font-semibold leading-[1.1] text-burgundy md:text-[38px]"
              >
                Kutlamanıza uygun pastayı birlikte seçelim.
              </h2>
              <p className="mt-4 max-w-[34rem] font-sans text-[15px] leading-relaxed text-warm-brown md:text-[16px]">
                Kutlama türü, kişi sayısı, lezzet ve tasarım tercihinize göre dört kısa soruda size
                uygun Funda pastalarını gösteriyoruz.
              </p>
            </FadeIn>

            <FadeIn delay={100}>
              <p className="mt-7 font-sans text-[13px] font-semibold text-espresso">Neyi kutluyorsunuz?</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {CELEBRATION_OCCASIONS.map((o) => (
                  <li key={o.value}>
                    <Link
                      href={`/ozel-gun?kutlama=${o.value}`}
                      className="inline-flex min-h-[40px] items-center rounded-full border border-sand bg-cream-light px-4 font-sans text-[13.5px] font-medium text-espresso transition-colors hover:border-burgundy/50 hover:text-burgundy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/40"
                    >
                      {o.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </FadeIn>

            <FadeIn delay={200}>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                <Link
                  href="/ozel-gun"
                  className="inline-flex items-center gap-2 rounded-md bg-burgundy px-6 py-3.5 font-sans text-[14.5px] font-semibold text-cream-light transition-colors hover:bg-chocolate-light"
                >
                  Pastanızı bulun <span aria-hidden>→</span>
                </Link>
                <Link
                  href="/iletisim"
                  className="font-sans text-[14px] font-medium text-burgundy underline decoration-burgundy/30 underline-offset-4 transition-colors hover:decoration-burgundy"
                >
                  Kişiye özel tasarım talebi
                </Link>
              </div>
            </FadeIn>
          </div>
        </div>
      </Container>
    </section>
  );
}
