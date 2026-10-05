"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { createId } from "@/lib/ids";
import { getOrder, getReviewByOrder, insertReview } from "@/lib/store";

export async function submitReviewAction(formData: FormData) {
  const user = await getSession();
  const ref = String(formData.get("ref") ?? "").trim();
  const orderPath = `/orders/${encodeURIComponent(ref)}`;

  if (!user) redirect(`/login?next=${encodeURIComponent(orderPath)}`);

  const order = await getOrder(ref);
  if (!order || order.buyerDiscordId !== user.id) redirect(`${orderPath}?review=denied`);
  if (order.status !== "delivered") redirect(`${orderPath}?review=notdelivered`);

  const existing = await getReviewByOrder(ref);
  if (existing) redirect(`${orderPath}?review=exists`);

  const rating = Math.min(5, Math.max(1, Number(formData.get("rating") ?? 5) || 5));
  const body = String(formData.get("body") ?? "").trim().slice(0, 600);

  const result = await insertReview({
    id: createId("rev"),
    orderRef: ref,
    productValue: order.productValue,
    productLabel: order.productLabel,
    buyerUsername: order.buyerUsername,
    rating,
    body,
    createdAt: new Date().toISOString(),
  });

  revalidatePath("/reviews");
  revalidatePath(orderPath);
  redirect(`${orderPath}?review=${result.ok ? "ok" : "exists"}`);
}
