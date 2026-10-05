import { field, label } from "@/components/ui";
import type { Translator } from "@/i18n/dictionary";
import type { BotRole } from "@/lib/bot";
import type { BotCategory } from "@/lib/types";

const STYLES = ["Primary", "Secondary", "Success", "Danger"];

export function CategorySelect({
  t,
  categories,
  selected,
  id,
}: {
  t: Translator["t"];
  categories: BotCategory[];
  selected?: string;
  id: string;
}) {
  const known = Boolean(selected) && categories.some((category) => category.id === selected);

  return (
    <div>
      <label className={label} htmlFor={id}>
        {t("admin.prodCategory")}
      </label>
      <select id={id} name="category" defaultValue={selected ?? ""} className={`${field} mt-2`}>
        {categories.length === 0 && <option value="">{t("admin.prodNoCategory")}</option>}
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.label}
          </option>
        ))}
        {selected && !known && <option value={selected}>{selected}</option>}
      </select>
    </div>
  );
}

export function RoleSelect({
  t,
  roles,
  selected,
  days,
}: {
  t: Translator["t"];
  roles: BotRole[];
  selected?: string;
  days?: number;
}) {
  const known = Boolean(selected) && roles.some((role) => role.id === selected);

  return (
    <div className="grid gap-4 sm:grid-cols-[1.6fr_1fr]">
      <div>
        <label className={label} htmlFor="roleId">
          {t("admin.prodRole")}
        </label>
        <select id="roleId" name="roleId" defaultValue={selected ?? ""} className={`${field} mt-2`}>
          <option value="">{t("admin.prodRoleNone")}</option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
          {selected && !known && <option value={selected}>{t("admin.prodRoleUnknown", { id: selected })}</option>}
        </select>
        <p className="mt-1.5 text-xs text-muted">
          {roles.length === 0 ? t("admin.prodRoleNoBot") : t("admin.prodRoleHint")}
        </p>
      </div>

      <div>
        <label className={label} htmlFor="days">
          {t("admin.prodDays")}
        </label>
        <input
          id="days"
          name="days"
          type="number"
          min={0}
          max={3650}
          defaultValue={days ?? 0}
          className={`${field} mt-2 font-mono`}
        />
        <p className="mt-1.5 text-xs text-muted">{t("admin.prodDaysHint")}</p>
      </div>
    </div>
  );
}

export function PriceInput({
  t,
  value,
  id,
  preview,
}: {
  t: Translator["t"];
  value: string;
  id: string;
  preview?: string;
}) {
  return (
    <div>
      <label className={label} htmlFor={id}>
        {t("admin.prodPrice")}
      </label>
      <input
        id={id}
        name="price"
        defaultValue={value}
        maxLength={60}
        placeholder="Rp 50.000 · 30rb · $3"
        className={`${field} mt-2 font-mono`}
      />
      <p className="mt-1.5 text-xs text-muted">
        {t("admin.prodPriceHint")}
        {preview && <span className="ml-2 text-accent">{preview}</span>}
      </p>
    </div>
  );
}

export function StyleSelect({ t, selected, id }: { t: Translator["t"]; selected?: string; id: string }) {
  return (
    <div>
      <label className={label} htmlFor={id}>
        {t("admin.catStyle")}
      </label>
      <select id={id} name="style" defaultValue={selected ?? "Primary"} className={`${field} mt-2`}>
        {STYLES.map((style) => (
          <option key={style} value={style}>
            {style}
          </option>
        ))}
      </select>
    </div>
  );
}
