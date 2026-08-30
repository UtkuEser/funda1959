import type { Metadata } from "next";
import { OrderConfirmation } from "@/components/checkout/OrderConfirmation";
import { getOrderSummary } from "@/lib/supabase-server";
import type { OrderSummary } from "@/lib/order";

export const metadata: Metadata = {
  title: "Siparişiniz Alındı",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ order?: string }> };

export default async function OrderSuccessPage({ searchParams }: Props) {
  const { order: orderNumber } = await searchParams;

  let summary: OrderSummary | null = null;
  if (orderNumber) {
    try {
      summary = await getOrderSummary(orderNumber);
    } catch {
      summary = null;
    }
  }

  return <OrderConfirmation order={summary} />;
}
