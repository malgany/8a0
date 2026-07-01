import { notFound } from "next/navigation";
import { OnlineClient } from "@/components/OnlineClient";
import { normalizeLocale } from "@/lib/i18n";

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "es" }];
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (rawLocale !== "en" && rawLocale !== "es") notFound();
  return <OnlineClient locale={normalizeLocale(rawLocale)} />;
}
