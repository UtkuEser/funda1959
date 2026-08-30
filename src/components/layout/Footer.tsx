import Link from "next/link";
import { branches } from "@/lib/data";
import { Container } from "@/components/shared/Container";

const productLinks = [
  { href: "/lezzetlerimiz", label: "Tüm Ürünler" },
  { href: "/lezzetlerimiz/yas-pastalar", label: "Pastalar" },
  { href: "/lezzetlerimiz/cikolatalar", label: "Çikolatalar" },
  { href: "/ozel-gun", label: "Özel Gün Pastaları" },
];

const cornerLinks = [
  { href: "/hikayemiz", label: "1959'dan Bugüne" },
  { href: "/subeler", label: "Mağazalarımız" },
  { href: "/iletisim", label: "İletişim" },
];

export function Footer() {
  return (
    <footer className="bg-burgundy text-cream/75">
      <Container className="py-16 md:py-20">
        <div className="grid grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.1fr] gap-x-8 gap-y-12">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-[30px] font-semibold tracking-tight text-cream-light">
                Funda
              </span>
              <span className="font-sans text-[11px] font-semibold tracking-[0.34em] text-cream/45">
                1959
              </span>
            </div>
            <p className="mt-4 font-sans text-[14px] leading-relaxed text-cream/65 max-w-xs">
              1959&apos;dan beri Ankara&apos;nın tatlı anlarında. Gelenekten gelen
              ustalık, bugüne taşınan lezzet.
            </p>
            <a
              href="https://instagram.com/funda.1959"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 font-sans text-[14px] text-cream/70 hover:text-cream-light transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
              @funda.1959
            </a>
          </div>

          {/* Ürünler */}
          <div>
            <h3 className="font-sans text-[13px] font-semibold tracking-[0.12em] uppercase text-cream-light mb-4">
              Ürünler
            </h3>
            <ul className="space-y-3">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-sans text-[14px] text-cream/70 hover:text-cream-light transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kurumsal */}
          <div>
            <h3 className="font-sans text-[13px] font-semibold tracking-[0.12em] uppercase text-cream-light mb-4">
              Funda
            </h3>
            <ul className="space-y-3">
              {cornerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-sans text-[14px] text-cream/70 hover:text-cream-light transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Mağazalar */}
          <div>
            <h3 className="font-sans text-[13px] font-semibold tracking-[0.12em] uppercase text-cream-light mb-4">
              Mağazalar
            </h3>
            <ul className="space-y-3">
              {branches.map((branch) => (
                <li key={branch.id}>
                  <p className="font-sans text-[14px] font-medium text-cream/85">
                    {branch.shortName}
                  </p>
                  <a
                    href={`tel:${branch.phone.replace(/\s/g, "")}`}
                    className="font-sans text-[13px] text-cream/60 hover:text-cream-light transition-colors"
                  >
                    {branch.phone}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-6 border-t border-cream/15 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <p className="font-sans text-[13px] text-cream/45">
            © {new Date().getFullYear()} Funda 1959. Tüm hakları saklıdır.
          </p>
          <a
            href="mailto:info@funda1959.com"
            className="font-sans text-[13px] text-cream/45 hover:text-cream-light transition-colors"
          >
            info@funda1959.com
          </a>
        </div>
      </Container>
    </footer>
  );
}
