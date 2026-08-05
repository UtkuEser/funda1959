import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Monogram } from "@/components/ui/Marks";

export default function NotFound() {
  return (
    <section className="flex min-h-[70vh] items-center bg-cream pt-36 pb-24">
      <Container>
        <div className="mx-auto max-w-xl text-center">
          <Monogram className="mx-auto h-14 w-14 text-bordo" />
          <p className="mt-8 font-sans text-[13px] uppercase tracking-[0.32em] text-bordo/85">
            Sayfa bulunamadı
          </p>
          <h1 className="mt-5 font-serif text-4xl leading-tight text-ink sm:text-5xl">
            Bu rafta bir şey kalmamış.
          </h1>
          <p className="mt-6 font-sans text-[16px] leading-relaxed text-ink-soft">
            Aradığınız sayfa taşınmış ya da hiç var olmamış olabilir. Vitrine dönüp
            baştan bakalım.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button href="/">Ana Sayfa</Button>
            <Button href="/lezzetler" variant="outline">
              Lezzetler
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
