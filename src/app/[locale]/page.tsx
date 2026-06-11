import { notFound } from "next/navigation";
import { HomePage } from "@/components/HomePage";
import { SiteFooter } from "@/components/SiteFooter";
import { normalizeLocale } from "@/lib/i18n";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (rawLocale !== "en" && rawLocale !== "es") notFound();
  const locale = normalizeLocale(rawLocale);
  return (
    <>
      <HomePage locale={locale} />
      <SiteFooter locale={locale} />
    </>
  );
}
