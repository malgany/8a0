import { getSupabaseAdmin } from "./supabase";

export async function resolveShareCode(code: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return code;
  const { data, error } = await supabase.from("shares").select("code").eq("slug", code).maybeSingle();
  if (error || !data?.code) return code;
  return data.code as string;
}
