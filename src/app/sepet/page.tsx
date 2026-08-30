import type { Metadata } from "next";
import { CartPage } from "@/components/cart/CartPage";

export const metadata: Metadata = {
  title: "Sepetim",
  robots: { index: false, follow: true },
};

export default function SepetPage() {
  return <CartPage />;
}
