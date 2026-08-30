import type { OrderStatus } from "@/lib/order";
import { STATUS_TONE_CLASS, orderStatusLabel, orderStatusTone } from "@/lib/order-status";

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-sm px-2 py-0.5 font-sans text-[12px] font-semibold ${STATUS_TONE_CLASS[orderStatusTone(status)]}`}
    >
      {orderStatusLabel(status)}
    </span>
  );
}
