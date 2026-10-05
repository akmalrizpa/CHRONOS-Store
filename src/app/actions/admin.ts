"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getStaffSession } from "@/lib/auth";
import { clearCatalogCache } from "@/lib/catalog";
import { saveProductMeta, saveSettings } from "@/lib/store";
import type { StoreSettings } from "@/lib/types";

function text(formData: FormData, key: string, max = 200): string {
  return String(formData.get(key) ?? "").trim().slice(0, max);
}

export async function saveProductMetaAction(formData: FormData) {
  const staff = await getStaffSession();
  if (!staff) redirect("/login?next=/admin");

  const value = text(formData, "value", 60);
  if (value) {
    await saveProductMeta(value, {
      promoLabel: text(formData, "promoLabel", 24) || null,
      featured: formData.get("featured") === "on",
    });
  }

  clearCatalogCache();
  revalidatePath("/", "layout");
  redirect("/admin?tab=promos&saved=1");
}

export async function saveSettingsAction(formData: FormData) {
  const staff = await getStaffSession();
  if (!staff) redirect("/login?next=/admin");

  const patch: Partial<StoreSettings> = {
    qrisImageUrl: text(formData, "qrisImageUrl", 500),
    paymentNote: text(formData, "paymentNote", 400),
    supportHours: text(formData, "supportHours", 80),
    whatsappUrl: text(formData, "whatsappUrl", 300),
    telegramUrl: text(formData, "telegramUrl", 300),
    discordInviteUrl: text(formData, "discordInviteUrl", 300),
    currencyLabel: text(formData, "currencyLabel", 12),
    storeOpen: formData.get("storeOpen") === "on",
    promoBanner: text(formData, "promoBanner", 160),
  };

  await saveSettings(patch);
  revalidatePath("/", "layout");
  redirect("/admin?tab=settings&saved=1");
}
