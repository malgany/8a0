import { notFound } from "next/navigation";
import { PrivacyPage } from "@/components/PrivacyPage";
import { SiteFooter } from "@/components/SiteFooter";
import { normalizeLocale } from "@/lib/i18n";

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "es" }];
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (rawLocale !== "en" && rawLocale !== "es") notFound();
  const locale = normalizeLocale(rawLocale);
  return (
    <>
      <PrivacyPage locale={locale} />
      <SiteFooter locale={locale} />
    </>
  );
}
