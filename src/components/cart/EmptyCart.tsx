import Link from "next/link";

export function EmptyCart() {
  return (
    <div className="py-16 text-center md:py-24">
      <h1 className="font-serif text-[28px] md:text-[34px] font-semibold leading-[1.12] text-burgundy">
        Sepetiniz henüz boş.
      </h1>
      <p className="mx-auto mt-3 max-w-md font-sans text-[15px] leading-relaxed text-warm-brown">
        Funda&apos;nın imza lezzetlerini ve kutlamalarınıza özel pastalarını keşfedin.
      </p>
      <Link
        href="/lezzetlerimiz"
        className="mt-7 inline-flex rounded-md bg-burgundy px-6 py-3 font-sans text-[14px] font-semibold text-cream-light transition-colors hover:bg-chocolate-light"
      >
        Lezzetleri Keşfet
      </Link>
    </div>
  );
}
