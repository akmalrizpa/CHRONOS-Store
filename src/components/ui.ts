export const pageShell = "mx-auto w-full max-w-6xl px-5";
export const pageShellWide = "mx-auto w-full max-w-7xl px-5";
export const pageTop = "mx-auto w-full max-w-6xl px-5 pt-10 pb-20";

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-card bg-accent px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50";
export const btnSoft =
  "inline-flex items-center justify-center gap-2 rounded-card bg-panel-2 px-4 py-2.5 text-sm font-semibold text-paper transition hover:bg-line disabled:cursor-not-allowed disabled:opacity-50";
export const btnOutline =
  "inline-flex items-center justify-center gap-2 rounded-card border border-line px-4 py-2.5 text-sm font-semibold text-paper transition hover:border-muted disabled:cursor-not-allowed disabled:opacity-50";
export const btnDanger =
  "inline-flex items-center justify-center gap-2 rounded-card border border-danger/60 px-3 py-2 text-xs font-semibold text-danger transition hover:bg-danger-soft disabled:cursor-not-allowed disabled:opacity-50";
export const btnTiny =
  "inline-flex items-center justify-center gap-1.5 rounded-card border border-line px-2.5 py-1.5 font-mono text-xs font-semibold text-muted transition hover:border-muted hover:text-paper";

export const panel = "rounded-card border border-line bg-panel";
export const field =
  "w-full rounded-card border border-line bg-panel-2 px-3.5 py-2.5 text-base text-paper outline-none transition placeholder:text-muted/60 focus:border-accent sm:text-sm";
export const label = "block text-xs font-semibold uppercase tracking-[0.14em] text-muted";
export const pill = "inline-flex items-center gap-1.5 rounded-card border border-line px-2.5 py-1 font-mono text-xs text-muted";
export const badgePromo = "inline-flex items-center rounded-card bg-accent-soft px-2 py-0.5 font-mono text-xs font-semibold text-accent";
export const badgeOk = "inline-flex items-center rounded-card bg-ok-soft px-2 py-0.5 font-mono text-xs font-semibold text-ok";
export const badgeDanger = "inline-flex items-center rounded-card bg-danger-soft px-2 py-0.5 font-mono text-xs font-semibold text-danger";
export const badgeMuted = "inline-flex items-center rounded-card bg-panel-2 px-2 py-0.5 font-mono text-xs font-semibold text-muted";

export const sectionTitle = "text-2xl font-semibold sm:text-3xl";
export const sectionLead = "mt-2 max-w-2xl text-sm leading-relaxed text-muted";
export const eyebrow = "font-mono text-xs uppercase tracking-[0.18em] text-muted";
export const mono = "font-mono";
export const cardTitle = "text-base font-semibold";

export const statusStyles: Record<string, string> = {
  pending: "bg-panel-2 text-muted",
  review: "bg-accent-soft text-accent",
  delivered: "bg-ok-soft text-ok",
  rejected: "bg-danger-soft text-danger",
};
