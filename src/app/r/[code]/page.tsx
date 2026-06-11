import { PlayClient } from "@/components/PlayClient";
import { resolveShareCode } from "@/lib/shares-server";

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const resolved = await resolveShareCode(decodeURIComponent(code));
  return <PlayClient locale="pt" sharedCode={resolved} />;
}
