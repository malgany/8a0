import { getSupabaseAdmin } from "./supabase";
import { decodeSharePayload } from "./share";

export async function resolveShareCode(code: string) {
  if (decodeSharePayload(code)) return code;
  const supabase = getSupabaseAdmin();
  if (!supabase) return code;
  const { data, error } = await supabase.from("shares").select("code").eq("slug", code).maybeSingle();
  if (error || !data?.code) return code;
  return data.code as string;
}
