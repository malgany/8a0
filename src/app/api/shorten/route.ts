import { NextResponse } from "next/server";
import { compactSlug } from "@/lib/share";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { code?: string } | null;
  const code = body?.code;
  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  const slug = compactSlug(code);
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ slug: code, persisted: false });
  }

  const { error } = await supabase.from("shares").upsert({ slug, code }, { onConflict: "slug" });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ slug, persisted: true });
}
