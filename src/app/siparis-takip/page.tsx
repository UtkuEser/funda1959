import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/shared/Container";

export const metadata: Metadata = {
  title: "Sipariş Takibi",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ order?: string }> };

export default async function OrderTrackingPage({ searchParams }: Props) {
  const { order } = await searchParams;

  return (
    <Container size="narrow" className="pt-28 pb-24 md:pt-32 text-center">
      <h1 className="font-serif text-[28px] md:text-[32px] font-semibold leading-[1.12] text-burgundy">
        Sipariş Takibi
      </h1>
      <p className="mx-auto mt-3 max-w-md font-sans text-[15px] leading-relaxed text-warm-brown">
        Sipariş durumu takip sistemi yakında burada olacak.
      </p>
      {order && (
        <p className="mt-4 font-sans text-[14px] text-espresso">
          Sipariş No: <span className="font-semibold text-burgundy">{order}</span>
        </p>
      )}
      <Link
        href="/lezzetlerimiz"
        className="mt-7 inline-flex font-sans text-[14px] font-semibold text-burgundy transition-colors hover:text-chocolate-light"
      >
        ← Alışverişe Dön
      </Link>
    </Container>
  );
}
