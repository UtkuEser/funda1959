import Link from "next/link";
import { footerColumns, site } from "@/content/site";
import { Container } from "@/components/ui/Container";
import { Crest, Divider, MotifBand } from "@/components/ui/Ornament";
import { NewsletterForm } from "@/components/shared/NewsletterForm";

const socials = [
  { href: site.instagram, label: "Instagram" },
  { href: site.whatsapp, label: "WhatsApp" },
];

export function Footer() {
  return (
    <footer className="relative bg-bordo text-cream">
      {/* Üst dekoratif ayraç */}
      <MotifBand className="bg-bordo-dark py-2.5 opacity-75" />

      <Container className="py-16 md:py-20">
        {/* Marka bloğu */}
        <div className="text-center">
          <Crest className="mx-auto h-12 w-12 text-gold-soft" />
          <p className="mt-5 font-serif text-[1.9rem] tracking-[0.14em]">
            {site.wordmark}
            <span className="ml-3 font-sans text-[11px] uppercase tracking-[0.42em] text-gold-soft align-middle">
              {site.year}
            </span>
          </p>
          <p className="mx-auto mt-4 max-w-md font-serif text-lg leading-relaxed text-cream/85">
            {site.positioning}
          </p>
          <Divider tone="cream" className="mt-7" />
        </div>

        {/* Kolonlar */}
        <div className="mt-14 grid gap-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {footerColumns.map((column) => (
            <div key={column.title}>
              <p className="font-sans text-[11px] uppercase tracking-[0.26em] text-gold-soft">
                {column.title}
              </p>
              <ul className="mt-5 space-y-3">
                {column.items.map((item) => (
                  <li key={`${column.title}-${item.href}-${item.label}`}>
                    {item.href.startsWith("/") ? (
                      <Link
                        href={item.href}
                        className="font-sans text-[15px] text-cream/75 transition-colors hover:text-cream"
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <a
                        href={item.href}
                        className="font-sans text-[15px] text-cream/75 transition-colors hover:text-cream"
                      >
                        {item.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Sosyal medya + bülten */}
          <div>
            <p className="font-sans text-[11px] uppercase tracking-[0.26em] text-gold-soft">
              Sosyal Medya
            </p>
            <ul className="mt-5 space-y-3">
              {socials.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-sans text-[15px] text-cream/75 transition-colors hover:text-cream"
                  >
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>

            <p className="mt-8 font-sans text-[11px] uppercase tracking-[0.26em] text-gold-soft">
              Bülten
            </p>
            <NewsletterForm />
          </div>
        </div>

        {/* Alt bar */}
        <div className="mt-14 flex flex-col gap-4 border-t border-cream/15 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-sans text-[12px] tracking-[0.06em] text-cream/55">
            © {new Date().getFullYear()} {site.name}. Tüm hakları saklıdır.
          </p>
          <p className="font-sans text-[12px] uppercase tracking-[0.2em] text-cream/50">
            {site.city} · GOP · Panora · İncek
          </p>
        </div>
      </Container>
    </footer>
  );
}
