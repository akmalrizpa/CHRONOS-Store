import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getLocale } from "@/lib/locale";
import { createTranslator } from "@/i18n/dictionary";
import "./globals.css";

const STORE_NAME = process.env.STORE_NAME || "CHRONOS Store";
const STORE_URL = process.env.PUBLIC_ORIGIN || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(STORE_URL),
  title: {
    default: `${STORE_NAME} — premium access delivered through Discord`,
    template: `%s · ${STORE_NAME}`,
  },
  description:
    "Browse the catalog, pay, and get your key in a Discord DM. The bot grants the role and takes it back when the duration ends.",
  robots: { index: true, follow: true },
};

export const viewport = {
  themeColor: "#0e1013",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const { t } = createTranslator(locale);

  return (
    <html lang={locale}>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-card focus:bg-accent focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink"
        >
          {t("nav.shop")}
        </a>
        <Header locale={locale} />
        <main id="content" className="flex-1">
          {children}
        </main>
        <Footer locale={locale} />
      </body>
    </html>
  );
}
