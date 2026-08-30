import type { OrderStatus } from "@/lib/order";
import { DELIVERY_TIMELINE, PICKUP_TIMELINE, orderStatusLabel } from "@/lib/order-status";

export function OrderTimeline({
  status,
  deliveryType,
}: {
  status: OrderStatus;
  deliveryType: "delivery" | "pickup";
}) {
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-taupe" aria-hidden />
        <span className="font-sans text-[13.5px] font-semibold text-taupe">İptal Edildi</span>
      </div>
    );
  }

  const steps = deliveryType === "pickup" ? PICKUP_TIMELINE : DELIVERY_TIMELINE;
  const currentIndex = steps.indexOf(status);

  return (
    <ol className="space-y-3">
      {steps.map((step, i) => {
        const done = currentIndex >= 0 && i <= currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <li key={step} className="flex items-center gap-3">
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                done ? "bg-burgundy" : "bg-sand"
              }`}
              aria-hidden
            />
            <span
              className={`font-sans text-[13.5px] ${
                isCurrent
                  ? "font-semibold text-burgundy"
                  : done
                    ? "text-espresso"
                    : "text-taupe"
              }`}
            >
              {orderStatusLabel(step)}
              {isCurrent && <span className="sr-only"> (mevcut durum)</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
