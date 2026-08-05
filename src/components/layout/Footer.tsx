import Link from "next/link";
import { footerColumns, site } from "@/content/site";
import { Container } from "@/components/ui/Container";
import { Monogram } from "@/components/ui/Marks";
import { NewsletterForm } from "@/components/shared/NewsletterForm";

export function Footer() {
  return (
    <footer className="bg-bordo text-cream">
      <Container className="py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          {/* Marka */}
          <div className="lg:col-span-4">
            <Monogram className="h-8 w-8 text-cream/80" />
            <div className="mt-4 flex items-baseline gap-3">
              <span className="font-serif text-[28px] tracking-[0.16em]">FUNDA</span>
              <span className="font-sans text-[12px] tracking-[0.34em] text-cream/70">
                {site.year}
              </span>
            </div>
            <p className="mt-6 max-w-[34ch] font-serif text-[22px] leading-[1.4] text-cream/90">
              {site.positioning}
            </p>
            <p className="mt-4 font-sans text-[15px] text-cream/65">
              {site.city} · GOP · Panora · İncek
            </p>
          </div>

          {/* Kolonlar */}
          <div className="grid gap-10 sm:grid-cols-3 lg:col-span-5">
            {footerColumns.slice(0, 3).map((column) => (
              <div key={column.title}>
                <p className="font-sans text-[13px] uppercase tracking-[0.18em] text-cream/60">
                  {column.title}
                </p>
                <ul className="mt-5 space-y-3">
                  {column.items.map((item) => (
                    <li key={`${column.title}-${item.href}-${item.label}`}>
                      {item.href.startsWith("/") ? (
                        <Link
                          href={item.href}
                          className="font-sans text-[16px] text-cream/85 transition-colors hover:text-cream"
                        >
                          {item.label}
                        </Link>
                      ) : (
                        <a
                          href={item.href}
                          className="font-sans text-[16px] text-cream/85 transition-colors hover:text-cream"
                        >
                          {item.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* İletişim + bülten */}
          <div className="lg:col-span-3">
            <p className="font-sans text-[13px] uppercase tracking-[0.18em] text-cream/60">
              İletişim
            </p>
            <ul className="mt-5 space-y-3 font-sans text-[16px] text-cream/85">
              <li>
                <a href={site.phoneHref} className="transition-colors hover:text-cream">
                  {site.phone}
                </a>
              </li>
              <li>
                <a href={site.emailHref} className="transition-colors hover:text-cream">
                  {site.email}
                </a>
              </li>
              <li>
                <a
                  href={site.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-cream"
                >
                  Instagram
                </a>
              </li>
            </ul>

            <p className="mt-8 font-sans text-[13px] uppercase tracking-[0.18em] text-cream/60">
              Bülten
            </p>
            <NewsletterForm />
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-cream/20 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-sans text-[14px] text-cream/60">
            © {new Date().getFullYear()} {site.name}. Tüm hakları saklıdır.
          </p>
          <Link
            href="/kurumsal"
            className="font-sans text-[14px] text-cream/60 transition-colors hover:text-cream"
          >
            Kurumsal & Toplu Sipariş
          </Link>
        </div>
      </Container>
    </footer>
  );
}
