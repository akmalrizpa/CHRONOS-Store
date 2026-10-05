import type { OrderStatus } from "@/lib/types";
import type { Translator } from "@/i18n/dictionary";
import { statusStyles } from "./ui";

export default function OrderStatusBadge({ status, t }: { status: OrderStatus; t: Translator["t"] }) {
  return (
    <span
      className={`inline-flex items-center rounded-card px-2.5 py-1 font-mono text-xs font-semibold ${statusStyles[status]}`}
    >
      {t(`order.status.${status}`)}
    </span>
  );
}
