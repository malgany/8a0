import { notFound } from "next/navigation";
import { PlayClient } from "@/components/PlayClient";
import { normalizeLocale } from "@/lib/i18n";
import { resolveShareCode } from "@/lib/shares-server";

export default async function Page({ params }: { params: Promise<{ locale: string; code: string }> }) {
  const { locale: rawLocale, code } = await params;
  if (rawLocale !== "en" && rawLocale !== "es") notFound();
  const resolved = await resolveShareCode(decodeURIComponent(code));
  return <PlayClient locale={normalizeLocale(rawLocale)} sharedCode={resolved} />;
}
