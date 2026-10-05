"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession, getStaffSession } from "@/lib/auth";
import { getCatalog } from "@/lib/catalog";
import { createOrderRef, generateKey } from "@/lib/ids";
import { deliverKey, isBotConfigured } from "@/lib/bot";
import { getOrder, getSettings, insertOrder, orderEvent, saveProof, updateOrder } from "@/lib/store";
import { parsePrice } from "@/lib/price";
import type { Order } from "@/lib/types";

export async function createOrderAction(formData: FormData) {
  const user = await getSession();
  const productValue = String(formData.get("value") ?? "").trim();
  const checkoutPath = `/checkout/${encodeURIComponent(productValue)}`;

  if (!user) redirect(`/login?next=${encodeURIComponent(checkoutPath)}`);

  const settings = await getSettings();
  if (!settings.storeOpen) redirect(`${checkoutPath}?error=closed`);

  const catalog = await getCatalog();
  const product = catalog.products.find((item) => item.value === productValue);
  if (!product) redirect("/shop?error=unknown");

  const now = new Date().toISOString();
  const parsed = parsePrice(product.price);

  const draft: Order = {
    ref: createOrderRef(),
    guildId: process.env.CHRONOS_GUILD_ID ?? "",
    productValue: product.value,
    productLabel: product.label,
    productPrice: product.price,
    priceAmount: Number.isFinite(parsed.amount) ? parsed.amount : 0,
    durationDays: product.durationDays,
    buyerDiscordId: user.id,
    buyerUsername: user.username,
    buyerAvatar: user.avatarUrl,
    contact: String(formData.get("contact") ?? "").trim().slice(0, 120),
    note: String(formData.get("note") ?? "").trim().slice(0, 400),
    status: "pending",
    paymentMethod: "qris",
    proofPath: null,
    proofUploadedAt: null,
    deliveredKey: null,
    deliveredAt: null,
    deliveredBy: null,
    staffNote: null,
    createdAt: now,
    updatedAt: now,
    events: [orderEvent("Order created")],
  };

  // The ref is random — a collision is unlikely, but the primary key would reject it.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const created = await insertOrder(attempt === 0 ? draft : { ...draft, ref: createOrderRef() });
    if (created.ok) redirect(`/orders/${created.order.ref}?created=1`);
  }

  redirect(`${checkoutPath}?error=failed`);
}

export async function uploadProofAction(formData: FormData) {
  const user = await getSession();
  const ref = String(formData.get("ref") ?? "").trim();
  const orderPath = `/orders/${encodeURIComponent(ref)}`;

  if (!user) redirect(`/login?next=${encodeURIComponent(orderPath)}`);

  const file = formData.get("proof");
  if (!(file instanceof File) || file.size === 0) {
    redirect(`${orderPath}?upload=empty`);
  }

  const order = await getOrder(ref);
  if (!order || order.buyerDiscordId !== user.id) redirect(`${orderPath}?upload=denied`);
  if (order.status === "delivered") redirect(`${orderPath}?upload=locked`);

  const saved = await saveProof(ref, file);
  if (!saved.ok) redirect(`${orderPath}?upload=error`);

  await updateOrder(ref, {
    proofPath: saved.path,
    proofUploadedAt: new Date().toISOString(),
    status: "review",
    events: [...order.events, orderEvent("Payment proof uploaded", user.username)],
  });

  revalidatePath(orderPath);
  redirect(`${orderPath}?upload=ok`);
}

export async function deliverOrderAction(formData: FormData) {
  const staff = await getStaffSession();
  const ref = String(formData.get("ref") ?? "").trim();
  const adminPath = `/admin/orders?ref=${encodeURIComponent(ref)}`;

  if (!staff) redirect("/login?next=/admin/orders");
  if (!isBotConfigured) redirect(`${adminPath}&result=bot`);

  const order = await getOrder(ref);
  if (!order) redirect(`${adminPath}&result=missing`);
  if (order.status === "delivered") redirect(`${adminPath}&result=already`);

  const typedKey = String(formData.get("key") ?? "").trim();
  const key = typedKey || generateKey();

  const result = await deliverKey({
    userId: order.buyerDiscordId,
    key,
    productValue: order.productValue,
    actorId: staff.id,
  });

  if (!result.ok) {
    redirect(`${adminPath}&result=failed&error=${encodeURIComponent(result.error)}`);
  }

  await updateOrder(ref, {
    status: "delivered",
    deliveredKey: key,
    deliveredAt: new Date().toISOString(),
    deliveredBy: staff.displayName,
    events: [...order.events, orderEvent("Key released", staff.displayName)],
  });

  revalidatePath("/admin");
  revalidatePath(`/orders/${ref}`);

  if (result.data.warning) {
    redirect(`${adminPath}&result=partial&warning=${encodeURIComponent(result.data.warning)}`);
  }
  redirect(`${adminPath}&result=ok`);
}

export async function rejectOrderAction(formData: FormData) {
  const staff = await getStaffSession();
  const ref = String(formData.get("ref") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 300);
  const adminPath = `/admin/orders?ref=${encodeURIComponent(ref)}`;

  if (!staff) redirect("/login?next=/admin/orders");

  const order = await getOrder(ref);
  if (!order) redirect(`${adminPath}&result=missing`);

  await updateOrder(ref, {
    status: "rejected",
    staffNote: reason || order.staffNote,
    events: [...order.events, orderEvent("Payment rejected", staff.displayName)],
  });

  revalidatePath("/admin");
  revalidatePath(`/orders/${ref}`);
  redirect(`${adminPath}&result=rejected`);
}

export async function saveStaffNoteAction(formData: FormData) {
  const staff = await getStaffSession();
  const ref = String(formData.get("ref") ?? "").trim();
  const note = String(formData.get("staffNote") ?? "").trim().slice(0, 400);
  const adminPath = `/admin/orders?ref=${encodeURIComponent(ref)}`;

  if (!staff) redirect("/login?next=/admin/orders");

  const order = await getOrder(ref);
  if (!order) redirect(`${adminPath}&result=missing`);

  await updateOrder(ref, { staffNote: note });
  revalidatePath("/admin");
  redirect(`${adminPath}&result=saved`);
}
