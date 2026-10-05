"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getStaffSession } from "@/lib/auth";
import { clearCatalogCache } from "@/lib/catalog";
import {
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  updateCategory,
  updateProduct,
} from "@/lib/bot";
import { deleteProductMeta, saveProductMeta, saveSettings, setCustomerRole } from "@/lib/store";
import type { CustomerRole, StoreSettings } from "@/lib/types";

function text(formData: FormData, key: string, max = 200): string {
  return String(formData.get(key) ?? "").trim().slice(0, max);
}

function number(formData: FormData, key: string, fallback = 0): number {
  const value = Number(String(formData.get(key) ?? "").trim());
  return Number.isFinite(value) ? value : fallback;
}

/** Product IDs end up in Discord customIds, so they stay [a-z0-9_-]. */
function slugify(label: string): string {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return slug || `produk-${Date.now().toString(36)}`;
}

function go(path: string, params: Record<string, string | undefined> = {}): never {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value) search.set(key, value);
  const query = search.toString();
  redirect(query ? `${path}?${query}` : path);
}

export async function createProductAction(formData: FormData) {
  const staff = await getStaffSession();
  if (!staff) redirect("/login?next=/admin/products");

  const label = text(formData, "label", 80);
  if (!label) go("/admin/products", { result: "nolabel" });

  const value = text(formData, "value", 50) || slugify(label);
  const roleId = text(formData, "roleId", 30);

  const result = await createProduct({
    label,
    value,
    price: text(formData, "price", 60),
    category: text(formData, "category", 30),
    requiresKey: formData.get("requiresKey") === "on",
    roleId: roleId || undefined,
    days: roleId ? number(formData, "days") : undefined,
    actorId: staff.id,
  });

  if (!result.ok) go("/admin/products", { result: "failed", error: result.error });

  await saveProductMeta(value, {
    promoLabel: text(formData, "promoLabel", 24) || null,
    featured: formData.get("featured") === "on",
  });

  clearCatalogCache();
  revalidatePath("/", "layout");
  go("/admin/products", { result: "created", value });
}

export async function updateProductAction(formData: FormData) {
  const staff = await getStaffSession();
  if (!staff) redirect("/login?next=/admin/products");

  const value = text(formData, "value", 50);
  if (!value) go("/admin/products", { result: "missing" });

  const roleId = text(formData, "roleId", 30);

  const result = await updateProduct(value, {
    label: text(formData, "label", 80),
    price: text(formData, "price", 60),
    category: text(formData, "category", 30),
    requiresKey: formData.get("requiresKey") === "on",
    // An empty roleId is how the bot clears the auto-role + duration.
    roleId,
    days: roleId ? number(formData, "days") : 0,
    actorId: staff.id,
  });

  if (!result.ok) go("/admin/products", { result: "failed", value, error: result.error });

  await saveProductMeta(value, {
    promoLabel: text(formData, "promoLabel", 24) || null,
    featured: formData.get("featured") === "on",
  });

  clearCatalogCache();
  revalidatePath("/", "layout");
  go("/admin/products", { result: "updated", value });
}

export async function deleteProductAction(formData: FormData) {
  const staff = await getStaffSession();
  if (!staff) redirect("/login?next=/admin/products");

  const value = text(formData, "value", 50);
  if (!value) go("/admin/products", { result: "missing" });

  const result = await deleteProduct(value, staff.id);
  if (!result.ok) go("/admin/products", { result: "failed", value, error: result.error });

  await deleteProductMeta(value);
  clearCatalogCache();
  revalidatePath("/", "layout");
  go("/admin/products", { result: "deleted", value });
}

export async function createCategoryAction(formData: FormData) {
  const staff = await getStaffSession();
  if (!staff) redirect("/login?next=/admin/products");

  const label = text(formData, "label", 80);
  if (!label) go("/admin/products", { result: "nolabel", tab: "categories" });

  const result = await createCategory({
    label,
    id: text(formData, "id", 30) || slugify(label).slice(0, 30),
    emoji: text(formData, "emoji", 40),
    style: text(formData, "style", 12) || "Primary",
    requiresKey: formData.get("requiresKey") === "on",
    actorId: staff.id,
  });

  if (!result.ok) go("/admin/products", { result: "failed", tab: "categories", error: result.error });

  clearCatalogCache();
  revalidatePath("/", "layout");
  go("/admin/products", { result: "categoryCreated", tab: "categories" });
}

export async function updateCategoryAction(formData: FormData) {
  const staff = await getStaffSession();
  if (!staff) redirect("/login?next=/admin/products");

  const id = text(formData, "id", 30);
  if (!id) go("/admin/products", { result: "missing", tab: "categories" });

  const result = await updateCategory(id, {
    label: text(formData, "label", 80),
    emoji: text(formData, "emoji", 40),
    style: text(formData, "style", 12) || "Primary",
    requiresKey: formData.get("requiresKey") === "on",
    actorId: staff.id,
  });

  if (!result.ok) go("/admin/products", { result: "failed", tab: "categories", error: result.error });

  clearCatalogCache();
  revalidatePath("/", "layout");
  go("/admin/products", { result: "categoryUpdated", tab: "categories" });
}

export async function deleteCategoryAction(formData: FormData) {
  const staff = await getStaffSession();
  if (!staff) redirect("/login?next=/admin/products");

  const id = text(formData, "id", 30);
  if (!id) go("/admin/products", { result: "missing", tab: "categories" });

  const result = await deleteCategory(id, staff.id);
  if (!result.ok) go("/admin/products", { result: "failed", tab: "categories", error: result.error });

  clearCatalogCache();
  revalidatePath("/", "layout");
  go("/admin/products", { result: "categoryDeleted", tab: "categories" });
}

export async function setCustomerRoleAction(formData: FormData) {
  const staff = await getStaffSession();
  if (!staff) redirect("/login?next=/admin/customers");

  const discordId = text(formData, "discordId", 30);
  const role: CustomerRole = text(formData, "role", 12) === "admin" ? "admin" : "customer";

  if (!discordId) go("/admin/customers", { result: "missing" });
  if (discordId === staff.id && role === "customer") go("/admin/customers", { result: "self" });

  await setCustomerRole(discordId, role);
  revalidatePath("/admin/customers");
  go("/admin/customers", { result: "role" });
}

export async function saveSettingsAction(formData: FormData) {
  const staff = await getStaffSession();
  if (!staff) redirect("/login?next=/admin/settings");

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
  go("/admin/settings", { saved: "1" });
}
