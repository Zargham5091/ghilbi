import { NextResponse } from "next/server";
import { changePassword, isAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!isAuthed()) return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as { current?: unknown; next?: unknown };
  const current = typeof b.current === "string" ? b.current : "";
  const next = typeof b.next === "string" ? b.next : "";
  if (next.length < 8 || next.length > 128) {
    return NextResponse.json({ error: "New password must be 8–128 characters." }, { status: 400 });
  }
  try {
    const r = await changePassword(current, next);
    if (r === "nodb") return NextResponse.json({ error: "MongoDB isn't connected." }, { status: 503 });
    if (r === "wrong") return NextResponse.json({ error: "Current password is wrong." }, { status: 403 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Couldn't update the password." }, { status: 500 });
  }
}
