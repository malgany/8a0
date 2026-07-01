import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

type OnlineTeamPayload = {
  guestId?: string;
  team?: {
    name?: string;
    flagPixels?: unknown;
  };
  draft?: unknown;
};

function cleanGuestId(value: unknown) {
  return typeof value === "string" && /^[a-zA-Z0-9_-]{8,80}$/.test(value) ? value : null;
}

function cleanTeamName(value: unknown) {
  return typeof value === "string" ? value.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 20) : "";
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as OnlineTeamPayload | null;
  const supabase = getSupabaseAdmin();
  if (!body?.team) return NextResponse.json({ error: "Missing team" }, { status: 400 });

  const name = cleanTeamName(body.team.name);
  if (name.length < 2) return NextResponse.json({ error: "Invalid team name" }, { status: 400 });

  if (!supabase) {
    return NextResponse.json({ persisted: false });
  }

  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1] ?? null;
  let profile:
    | {
        id: string;
        provider: "guest" | "google";
        auth_user_id: string | null;
      }
    | null = null;

  if (token) {
    const { data, error } = await supabase.auth.getUser(token);
    if (!error && data.user) {
      profile = { id: `google:${data.user.id}`, provider: "google", auth_user_id: data.user.id };
    }
  }

  if (!profile) {
    const guestId = cleanGuestId(body.guestId);
    if (!guestId) return NextResponse.json({ error: "Missing identity" }, { status: 401 });
    profile = { id: `guest:${guestId}`, provider: "guest", auth_user_id: null };
  }

  const now = new Date().toISOString();
  const { error: profileError } = await supabase.from("online_profiles").upsert(
    {
      id: profile.id,
      provider: profile.provider,
      auth_user_id: profile.auth_user_id,
      updated_at: now,
    },
    { onConflict: "id" },
  );

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  const { error: teamError } = await supabase.from("online_teams").upsert(
    {
      profile_id: profile.id,
      team_name: name,
      flag_pixels: Array.isArray(body.team.flagPixels) ? body.team.flagPixels : [],
      draft: body.draft ?? null,
      updated_at: now,
    },
    { onConflict: "profile_id" },
  );

  if (teamError) return NextResponse.json({ error: teamError.message }, { status: 500 });
  return NextResponse.json({ persisted: true, profileId: profile.id });
}
